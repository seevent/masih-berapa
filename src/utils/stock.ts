import { MutationType } from '../types';

/**
 * Stock "buckets" a sparepart can be in. `null` means outside the warehouse.
 * Every mutation moves qty from `stok_asal` to `stok_tujuan`:
 *
 *   Masuk         null            -> baru
 *   Pakai         baru            -> null
 *   Bekas         null            -> bekas
 *   Rusak         baru | bekas    -> rusak
 *   Serah Terima  null            -> baru | bekas | rusak   (terima)
 *                 baru|bekas|rusak -> null                  (serahkan)
 *
 * Same rules as the `current_stock` view (docs/migrations/2026-10-02_aliran_stok.sql).
 */
export type StockBucket = 'baru' | 'bekas' | 'rusak';
export type SerahTerimaArah = 'terima' | 'serah';

export interface StockFlow {
  asal: StockBucket | null;
  tujuan: StockBucket | null;
}

export interface StockDelta {
  baru: number;
  bekas: number;
  rusak: number;
}

export const STOCK_BUCKET_LABEL: Record<StockBucket, string> = {
  baru: 'Stok Baru',
  bekas: 'Stok Bekas',
  rusak: 'Stok Rusak'
};

const BUCKETS: StockBucket[] = ['baru', 'bekas', 'rusak'];
const isBucket = (v: unknown): v is StockBucket => BUCKETS.includes(v as StockBucket);

interface FlowInput {
  mutation_type: MutationType | string;
  stok_asal?: string | null;
  stok_tujuan?: string | null;
}

/**
 * Flow of a stored mutation. Rows written without stok_asal/stok_tujuan (older rows or
 * other applications) fall back to the default of their type; a 'Serah Terima' without
 * direction has no stock effect.
 */
export const getEffectiveFlow = (m: FlowInput): StockFlow => {
  const defaults: Record<string, StockFlow> = {
    Masuk: { asal: null, tujuan: 'baru' },
    Pakai: { asal: 'baru', tujuan: null },
    Bekas: { asal: null, tujuan: 'bekas' },
    Rusak: { asal: 'bekas', tujuan: 'rusak' }
  };
  const fallback = defaults[m.mutation_type] || { asal: null, tujuan: null };
  return {
    asal: isBucket(m.stok_asal) ? m.stok_asal : fallback.asal,
    tujuan: isBucket(m.stok_tujuan) ? m.stok_tujuan : fallback.tujuan
  };
};

/** True when a 'Serah Terima' row has no direction yet (written by another tool). */
export const isIncompleteSerahTerima = (m: FlowInput): boolean =>
  m.mutation_type === 'Serah Terima' && !isBucket(m.stok_asal) && !isBucket(m.stok_tujuan);

/** Options chosen in the transaction form for the types that need them. */
export interface FlowOptions {
  rusakAsal: 'baru' | 'bekas';
  arah: SerahTerimaArah;
  kondisi: StockBucket;
}

/** Builds the flow that is written to the database for a new / edited mutation. */
export const resolveStockFlow = (type: MutationType, opts: FlowOptions): StockFlow => {
  switch (type) {
    case 'Masuk':
      return { asal: null, tujuan: 'baru' };
    case 'Pakai':
      return { asal: 'baru', tujuan: null };
    case 'Bekas':
      return { asal: null, tujuan: 'bekas' };
    case 'Rusak':
      return { asal: opts.rusakAsal, tujuan: 'rusak' };
    case 'Serah Terima':
      return opts.arah === 'terima'
        ? { asal: null, tujuan: opts.kondisi }
        : { asal: opts.kondisi, tujuan: null };
  }
};

/** Inverse of resolveStockFlow: form options that reproduce a stored mutation. */
export const flowToOptions = (m: FlowInput): FlowOptions => {
  const flow = getEffectiveFlow(m);
  return {
    rusakAsal: flow.asal === 'baru' ? 'baru' : 'bekas',
    arah: flow.asal ? 'serah' : 'terima',
    kondisi: flow.asal || flow.tujuan || 'baru'
  };
};

/** Human readable flow, e.g. "Baru → Rusak", "Bekas → keluar gudang". */
export const describeFlow = (m: FlowInput): string => {
  if (isIncompleteSerahTerima(m)) return 'Arah belum diisi (tidak mengubah stok)';
  const { asal, tujuan } = getEffectiveFlow(m);
  const label = (b: StockBucket | null, outside: string) =>
    b ? b.charAt(0).toUpperCase() + b.slice(1) : outside;
  return `${label(asal, 'Luar gudang')} → ${label(tujuan, 'Keluar gudang')}`;
};

/** Effect of one mutation on each stock bucket. */
export const getMutationDelta = (m: FlowInput & { qty: number }): StockDelta => {
  const q = Number(m.qty) || 0;
  const delta: StockDelta = { baru: 0, bekas: 0, rusak: 0 };
  const { asal, tujuan } = getEffectiveFlow(m);
  if (asal) delta[asal] -= q;
  if (tujuan) delta[tujuan] += q;
  return delta;
};

/** Change of usable stock (baru + bekas) caused by one mutation. */
export const getUsableStockDelta = (m: FlowInput & { qty: number }): number => {
  const d = getMutationDelta(m);
  return d.baru + d.bekas;
};

/** Sums stock per sparepart from a list of mutations. */
export const computeStockBySparepart = (
  mutations: Array<FlowInput & { sparepart_id: string; qty: number }>
): Record<string, StockDelta> => {
  const result: Record<string, StockDelta> = {};
  mutations.forEach((m) => {
    if (!m.sparepart_id) return;
    const d = getMutationDelta(m);
    const cur = result[m.sparepart_id] || { baru: 0, bekas: 0, rusak: 0 };
    result[m.sparepart_id] = {
      baru: cur.baru + d.baru,
      bekas: cur.bekas + d.bekas,
      rusak: cur.rusak + d.rusak
    };
  });
  return result;
};

/** Returns an error message when a bucket would go negative, otherwise null. */
export const findNegativeStock = (stock: StockDelta): string | null => {
  for (const b of BUCKETS) {
    if (stock[b] < 0) {
      return `${STOCK_BUCKET_LABEL[b]} akan menjadi ${stock[b]}. Transaksi ini membuat ${STOCK_BUCKET_LABEL[b].toLowerCase()} minus.`;
    }
  }
  return null;
};

export const isLowStock = (stokAktual: number, minimumStok: number): boolean =>
  stokAktual <= minimumStok;
