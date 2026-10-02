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
  { id: 'p1', id_unit: 'u1', id_lokasi: 'L1', is_active: true },
  { id: 'p2', id_unit: 'u2', id_lokasi: 'L2', is_active: true }
];
const compatRows = [compat('A', 'T1'), compat('A', 'T2'), compat('B', 'T2'), compat('B', 'T3')];

const run = (parts: Sparepart[], selectedLokasiId = '') =>
  getCompatibleEquipment({
    parts,
    sparepartCompatibility: compatRows,
    lokasiList: [{ id: 'L1', nama: 'Lokasi 1' }, { id: 'L2', nama: 'Lokasi 2' }],
    titikLokasiList: [],
    unitPeralatanList: units,
    penempatanList: penempatan,
    selectedLokasiId,
    selectedTitikId: ''
  });

describe('Unit kompatibel untuk satu nota', () => {
  it('satu sparepart: semua tipe kompatibelnya', () => {
    const r = run([part('A')]);
    expect(r.compatTypeIds.sort()).toEqual(['T1', 'T2']);
    expect(r.availableUnits.map((u) => u.id).sort()).toEqual(['u1', 'u2']);
    expect(r.otherUnits.map((u) => u.id)).toEqual(['u3']);
  });

  it('banyak sparepart: hanya unit yang cocok dengan semuanya (irisan)', () => {
    const r = run([part('A'), part('B')]);
    expect(r.compatTypeIds).toEqual(['T2']);
    expect(r.availableUnits.map((u) => u.id)).toEqual(['u2']);
    expect(r.compatibleLokasiList.map((l) => l.id)).toEqual(['L2']);
    expect(r.otherUnits.map((u) => u.id).sort()).toEqual(['u1', 'u3']);
  });

  it('tanpa sparepart: tidak ada yang kompatibel, semua unit di grup lain', () => {
    const r = run([]);
    expect(r.availableUnits).toHaveLength(0);
    expect(r.otherUnits).toHaveLength(3);
  });

  it('filter lokasi berlaku untuk unit kompatibel dan unit lain', () => {
    const r = run([part('A')], 'L1');
    expect(r.availableUnits.map((u) => u.id)).toEqual(['u1']);
    expect(r.otherUnits).toHaveLength(0);
  });

  it('hanya Pakai yang wajib unit', () => {
    expect(requiresEquipmentUnit('Pakai')).toBe(true);
    expect(requiresEquipmentUnit('Masuk')).toBe(false);
    expect(requiresEquipmentUnit('Serah Terima')).toBe(false);
  });
});
