import { describe, expect, it } from 'vitest';
import { Sparepart } from '../types';
import { isLowStock } from './stock';
import {
  DAY_MS,
  ReliabilityMutation,
  ReliabilityUnit,
  buildPositions,
  autoMinimumStock,
  buildPredictiveReport,
  classifyMovement,
  demandRate,
  estimateMtbf,
  poissonReorderPoint,
  positionStatus
} from './reliability';

const DAY0 = Date.UTC(2026, 0, 1);
const day = (n: number) => new Date(DAY0 + n * DAY_MS).toISOString();

const pakai = (sparepartId: string, unitId: string | null, dayNo: number, qty = 1): ReliabilityMutation => ({
  id: `${sparepartId}-${unitId}-${dayNo}`,
  sparepart_id: sparepartId,
  unit_id: unitId,
  mutation_type: 'Pakai',
  qty,
  created_at: day(dayNo)
});

const part = (overrides: Partial<Sparepart> = {}): Sparepart => ({
  id: 'sp1',
  sku: 'SP-001',
  name: 'Bearing',
  tipe_ids: [],
  jenis_ids: [],
  equipment_type_name: 'Umum',
  jenis_name: 'Umum',
  minimum_stok: 0,
  stok_aktual: 0,
  stok_bekas: 0,
  stok_rusak: 0,
  ...overrides
});

const activeUnits: ReliabilityUnit[] = ['A', 'B', 'C'].map((id) => ({ id, status: 'operasi' }));

// Spec 4.1 example: three units, today = day 300
const specExample = [
  pakai('sp1', 'A', 0),
  pakai('sp1', 'A', 120),
  pakai('sp1', 'A', 250),
  pakai('sp1', 'B', 50),
  pakai('sp1', 'C', 100),
  pakai('sp1', 'C', 260)
];

describe('MTBF otomatis (spesifikasi 4.1)', () => {
  it('contoh spesifikasi: 750 hari paparan / 3 penggantian = 250 hari, keyakinan sedang', () => {
    const positions = buildPositions(specExample, activeUnits, DAY0 + 300 * DAY_MS);
    const byUnit = Object.fromEntries(positions.map((p) => [p.unit_id, p]));
    expect(byUnit.A.exposure_days).toBeCloseTo(300);
    expect(byUnit.A.replacements).toBe(2);
    expect(byUnit.B.exposure_days).toBeCloseTo(250);
    expect(byUnit.B.replacements).toBe(0);
    expect(byUnit.C.exposure_days).toBeCloseTo(200);
    expect(byUnit.C.replacements).toBe(1);

    const estimate = estimateMtbf(positions);
    expect(estimate.exposure_days).toBeCloseTo(750);
    expect(estimate.replacements).toBe(3);
    expect(estimate.mtbf_days).toBeCloseTo(250);
    expect(estimate.confidence).toBe('SEDANG');
  });

  it('posisi tanpa penggantian: MTBF kosong, belum cukup data', () => {
    const positions = buildPositions([pakai('sp1', 'B', 50)], activeUnits, DAY0 + 300 * DAY_MS);
    const estimate = estimateMtbf(positions);
    expect(estimate.mtbf_days).toBeNull();
    expect(estimate.confidence).toBe('BELUM_CUKUP_DATA');
    expect(estimate.exposure_days).toBeCloseTo(250);
  });

  it('tingkat keyakinan mengikuti jumlah penggantian', () => {
    const muts = Array.from({ length: 11 }, (_, i) => pakai('sp1', 'A', i * 10));
    const now = DAY0 + 200 * DAY_MS;
    expect(estimateMtbf(buildPositions(muts.slice(0, 2), activeUnits, now)).confidence).toBe('RENDAH');
    expect(estimateMtbf(buildPositions(muts.slice(0, 3), activeUnits, now)).confidence).toBe('RENDAH');
    expect(estimateMtbf(buildPositions(muts.slice(0, 4), activeUnits, now)).confidence).toBe('SEDANG');
    expect(estimateMtbf(buildPositions(muts, activeUnits, now)).confidence).toBe('TINGGI');
  });

  it('Pakai tanpa unit dan tipe lain tidak membentuk posisi', () => {
    const muts: ReliabilityMutation[] = [
      pakai('sp1', null, 0),
      { ...pakai('sp1', 'A', 10), mutation_type: 'Rusak' },
      { ...pakai('sp1', 'A', 20), mutation_type: 'Serah Terima' }
    ];
    expect(buildPositions(muts, activeUnits, DAY0 + 100 * DAY_MS)).toHaveLength(0);
  });

  it('qty pemasangan pertama mengalikan paparan; sisanya dihitung penggantian', () => {
    const positions = buildPositions(
      [pakai('sp1', 'A', 0, 4), pakai('sp1', 'A', 100, 2)],
      activeUnits,
      DAY0 + 200 * DAY_MS
    );
    expect(positions[0].exposure_days).toBeCloseTo(800);
    expect(positions[0].replacements).toBe(2);
    expect(estimateMtbf(positions).mtbf_days).toBeCloseTo(400);
  });

  it('unit gudang/rusak berhenti menambah paparan sejak status berubah', () => {
    const units: ReliabilityUnit[] = [{ id: 'A', status: 'gudang', updated_at: day(100) }];
    const [position] = buildPositions([pakai('sp1', 'A', 0)], units, DAY0 + 300 * DAY_MS);
    expect(position.exposure_days).toBeCloseTo(100);
    expect(position.unit_active).toBe(false);
  });
});

