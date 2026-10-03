import { describe, expect, it } from 'vitest';
import { PenempatanPeralatan, Sparepart, SparepartCompatibility, UnitPeralatan } from '../types';
import { getCompatibleEquipment, requiresEquipmentUnit } from './compatibility';

const part = (id: string): Sparepart => ({
  id,
  sku: id,
  name: id,
  minimum_stok: 0,
  stok_aktual: 0,
  stok_bekas: 0,
  stok_rusak: 0,
  tipe_ids: [],
  jenis_ids: [],
  equipment_type_name: 'Umum',
  jenis_name: 'Umum'
});
const compat = (sparepart_id: string, id_tipe: string): SparepartCompatibility => ({ id: `${sparepart_id}-${id_tipe}`, sparepart_id, id_tipe });
const unit = (id: string, id_tipe: string): UnitPeralatan => ({ id, id_tipe, status: 'operasi' });

const units = [unit('u1', 'T1'), unit('u2', 'T2'), unit('u3', 'T3')];
const penempatan: PenempatanPeralatan[] = [
  { id: 'p1', id_unit: 'u1', id_tipe: 'T1', id_lokasi: 'L1', id_titik: 'K1', is_active: true },
  { id: 'p2', id_unit: 'u2', id_tipe: 'T2', id_lokasi: 'L2', id_titik: 'K2', is_active: true },
  { id: 'p3', id_unit: 'u3', id_tipe: 'T3', id_lokasi: 'L1', id_titik: 'K3', is_active: true },
  { id: 'p4', id_unit: 'u1', id_tipe: 'T1', id_lokasi: 'L1', id_titik: 'K4', is_active: false }
];
const compatRows = [compat('A', 'T1'), compat('A', 'T2'), compat('B', 'T2'), compat('B', 'T3')];

const run = (parts: Sparepart[], selectedLokasiId = '') =>
  getCompatibleEquipment({
    parts,
    sparepartCompatibility: compatRows,
    lokasiList: [{ id: 'L1', nama: 'Lokasi 1' }, { id: 'L2', nama: 'Lokasi 2' }],
    titikLokasiList: [
      { id: 'K1', id_lokasi: 'L1', nomor: '1' },
      { id: 'K2', id_lokasi: 'L2', nomor: '2' },
      { id: 'K3', id_lokasi: 'L1', nomor: '3' },
      { id: 'K4', id_lokasi: 'L1', nomor: '4' }
    ],
    unitPeralatanList: units,
    penempatanList: penempatan,
    selectedLokasiId,
    selectedTitikId: ''
  });

describe('Unit kompatibel untuk satu nota', () => {
  it('satu sparepart: semua tipe kompatibelnya, hanya unit dan lokasi yang cocok', () => {
    const r = run([part('A')]);
    expect(r.compatTypeIds.sort()).toEqual(['T1', 'T2']);
    expect(r.availableUnits.map((u) => u.id).sort()).toEqual(['u1', 'u2']);
    expect(r.compatibleLokasiList.map((l) => l.id).sort()).toEqual(['L1', 'L2']);
  });

  it('banyak sparepart: hanya unit yang cocok dengan semuanya (irisan)', () => {
    const r = run([part('A'), part('B')]);
    expect(r.compatTypeIds).toEqual(['T2']);
    expect(r.availableUnits.map((u) => u.id)).toEqual(['u2']);
    expect(r.compatibleLokasiList.map((l) => l.id)).toEqual(['L2']);
  });

  it('tanpa sparepart: tidak ada yang tampil', () => {
    const r = run([]);
    expect(r.availableUnits).toHaveLength(0);
    expect(r.compatibleLokasiList).toHaveLength(0);
    expect(run([], 'L1').availableTitikList).toHaveLength(0);
  });

  it('filter lokasi menyaring unit kompatibel', () => {
    const r = run([part('A')], 'L1');
    expect(r.availableUnits.map((u) => u.id)).toEqual(['u1']);
  });

  it('titik: hanya titik aktif di lokasi terpilih tempat tipe kompatibel berada', () => {
    // L1 punya K1 (T1, kompatibel dengan A), K3 (T3, tidak), K4 (penempatan tidak aktif)
    expect(run([part('A')], 'L1').availableTitikList.map((t) => t.id)).toEqual(['K1']);
    expect(run([part('B')], 'L1').availableTitikList.map((t) => t.id)).toEqual(['K3']);
    expect(run([part('A')], '').availableTitikList).toHaveLength(0);
  });

  it('hanya Pakai yang wajib unit', () => {
    expect(requiresEquipmentUnit('Pakai')).toBe(true);
    expect(requiresEquipmentUnit('Masuk')).toBe(false);
    expect(requiresEquipmentUnit('Serah Terima')).toBe(false);
  });
});
