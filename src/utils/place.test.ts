import { describe, expect, it } from 'vitest';
import {
  describeMutationPlace,
  emptyPlace,
  formatPlace,
  placeColumnsOf,
  placeFromMutation,
  placeToColumns
} from './place';

describe('placeToColumns', () => {
  it('pilihan dari daftar: hanya id yang terisi', () => {
    const c = placeToColumns({ ...emptyPlace, lokasiId: 'L', titikId: 'K', unitId: 'U' });
    expect(c).toEqual({
      lokasi_id: 'L',
      titik_id: 'K',
      unit_id: 'U',
      lokasi_manual: null,
      titik_manual: null,
      unit_manual: null
    });
  });

  it('tulis manual: teks terisi (dipangkas), id kosong, tidak pernah keduanya', () => {
    const c = placeToColumns({
      ...emptyPlace,
      lokasiId: 'L',
      unitId: 'U',
      lokasiManual: '  Gedung Lama ',
      titikManual: '7A',
      unitManual: ' Genset ',
      manualLokasi: true,
      manualTitik: true,
      manualUnit: true
    });
    expect(c).toEqual({
      lokasi_id: null,
      titik_id: null,
      unit_id: null,
      lokasi_manual: 'Gedung Lama',
      titik_manual: '7A',
      unit_manual: 'Genset'
    });
  });

  it('lokasi manual membuat titik ikut manual (tidak ada daftar titik)', () => {
    const c = placeToColumns({ ...emptyPlace, titikId: 'K', titikManual: '3', lokasiManual: 'Luar', manualLokasi: true });
    expect(c.titik_id).toBeNull();
    expect(c.titik_manual).toBe('3');
  });

  it('manual kosong menjadi NULL', () => {
    const c = placeToColumns({ ...emptyPlace, lokasiManual: '   ', manualLokasi: true });
    expect(c.lokasi_manual).toBeNull();
    expect(c.lokasi_id).toBeNull();
  });

  it('Pakai (allowManual=false): isian manual diabaikan, unit_id tetap dari daftar', () => {
    const c = placeToColumns({ ...emptyPlace, unitId: 'U', unitManual: 'x', manualUnit: true, lokasiId: 'L' }, false);
    expect(c.unit_id).toBe('U');
    expect(c.unit_manual).toBeNull();
    expect(c.lokasi_id).toBe('L');
  });
});

describe('placeFromMutation / placeColumnsOf', () => {
  it('bolak-balik tanpa kehilangan data', () => {
    const m = { unit_id: null, lokasi_id: null, titik_id: null, lokasi_manual: 'A', titik_manual: '1', unit_manual: 'U' };
    const v = placeFromMutation(m);
    expect(v.manualLokasi && v.manualTitik && v.manualUnit).toBe(true);
    expect(placeToColumns(v)).toEqual(placeColumnsOf(m));
    expect(placeToColumns(placeFromMutation({ unit_id: 'U', lokasi_id: 'L', titik_id: 'K' }))).toEqual(
      placeColumnsOf({ unit_id: 'U', lokasi_id: 'L', titik_id: 'K' })
    );
  });
});

describe('penulisan lokasi', () => {
  it('"HBSCP 1.5", "X-Ray Conveyor Belt 15", dan hanya lokasi bila tanpa titik', () => {
    expect(formatPlace('HBSCP', '1.5')).toBe('HBSCP 1.5');
    expect(formatPlace('X-Ray Conveyor Belt', '15')).toBe('X-Ray Conveyor Belt 15');
    expect(formatPlace('COWOK', '')).toBe('COWOK');
    expect(formatPlace(null, null)).toBe('');
  });

  it('describeMutationPlace memakai daftar, lalu teks manual', () => {
    const lokasi = [{ id: 'L', nama: 'HBSCP' }];
    const titik = [{ id: 'K', nomor: '1.5' }];
    expect(describeMutationPlace({ lokasi_id: 'L', titik_id: 'K' }, lokasi, titik)).toBe('HBSCP 1.5');
    expect(describeMutationPlace({ lokasi_manual: 'Gedung Lama', titik_manual: '7A' }, lokasi, titik)).toBe('Gedung Lama 7A');
    expect(describeMutationPlace({ lokasi_id: 'L', titik_manual: '9' }, lokasi, titik)).toBe('HBSCP 9');
    expect(describeMutationPlace({}, lokasi, titik)).toBe('');
  });
});