describe('Status umur posisi (spesifikasi 4.2)', () => {
  it('ambang 70% / 90% / 100% MTBF', () => {
    expect(positionStatus(10, null)).toBe('BELUM_CUKUP_DATA');
    expect(positionStatus(69, 100)).toBe('NORMAL');
    expect(positionStatus(70, 100)).toBe('PERHATIAN');
    expect(positionStatus(89.9, 100)).toBe('PERHATIAN');
    expect(positionStatus(90, 100)).toBe('KRITIS');
    expect(positionStatus(100, 100)).toBe('KRITIS');
    expect(positionStatus(100.1, 100)).toBe('LEWAT');
  });
});

describe('Kebutuhan dan titik pesan (spesifikasi 4.3)', () => {
  it('Poisson: λ = 1,0 dengan SLA 98% menghasilkan titik pesan 3', () => {
    expect(poissonReorderPoint(1.0, 0.98)).toBe(3);
    expect(poissonReorderPoint(0, 0.98)).toBe(0);
    // P(≤2 | λ=1) = 0,9197 sehingga SLA 90% cukup dengan 2
    expect(poissonReorderPoint(1.0, 0.9)).toBe(2);
  });

  it('Poisson λ besar memakai pendekatan normal tanpa macet', () => {
    const s = poissonReorderPoint(1000, 0.98);
    expect(s).toBeGreaterThan(1050);
    expect(s).toBeLessThan(1080);
  });

  it('contoh spesifikasi: 6 Pakai dalam 180 hari → λ 30 hari = 1,0 → titik pesan 3, PESAN 2 bila stok baru 1', () => {
    const muts = [0, 30, 60, 90, 120, 150].map((d) => pakai('sp1', 'A', d));
    const now = DAY0 + 180 * DAY_MS;
    const demand = demandRate(muts, now);
    expect(demand.window_days).toBeCloseTo(180);
    expect(demand.usage_qty).toBe(6);

    const report = buildPredictiveReport([part({ stok_aktual: 1 })], muts, activeUnits, now);
    const coverage = report.stockCoverage[0];
    expect(coverage.lambda).toBeCloseTo(1.0);
    expect(coverage.reorder_point_sla).toBe(3);
    expect(coverage.needs_order).toBe(true);
    expect(coverage.order_qty).toBe(2);
  });

  it('jendela kebutuhan dibatasi 30–365 hari', () => {
    const now = DAY0 + 1000 * DAY_MS;
    expect(demandRate([pakai('sp1', 'A', 995)], now).window_days).toBe(30);
    const old = demandRate([pakai('sp1', 'A', 0), pakai('sp1', 'A', 700)], now);
    expect(old.window_days).toBe(365);
    expect(old.usage_qty).toBe(1); // hari ke-0 di luar jendela
  });

  it('tanpa Pakai hanya minimum_stok yang berlaku, selaras dengan isLowStock', () => {
    const cases = [
      { minimum_stok: 0, stok_aktual: 0 },
      { minimum_stok: 0, stok_aktual: 1 },
      { minimum_stok: 3, stok_aktual: 3 },
      { minimum_stok: 3, stok_aktual: 4 }
    ];
    cases.forEach((c) => {
      const report = buildPredictiveReport([part(c)], [], [], DAY0);
      const coverage = report.stockCoverage[0];
      expect(coverage.reorder_point_sla).toBeNull();
      expect(coverage.needs_order).toBe(isLowStock(c.stok_aktual, c.minimum_stok));
    });
  });

  it('minimum_stok tetap menjadi batas bawah titik pesan', () => {
    const muts = [0, 30, 60, 90, 120, 150].map((d) => pakai('sp1', 'A', d));
    const report = buildPredictiveReport(
      [part({ minimum_stok: 5, stok_aktual: 4 })],
      muts,
      activeUnits,
      DAY0 + 180 * DAY_MS
    );
    expect(report.stockCoverage[0].reorder_level).toBe(6);
    expect(report.stockCoverage[0].order_qty).toBe(2);
  });
});

