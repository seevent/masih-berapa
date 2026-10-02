import { MutationType } from '../types';

export interface StockDelta {
  baru: number;
  bekas: number;
}

/**
 * Effect of one mutation on stock:
 * - Masuk: +stok baru, Pakai: -stok baru
 * - Bekas: +stok bekas, Rusak: -stok bekas (afkir dari stok bekas)
 * - Serah Terima: no stock effect (same as the current_stock view)
 */
export const getMutationDelta = (type: MutationType | string, qty: number): StockDelta => {
  const q = Number(qty) || 0;
  switch (type) {
    case 'Masuk':
      return { baru: q, bekas: 0 };
    case 'Pakai':
      return { baru: -q, bekas: 0 };
    case 'Bekas':
      return { baru: 0, bekas: q };
    case 'Rusak':
      return { baru: 0, bekas: -q };
    default:
      return { baru: 0, bekas: 0 };
  }
};

/** Change of total physical stock (baru + bekas) caused by one mutation. */
export const getTotalStockDelta = (type: MutationType | string, qty: number): number => {
  const d = getMutationDelta(type, qty);
  return d.baru + d.bekas;
};

/** Sums stock per sparepart from a list of mutations. */
export const computeStockBySparepart = (
  mutations: Array<{ sparepart_id: string; mutation_type: MutationType | string; qty: number }>
): Record<string, StockDelta> => {
  const result: Record<string, StockDelta> = {};
  mutations.forEach((m) => {
    if (!m.sparepart_id) return;
    const d = getMutationDelta(m.mutation_type, m.qty);
    const cur = result[m.sparepart_id] || { baru: 0, bekas: 0 };
    result[m.sparepart_id] = { baru: cur.baru + d.baru, bekas: cur.bekas + d.bekas };
  });
  return result;
};

export const isLowStock = (stokAktual: number, minimumStok: number): boolean =>
  stokAktual <= minimumStok;
