import { describe, expect, it } from 'vitest';
import { JadwalShift, Personel, UnitKerja } from '../types';
import {
  cleanManualPetugas,
  compareDutyPersonel,
  extractManualPetugas,
  getActiveDutyPersonel,
  stripManualPetugas,
  withManualPetugas
} from './shiftUtils';

const units: UnitKerja[] = [
  { id: 'u-ias', nama: 'OM/IAS T2' },
  { id: 'u-api', nama: 'API T2' }
];

const person = (id: string, nama: string, unit_id: string | undefined, urutan?: number): Personel => ({
  id,
  nik: id,
  nama,
  unit_id,
  urutan
});

// Daftar sengaja dicampur dan urutan IAS di depan, seperti hasil query urutan -> nama
const people: Personel[] = [
  person('1', 'Muhammad Ridho Rabbani', 'u-ias', 1),
  person('2', 'Ageng Pandanaran', 'u-api', 1),
  person('3', 'Nandio Prihardana', 'u-ias', 2),
  person('4', 'Yuli Syarif', 'u-api', 2),
  person('5', 'Tanpa Unit', undefined, 1)
];

// 2026-10-05 12:00 = shift PS tanggal 2026-10-05
const NOW = new Date(2026, 9, 5, 12, 0, 0);
const onDuty = (ids: string[]): JadwalShift[] =>
  ids.map((id) => ({ id: `j${id}`, personel_id: id, tanggal: '2026-10-05', shift: 'PS', status_kehadiran: 'hadir' }));

describe('Urutan personel berdinas', () => {
  it('personel API dulu, lalu IAS, lalu tanpa unit; di dalam unit menurut urutan', () => {
    const { personelOptions } = getActiveDutyPersonel(people, onDuty(['1', '2', '3', '4']), units, NOW);
    expect(personelOptions.map((p) => p.nama)).toEqual([
      'Ageng Pandanaran',
      'Yuli Syarif',
      'Muhammad Ridho Rabbani',
      'Nandio Prihardana'
    ]);
  });

  it('daftar cadangan (tanpa jadwal) memakai urutan yang sama', () => {
    const { personelOptions, isFallback } = getActiveDutyPersonel(people, [], units, NOW);
    expect(isFallback).toBe(true);
    expect(personelOptions.map((p) => p.id)).toEqual(['2', '4', '1', '3', '5']);
  });

  it('urutan kosong di akhir unit, lalu menurut nama', () => {
    const list = [
      { unitName: 'API T2', urutan: null, nama: 'Zed' },
      { unitName: 'API T2', urutan: 3, nama: 'Cici' },
      { unitName: 'API T2', urutan: null, nama: 'Abi' }
    ];
    expect([...list].sort(compareDutyPersonel).map((p) => p.nama)).toEqual(['Cici', 'Abi', 'Zed']);
  });

  it('unit lain berada setelah API dan IAS, diurutkan menurut nama unit', () => {
    const list = [
      { unitName: 'Teknisi', nama: 'A' },
      { unitName: 'OM/IAS T2', nama: 'B' },
      { unitName: 'Bagian Lain', nama: 'C' },
      { unitName: 'API T2', nama: 'D' }
    ];
    expect([...list].sort(compareDutyPersonel).map((p) => p.nama)).toEqual(['D', 'B', 'C', 'A']);
  });
});

describe('Petugas tulis manual (jadwal belum diunggah)', () => {
  it('nama disimpan sebagai tag di awal catatan dan bisa dibaca kembali', () => {
    const notes = withManualPetugas('ganti generator', 'Budi Santoso');
    expect(notes).toBe('[Petugas: Budi Santoso] ganti generator');
    expect(extractManualPetugas(notes)).toBe('Budi Santoso');
    expect(stripManualPetugas(notes)).toBe('ganti generator');
  });

  it('tanpa catatan: hanya tag; tag ikut sebelum tag Ref', () => {
    expect(withManualPetugas('', 'Budi')).toBe('[Petugas: Budi]');
    expect(withManualPetugas('[Ref: PO-1] baru', 'Budi')).toBe('[Petugas: Budi] [Ref: PO-1] baru');
    expect(stripManualPetugas('[Petugas: Budi] [Ref: PO-1] baru')).toBe('[Ref: PO-1] baru');
  });

  it('catatan tanpa tag tidak berubah', () => {
    expect(extractManualPetugas('catatan biasa')).toBeNull();
    expect(extractManualPetugas(null)).toBeNull();
    expect(stripManualPetugas('catatan biasa')).toBe('catatan biasa');
    expect(stripManualPetugas(null)).toBe('');
  });

  it('nama dibersihkan: tanpa kurung siku/baris baru, rapat, maksimal 80 karakter', () => {
    expect(cleanManualPetugas('  Budi [Teknisi]\n Santoso ')).toBe('Budi Teknisi Santoso');
    expect(cleanManualPetugas('x'.repeat(200))).toHaveLength(80);
    expect(withManualPetugas('catatan', '  [] ')).toBe('catatan');
  });
});