describe('Laporan gabungan', () => {
  it('tanpa transaksi: semua belum cukup data, tanpa kebutuhan tahunan', () => {
    const report = buildPredictiveReport([part({ stok_aktual: 5 })], [], activeUnits, DAY0);
    expect(report.positionAlerts).toHaveLength(0);
    expect(report.mtbfBySparepart.sp1.confidence).toBe('BELUM_CUKUP_DATA');
    expect(report.annualNeeds[0].annual_forecast_qty).toBeNull();
    expect(report.annualNeeds[0].order_needed_qty).toBe(0);
    expect(report.urgentCount).toBe(0);
  });

  it('kebutuhan tahunan = ceil(r × 365), dikurangi stok baru', () => {
    const muts = [0, 30, 60, 90, 120, 150].map((d) => pakai('sp1', 'A', d));
    const report = buildPredictiveReport([part({ stok_aktual: 3, stok_bekas: 10 })], muts, activeUnits, DAY0 + 180 * DAY_MS);
    expect(report.annualNeeds[0].annual_forecast_qty).toBe(13); // 6/180 × 365 = 12,17
    expect(report.annualNeeds[0].order_needed_qty).toBe(10);
  });

  it('kebutuhan tahunan tidak terdorong naik oleh galat pembulatan desimal', () => {
    // 29 Pakai dalam jendela penuh 365 hari: 29 / 365 × 365 = 29,000000000000004 di JavaScript
    const now = DAY0 + 400 * DAY_MS;
    const muts = [pakai('sp1', 'A', 0), ...Array.from({ length: 29 }, (_, i) => pakai('sp1', 'A', 40 + i * 10))];
    const report = buildPredictiveReport([part()], muts, activeUnits, now);
    expect(report.annualNeeds[0].demand.window_days).toBe(365);
    expect(report.annualNeeds[0].demand.usage_qty).toBe(29);
    expect(report.annualNeeds[0].annual_forecast_qty).toBe(29);
  });

  it('status posisi memakai pemasangan terakhir; hanya unit yang beroperasi ditampilkan', () => {
    const units: ReliabilityUnit[] = [...activeUnits, { id: 'D', status: 'rusak', updated_at: day(200) }];
    const report = buildPredictiveReport(
      [part({ stok_aktual: 10 })],
      [...specExample, pakai('sp1', 'D', 10)],
      units,
      DAY0 + 300 * DAY_MS
    );
    // D adds 190 days of exposure: (750 + 190) / 3
    expect(report.mtbfBySparepart.sp1.mtbf_days).toBeCloseTo(940 / 3);
    const byUnit = Object.fromEntries(report.positionAlerts.map((a) => [a.position.unit_id, a]));
    expect(Object.keys(byUnit).sort()).toEqual(['A', 'B', 'C']);
    expect(byUnit.A.age_days).toBeCloseTo(50);
    expect(byUnit.B.age_days).toBeCloseTo(250);
    // 250 / 313,3 = 0,80
    expect(byUnit.B.status).toBe('PERHATIAN');
    expect(report.positionAlerts[0].position.unit_id).toBe('B');
  });

  it('jumlah mendesak = posisi KRITIS + LEWAT + sparepart PESAN', () => {
    // Paparan 200 hari / 2 penggantian = MTBF 100; umur sejak pemasangan terakhir 100 hari → KRITIS
    const muts = [pakai('sp1', 'A', 0), pakai('sp1', 'A', 50), pakai('sp1', 'A', 100)];
    const now = DAY0 + 200 * DAY_MS;
    const report = buildPredictiveReport([part({ stok_aktual: 0 })], muts, activeUnits, now);
    expect(report.positionAlerts[0].status).toBe('KRITIS');
    expect(report.stockCoverage[0].needs_order).toBe(true);
    expect(report.urgentCount).toBe(2);
  });
});

