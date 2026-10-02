import { MutationType } from '../types';

/**
 * Stock "buckets" a sparepart can be in. `null` means outside the warehouse.
 * Every mutation moves qty from `stok_asal` to `stok_tujuan`:
 *
 *   Masuk         null             -> baru | bekas | rusak   (condition chosen per line)
 *   Pakai         baru | bekas     -> null                   (stock chosen per line)
 *   Serah Terima  null             -> baru | bekas | rusak   (terima)
 *                 baru|bekas|rusak -> null                   (serahkan)
 *
 * Legacy types, no longer offered in the forms but still counted when present:
 *   Bekas         null            -> bekas
 *   Rusak         baru | bekas    -> rusak
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

/** Transaction types offered in the forms (Bekas and Rusak are legacy, see header comment). */
export const ACTIVE_MUTATION_TYPES: MutationType[] = ['Masuk', 'Pakai', 'Serah Terima'];

/** Conditions a line can have per type: Pakai cannot install a broken part. */
export const kondisiOptions = (type: MutationType): StockBucket[] =>
  type === 'Pakai' ? ['baru', 'bekas'] : ['baru', 'bekas', 'rusak'];

/** Options chosen in the transaction form for the types that need them. */
export interface FlowOptions {
  /** Legacy 'Rusak' rows only */
  rusakAsal: 'baru' | 'bekas';
  arah: SerahTerimaArah;
  /** Masuk: condition received · Pakai: stock taken from · Serah Terima: condition handed over/received */
  kondisi: StockBucket;
}

/** Builds the flow that is written to the database for a new / edited mutation. */
export const resolveStockFlow = (type: MutationType, opts: FlowOptions): StockFlow => {
  switch (type) {
    case 'Masuk':
      return { asal: null, tujuan: opts.kondisi };
    case 'Pakai':
      return { asal: opts.kondisi === 'bekas' ? 'bekas' : 'baru', tujuan: null };
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

/**
 * Short label under the transaction badge in the history table: the condition for Masuk /
 * Pakai ("Baru", "Bekas", "Rusak") and the direction for Serah Terima ("Serahkan", "Terima").
 */
export const describeFlowShort = (m: FlowInput): string => {
  if (isIncompleteSerahTerima(m)) return 'Arah belum diisi (tidak mengubah stok)';
  const { asal, tujuan } = getEffectiveFlow(m);
  if (m.mutation_type === 'Serah Terima') return asal ? 'Serahkan' : 'Terima';
  const bucket = tujuan ?? asal;
  return bucket ? bucket.charAt(0).toUpperCase() + bucket.slice(1) : '-';
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

/** Stock that can still be installed: baru + bekas (Pakai can take from both). */
export const usableStock = (sp: { stok_aktual: number; stok_bekas: number }): number =>
  Math.max(0, sp.stok_aktual) + Math.max(0, sp.stok_bekas);

/** The only definition of low stock: usable stock (baru + bekas) at or below the minimum. */
export const isLowStock = (stokTersedia: number, minimumStok: number): boolean =>
  stokTersedia <= minimumStok;
