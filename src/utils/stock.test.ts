import { describe, expect, it } from 'vitest';
import {
  computeStockBySparepart,
  describeFlow,
  describeFlowShort,
  findNegativeStock,
  flowToOptions,
  getEffectiveFlow,
  kondisiOptions,
  resolveStockFlow
} from './stock';

const opts = (kondisi: 'baru' | 'bekas' | 'rusak', arah: 'serah' | 'terima' = 'serah') => ({
  rusakAsal: 'bekas' as const,
  arah,
  kondisi
});

describe('Aliran stok per transaksi', () => {
  it('Masuk menambah kantong sesuai kondisi', () => {
    expect(resolveStockFlow('Masuk', opts('baru'))).toEqual({ asal: null, tujuan: 'baru' });
    expect(resolveStockFlow('Masuk', opts('bekas'))).toEqual({ asal: null, tujuan: 'bekas' });
    expect(resolveStockFlow('Masuk', opts('rusak'))).toEqual({ asal: null, tujuan: 'rusak' });
  });

  it('Pakai mengurangi stok baru atau bekas; rusak tidak bisa dipasang', () => {
    expect(resolveStockFlow('Pakai', opts('baru'))).toEqual({ asal: 'baru', tujuan: null });
    expect(resolveStockFlow('Pakai', opts('bekas'))).toEqual({ asal: 'bekas', tujuan: null });
    expect(resolveStockFlow('Pakai', opts('rusak'))).toEqual({ asal: 'baru', tujuan: null });
    expect(kondisiOptions('Pakai')).toEqual(['baru', 'bekas']);
    expect(kondisiOptions('Masuk')).toEqual(['baru', 'bekas', 'rusak']);
  });

  it('Serah Terima dua arah, tiga kondisi', () => {
    expect(resolveStockFlow('Serah Terima', opts('rusak', 'serah'))).toEqual({ asal: 'rusak', tujuan: null });
    expect(resolveStockFlow('Serah Terima', opts('bekas', 'terima'))).toEqual({ asal: null, tujuan: 'bekas' });
  });

  it('form edit membaca kembali kondisi dari baris tersimpan', () => {
    expect(flowToOptions({ mutation_type: 'Masuk', stok_tujuan: 'rusak' }).kondisi).toBe('rusak');
    expect(flowToOptions({ mutation_type: 'Pakai', stok_asal: 'bekas' }).kondisi).toBe('bekas');
    expect(flowToOptions({ mutation_type: 'Pakai' }).kondisi).toBe('baru');
  });

  it('baris lama dan tipe lama tetap dihitung dengan default', () => {
    expect(getEffectiveFlow({ mutation_type: 'Masuk' })).toEqual({ asal: null, tujuan: 'baru' });
    expect(getEffectiveFlow({ mutation_type: 'Bekas' })).toEqual({ asal: null, tujuan: 'bekas' });
    expect(getEffectiveFlow({ mutation_type: 'Rusak' })).toEqual({ asal: 'bekas', tujuan: 'rusak' });
    expect(describeFlow({ mutation_type: 'Serah Terima' })).toContain('belum diisi');
  });
});

describe('describeFlowShort', () => {
  it('Masuk menampilkan kondisi yang diterima', () => {
    expect(describeFlowShort({ mutation_type: 'Masuk', stok_asal: null, stok_tujuan: 'baru' })).toBe('Baru');
    expect(describeFlowShort({ mutation_type: 'Masuk', stok_asal: null, stok_tujuan: 'bekas' })).toBe('Bekas');
    expect(describeFlowShort({ mutation_type: 'Masuk', stok_asal: null, stok_tujuan: 'rusak' })).toBe('Rusak');
  });

  it('Pakai menampilkan stok asal', () => {
    expect(describeFlowShort({ mutation_type: 'Pakai', stok_asal: 'baru', stok_tujuan: null })).toBe('Baru');
    expect(describeFlowShort({ mutation_type: 'Pakai', stok_asal: 'bekas', stok_tujuan: null })).toBe('Bekas');
  });

  it('Serah Terima menampilkan arah', () => {
    expect(describeFlowShort({ mutation_type: 'Serah Terima', stok_asal: 'rusak', stok_tujuan: null })).toBe('Serahkan');
    expect(describeFlowShort({ mutation_type: 'Serah Terima', stok_asal: null, stok_tujuan: 'rusak' })).toBe('Terima');
    expect(describeFlowShort({ mutation_type: 'Serah Terima' })).toContain('belum diisi');
  });

  it('baris lama tanpa stok_asal/stok_tujuan memakai default tipenya', () => {
    expect(describeFlowShort({ mutation_type: 'Masuk' })).toBe('Baru');
    expect(describeFlowShort({ mutation_type: 'Pakai' })).toBe('Baru');
    expect(describeFlowShort({ mutation_type: 'Bekas' })).toBe('Bekas');
    expect(describeFlowShort({ mutation_type: 'Rusak' })).toBe('Rusak');
  });
});

describe('Vektor uji DATABASE.md 3.3 (harus sama dengan view current_stock)', () => {
  it('menghasilkan baru 4, bekas 5, rusak 2 untuk vektor dokumentasi', () => {
    const muts = [
      { sparepart_id: 'x', mutation_type: 'Masuk', qty: 10, stok_asal: null, stok_tujuan: 'baru' },
      { sparepart_id: 'x', mutation_type: 'Pakai', qty: 3, stok_asal: 'baru', stok_tujuan: null },
      { sparepart_id: 'x', mutation_type: 'Bekas', qty: 4, stok_asal: null, stok_tujuan: 'bekas' },
      { sparepart_id: 'x', mutation_type: 'Rusak', qty: 2, stok_asal: 'baru', stok_tujuan: 'rusak' },
      { sparepart_id: 'x', mutation_type: 'Rusak', qty: 1, stok_asal: 'bekas', stok_tujuan: 'rusak' },
      { sparepart_id: 'x', mutation_type: 'Serah Terima', qty: 2, stok_asal: null, stok_tujuan: 'bekas' },
      { sparepart_id: 'x', mutation_type: 'Serah Terima', qty: 1, stok_asal: 'rusak', stok_tujuan: null },
      { sparepart_id: 'x', mutation_type: 'Serah Terima', qty: 1, stok_asal: 'baru', stok_tujuan: null }
    ];
    expect(computeStockBySparepart(muts).x).toEqual({ baru: 4, bekas: 5, rusak: 2 });
  });

  it('alur baru: Masuk bekas/rusak dan Pakai dari bekas', () => {
    const muts = [
      { sparepart_id: 'y', mutation_type: 'Masuk', qty: 3, stok_tujuan: 'baru' },
      { sparepart_id: 'y', mutation_type: 'Masuk', qty: 2, stok_tujuan: 'bekas' },
      { sparepart_id: 'y', mutation_type: 'Masuk', qty: 1, stok_tujuan: 'rusak' },
      { sparepart_id: 'y', mutation_type: 'Pakai', qty: 1, stok_asal: 'bekas' },
      { sparepart_id: 'y', mutation_type: 'Pakai', qty: 2, stok_asal: 'baru' }
    ];
    expect(computeStockBySparepart(muts).y).toEqual({ baru: 1, bekas: 1, rusak: 1 });
    expect(findNegativeStock({ baru: 0, bekas: -1, rusak: 0 })).toContain('Stok Bekas');
  });
});