describe('Klasifikasi rotasi stok', () => {
  const now = DAY0 + 400 * DAY_MS;
  const classify = (muts: ReliabilityMutation[]) => classifyMovement(demandRate(muts, now));
  const masuk = (dayNo: number): ReliabilityMutation => ({ ...pakai('sp1', null, dayNo), mutation_type: 'Masuk' });

  it('Fast: rata-rata ≥ 1 per bulan; Medium: ada pemakaian tetapi lebih jarang', () => {
    // jendela penuh 365 hari = 12,17 bulan: 13 Pakai ≥ 1 per bulan, 12 Pakai kurang dari itu
    const many = Array.from({ length: 13 }, (_, i) => pakai('sp1', 'A', 40 + i * 25));
    const few = Array.from({ length: 12 }, (_, i) => pakai('sp1', 'A', 40 + i * 25));
    expect(classify([masuk(0), ...many])).toBe('FAST_MOVING');
    expect(classify([masuk(0), ...few])).toBe('MEDIUM_MOVING');
    expect(classify([masuk(0), pakai('sp1', 'A', 300)])).toBe('MEDIUM_MOVING');
  });

  it('batas Fast tepat 1 per bulan pada jendela 30 hari', () => {
    const recent = (qty: number) => [{ ...masuk(0), created_at: day(380) }, pakai('sp1', 'A', 390, qty)];
    expect(classify(recent(1))).toBe('FAST_MOVING'); // 1 per 30 hari
  });

  it('transaksi selain Pakai tidak membuat sparepart menjadi Fast', () => {
    // stok awal baru + bekas dicatat sebagai dua transaksi, tetapi belum pernah dipakai
    const registered = [masuk(0), { ...masuk(0), mutation_type: 'Bekas' as const }];
    expect(classify(registered)).toBe('SLOW_MOVING');
  });

  it('Pakai di luar jendela 12 bulan tidak dihitung: jadi Slow', () => {
    expect(classify([masuk(0), pakai('sp1', 'A', 10)])).toBe('SLOW_MOVING');
  });

  it('sparepart yang baru dikenal (< 30 hari) tanpa pemakaian: belum cukup data', () => {
    expect(classifyMovement(demandRate([{ ...masuk(0), created_at: day(390) }], now))).toBe('BELUM_CUKUP_DATA');
    expect(classifyMovement(demandRate([], now))).toBe('BELUM_CUKUP_DATA');
  });

  it('laporan mengurutkan Fast lebih dulu dan mengisi per_month', () => {
    const muts = [
      masuk(0),
      ...Array.from({ length: 13 }, (_, i) => pakai('sp1', 'A', 40 + i * 25)),
      { ...pakai('sp2', 'A', 300), sparepart_id: 'sp2' }
    ];
    const report = buildPredictiveReport(
      [part({ id: 'sp2', sku: 'SP-002' }), part({ id: 'sp1', sku: 'SP-001' })],
      muts,
      activeUnits,
      now
    );
    expect(report.movements.map((m) => m.sparepart.id)).toEqual(['sp1', 'sp2']);
    expect(report.movements[0].category).toBe('FAST_MOVING');
    expect(report.movements[0].per_month).toBeCloseTo((13 / 365) * 30);
  });
});

describe('Stok minimum otomatis', () => {
  const now = DAY0 + 180 * DAY_MS;

  it('tanpa pemakaian: 0 (baru rendah saat habis)', () => {
    expect(autoMinimumStock(demandRate([], now))).toBe(0);
    expect(autoMinimumStock(demandRate([{ ...pakai('sp1', null, 0), mutation_type: 'Masuk' }], now))).toBe(0);
  });

  it('titik pesan SLA dikurangi 1: 6 Pakai / 180 hari → titik pesan 3 → minimum 2', () => {
    const muts = [0, 30, 60, 90, 120, 150].map((d) => pakai('sp1', 'A', d));
    expect(autoMinimumStock(demandRate(muts, now))).toBe(2);
  });

  it('selaras dengan isLowStock dan status PESAN di setiap stok', () => {
    const muts = [0, 30, 60, 90, 120, 150].map((d) => pakai('sp1', 'A', d));
    const min = autoMinimumStock(demandRate(muts, now));
    for (let stok = 0; stok <= 6; stok++) {
      const report = buildPredictiveReport([part({ stok_aktual: stok, minimum_stok: min })], muts, activeUnits, now);
      expect(report.stockCoverage[0].needs_order).toBe(isLowStock(stok, min));
    }
  });

  it('pemakaian sangat jarang tidak menghasilkan minimum negatif', () => {
    expect(autoMinimumStock(demandRate([pakai('sp1', 'A', 0)], DAY0 + 365 * DAY_MS))).toBe(0);
  });
});
