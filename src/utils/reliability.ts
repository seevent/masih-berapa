/**
 * Predictive maintenance math (pure functions, no Supabase access).
 * Spec: docs/specs/predictive-maintenance.md
 *
 * - MTBF per sparepart = total exposure of all installed positions / number of replacements
 *   (positions that were never replaced still count as exposure: censored data).
 * - Age status per installed position (sparepart × unit) relative to that MTBF.
 * - Stock coverage: Poisson reorder point for a planning horizon at a service level (SLA).
 */
import { MutationType, Sparepart, UnitStatus } from '../types';

/** Planning horizon in days; replaces lead time until lead time data exists. */
export const PLANNING_HORIZON_DAYS = 30;
/** Target service level: probability that stock covers demand during the horizon. */
export const SERVICE_LEVEL = 0.98;
/** Age / MTBF ratio thresholds. Above 1 (100%) the position is overdue (LEWAT). */
export const AGE_RATIO_PERHATIAN = 0.7;
export const AGE_RATIO_KRITIS = 0.9;
/** Demand window: days since the first transaction of the sparepart, clamped to this range. */
export const DEMAND_WINDOW_MIN_DAYS = 30;
export const DEMAND_WINDOW_MAX_DAYS = 365;
/** Fast moving = on average at least this many pieces of 'Pakai' per 30 days. */
export const MOVEMENT_FAST_PER_MONTH = 1;
const DAYS_PER_MONTH = 30;

export const DAY_MS = 1000 * 60 * 60 * 24;

/** Units in these states no longer run, so their positions stop accumulating exposure. */
const INACTIVE_UNIT_STATUSES: UnitStatus[] = ['gudang', 'rusak'];

export interface ReliabilityMutation {
  id?: string;
  sparepart_id: string;
  unit_id?: string | null;
  mutation_type: MutationType;
  qty: number;
  created_at: string;
}

export interface ReliabilityUnit {
  id: string;
  status: UnitStatus;
  updated_at?: string | null;
}

/** One sparepart installed in one equipment unit, built from its 'Pakai' transactions. */
export interface InstalledPosition {
  sparepart_id: string;
  unit_id: string;
  /** Number of 'Pakai' transactions at this position */
  installs: number;
  /** Qty of the first installation (= how many of this part the unit holds) */
  first_qty: number;
  first_installed_at: string;
  last_installed_at: string;
  /** End of observation: now, or when the unit left operation (gudang/rusak) */
  observed_until: string;
  /** (observed_until − first install) × first_qty, in days */
  exposure_days: number;
  /** Total installed qty − first_qty */
  replacements: number;
  /** false when the unit is now 'gudang' or 'rusak' */
  unit_active: boolean;
}

export type MtbfConfidence = 'BELUM_CUKUP_DATA' | 'RENDAH' | 'SEDANG' | 'TINGGI';

export interface MtbfEstimate {
  /** null while there is no replacement yet */
  mtbf_days: number | null;
  exposure_days: number;
  replacements: number;
  positions: number;
  confidence: MtbfConfidence;
}

export type PositionStatus = 'NORMAL' | 'PERHATIAN' | 'KRITIS' | 'LEWAT' | 'BELUM_CUKUP_DATA';

export interface DemandRate {
  /** Days since the first transaction of the sparepart (0 without transactions), not clamped */
  history_days: number;
  window_days: number;
  /** Total 'Pakai' qty inside the window */
  usage_qty: number;
  rate_per_day: number;
}

const toTime = (iso: string) => new Date(iso).getTime();

/** Rounds a quantity up, ignoring floating-point noise (29 / 365 × 365 = 29.000000000000004 → 29, not 30). */
const ceilQty = (x: number) => Math.ceil(x - 1e-9);

/** Groups 'Pakai' transactions per (sparepart, unit). 'Pakai' without a unit is ignored. */
export const buildPositions = (
  mutations: ReliabilityMutation[],
  units: ReliabilityUnit[],
  now: number
): InstalledPosition[] => {
  const unitMap = new Map(units.map((u) => [u.id, u]));
  const groups = new Map<string, ReliabilityMutation[]>();

  mutations.forEach((m) => {
    if (m.mutation_type !== 'Pakai' || !m.unit_id || !m.created_at) return;
    if (!Number.isFinite(toTime(m.created_at))) return;
    const key = `${m.sparepart_id}|${m.unit_id}`;
    const list = groups.get(key);
    if (list) list.push(m);
    else groups.set(key, [m]);
  });

  return Array.from(groups.values()).map((list) => {
    const sorted = [...list].sort(
      (a, b) => toTime(a.created_at) - toTime(b.created_at) || (a.id || '').localeCompare(b.id || '')
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const firstTime = toTime(first.created_at);
    const firstQty = Math.max(1, Number(first.qty) || 1);
    const totalQty = sorted.reduce((sum, m) => sum + Math.max(0, Number(m.qty) || 0), 0);

    const unit = unitMap.get(first.unit_id as string);
    // Unknown unit (e.g. list failed to load) is treated as still running
    const unitActive = !unit || !INACTIVE_UNIT_STATUSES.includes(unit.status);
    let endTime = now;
    if (!unitActive && unit?.updated_at && Number.isFinite(toTime(unit.updated_at))) {
      endTime = Math.min(now, toTime(unit.updated_at));
    }
    endTime = Math.max(endTime, firstTime);

    return {
      sparepart_id: first.sparepart_id,
      unit_id: first.unit_id as string,
      installs: sorted.length,
      first_qty: firstQty,
      first_installed_at: first.created_at,
      last_installed_at: last.created_at,
      observed_until: new Date(endTime).toISOString(),
      exposure_days: ((endTime - firstTime) / DAY_MS) * firstQty,
      replacements: Math.max(0, totalQty - firstQty),
      unit_active: unitActive
    };
  });
};

export const mtbfConfidence = (replacements: number): MtbfConfidence => {
  if (replacements <= 0) return 'BELUM_CUKUP_DATA';
  if (replacements <= 2) return 'RENDAH';
  if (replacements <= 9) return 'SEDANG';
  return 'TINGGI';
};

/** MTBF = Σ exposure / Σ replacements over the given positions (one sparepart). */
export const estimateMtbf = (positions: InstalledPosition[]): MtbfEstimate => {
  const exposure = positions.reduce((sum, p) => sum + p.exposure_days, 0);
  const replacements = positions.reduce((sum, p) => sum + p.replacements, 0);
  return {
    mtbf_days: replacements > 0 ? exposure / replacements : null,
    exposure_days: exposure,
    replacements,
    positions: positions.length,
    confidence: mtbfConfidence(replacements)
  };
};

/** Age status of an installed position: age (days since last install) relative to MTBF. */
export const positionStatus = (ageDays: number, mtbfDays: number | null): PositionStatus => {
  if (mtbfDays === null || !(mtbfDays > 0)) return 'BELUM_CUKUP_DATA';
  const ratio = ageDays / mtbfDays;
  if (ratio > 1) return 'LEWAT';
  if (ratio >= AGE_RATIO_KRITIS) return 'KRITIS';
  if (ratio >= AGE_RATIO_PERHATIAN) return 'PERHATIAN';
  return 'NORMAL';
};

/** Daily 'Pakai' demand of one sparepart. `mutations` must belong to that sparepart only. */
export const demandRate = (mutations: ReliabilityMutation[], now: number): DemandRate => {
  const times = mutations.map((m) => toTime(m.created_at)).filter((t) => Number.isFinite(t));
  const firstTime = times.length > 0 ? Math.min(...times) : now;
  const windowDays = Math.min(
    DEMAND_WINDOW_MAX_DAYS,
    Math.max(DEMAND_WINDOW_MIN_DAYS, (now - firstTime) / DAY_MS)
  );
  const windowStart = now - windowDays * DAY_MS;
  const usageQty = mutations
    .filter((m) => m.mutation_type === 'Pakai' && toTime(m.created_at) >= windowStart)
    .reduce((sum, m) => sum + Math.max(0, Number(m.qty) || 0), 0);

  return {
    history_days: times.length > 0 ? Math.max(0, (now - firstTime) / DAY_MS) : 0,
    window_days: windowDays,
    usage_qty: usageQty,
    rate_per_day: usageQty / windowDays
  };
};

/**
 * Minimum stock (stok baru) derived from usage instead of a manual number. A part is "low" when
 * stok baru <= minimum (isLowStock), i.e. when stok baru < reorder point, so minimum = reorder point − 1.
 * Without 'Pakai' history there is nothing to base it on: 0, so it is only low when it runs out.
 */
export const autoMinimumStock = (demand: DemandRate): number => {
  if (!(demand.usage_qty > 0)) return 0;
  const reorderPoint = poissonReorderPoint(demand.rate_per_day * PLANNING_HORIZON_DAYS, SERVICE_LEVEL);
  return Math.max(0, reorderPoint - 1);
};

export type MovementClass = 'FAST_MOVING' | 'MEDIUM_MOVING' | 'SLOW_MOVING' | 'BELUM_CUKUP_DATA';

/**
 * Stock rotation class from 'Pakai' usage in the demand window (same window as the needs forecast):
 * FAST ≥ 1 per month on average, MEDIUM = some usage but less, SLOW = no usage although the part has
 * been known for at least DEMAND_WINDOW_MIN_DAYS, BELUM_CUKUP_DATA = no usage and a younger history.
 */
export const classifyMovement = (demand: DemandRate): MovementClass => {
  if (demand.usage_qty > 0) {
    // usage / window ≥ fast / 30  ⇔  usage × 30 ≥ fast × window (avoids decimal division)
    return demand.usage_qty * DAYS_PER_MONTH >= MOVEMENT_FAST_PER_MONTH * demand.window_days
      ? 'FAST_MOVING'
      : 'MEDIUM_MOVING';
  }
  return demand.history_days >= DEMAND_WINDOW_MIN_DAYS ? 'SLOW_MOVING' : 'BELUM_CUKUP_DATA';
};

/** Smallest s with P(Poisson(λ) ≤ s) ≥ serviceLevel. */
export const poissonReorderPoint = (lambda: number, serviceLevel: number = SERVICE_LEVEL): number => {
  if (!(lambda > 0)) return 0;
  // e^-λ underflows for very large λ: use the normal approximation there
  if (lambda > 500) {
    const z = inverseStandardNormal(serviceLevel);
    return Math.ceil(lambda + z * Math.sqrt(lambda));
  }
  let pmf = Math.exp(-lambda);
  let cdf = pmf;
  let s = 0;
  while (cdf < serviceLevel && s < 10000) {
    s += 1;
    pmf *= lambda / s;
    cdf += pmf;
  }
  return s;
};

/** Acklam's rational approximation of the standard normal quantile (0 < p < 1). */
const inverseStandardNormal = (p: number): number => {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pLow) return -inverseStandardNormal(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
};

// --- Combined report used by the app ---

export interface PositionAlert {
  sparepart: Sparepart;
  position: InstalledPosition;
  /** Days since the last installation at this position */
  age_days: number;
  mtbf_days: number | null;
  /** age / MTBF, null without MTBF */
  ratio: number | null;
  status: PositionStatus;
}

export interface StockCoverage {
  sparepart: Sparepart;
  demand: DemandRate;
  /** Expected demand during the planning horizon */
  lambda: number;
  /** Poisson reorder point at SERVICE_LEVEL; null without 'Pakai' history */
  reorder_point_sla: number | null;
  /** Stock baru must stay at or above this: max(SLA point, minimum_stok + 1); minimum_stok is itself derived (autoMinimumStock) */
  reorder_level: number;
  stok_baru: number;
  needs_order: boolean;
  order_qty: number;
}

export interface AnnualNeed {
  sparepart: Sparepart;
  demand: DemandRate;
  /** ceil(rate × 365); null without 'Pakai' history */
  annual_forecast_qty: number | null;
  stok_baru: number;
  order_needed_qty: number;
}

export interface SparepartMovement {
  sparepart: Sparepart;
  demand: DemandRate;
  category: MovementClass;
  /** Average 'Pakai' pieces per 30 days in the window */
  per_month: number;
}

export interface PredictiveReport {
  mtbfBySparepart: Record<string, MtbfEstimate>;
  /** Positions in running units, most urgent first */
  positionAlerts: PositionAlert[];
  /** Per sparepart, parts needing an order first */
  stockCoverage: StockCoverage[];
  annualNeeds: AnnualNeed[];
  /** Rotation class per sparepart, fastest first */
  movements: SparepartMovement[];
  /** Positions KRITIS + LEWAT + spareparts needing an order */
  urgentCount: number;
}

const STATUS_ORDER: Record<PositionStatus, number> = {
  LEWAT: 0,
  KRITIS: 1,
  PERHATIAN: 2,
  NORMAL: 3,
  BELUM_CUKUP_DATA: 4
};

export const buildPredictiveReport = (
  spareparts: Sparepart[],
  mutations: ReliabilityMutation[],
  units: ReliabilityUnit[],
  now: number
): PredictiveReport => {
  const mutsBySparepart = new Map<string, ReliabilityMutation[]>();
  mutations.forEach((m) => {
    const list = mutsBySparepart.get(m.sparepart_id);
    if (list) list.push(m);
    else mutsBySparepart.set(m.sparepart_id, [m]);
  });

  const positionsBySparepart = new Map<string, InstalledPosition[]>();
  buildPositions(mutations, units, now).forEach((p) => {
    const list = positionsBySparepart.get(p.sparepart_id);
    if (list) list.push(p);
    else positionsBySparepart.set(p.sparepart_id, [p]);
  });

  const mtbfBySparepart: Record<string, MtbfEstimate> = {};
  const positionAlerts: PositionAlert[] = [];
  const stockCoverage: StockCoverage[] = [];
  const annualNeeds: AnnualNeed[] = [];
  const movements: SparepartMovement[] = [];

  spareparts.forEach((sp) => {
    const positions = positionsBySparepart.get(sp.id) || [];
    const estimate = estimateMtbf(positions);
    mtbfBySparepart[sp.id] = estimate;

    positions
      .filter((p) => p.unit_active)
      .forEach((p) => {
        const ageDays = Math.max(0, (now - toTime(p.last_installed_at)) / DAY_MS);
        positionAlerts.push({
          sparepart: sp,
          position: p,
          age_days: ageDays,
          mtbf_days: estimate.mtbf_days,
          ratio: estimate.mtbf_days ? ageDays / estimate.mtbf_days : null,
          status: positionStatus(ageDays, estimate.mtbf_days)
        });
      });

    const demand = demandRate(mutsBySparepart.get(sp.id) || [], now);
    const hasDemand = demand.usage_qty > 0;
    const lambda = demand.rate_per_day * PLANNING_HORIZON_DAYS;
    const reorderPointSla = hasDemand ? poissonReorderPoint(lambda, SERVICE_LEVEL) : null;
    const stokBaru = Math.max(0, sp.stok_aktual);
    // minimum_stok = SLA point − 1 (autoMinimumStock), so this equals the SLA point; the max() only guards
    // the no-data case (minimum 0 → order when empty). "+1" keeps it identical to isLowStock (baru <= minimum)
    const reorderLevel = Math.max(reorderPointSla ?? 0, sp.minimum_stok + 1);
    const needsOrder = stokBaru < reorderLevel;
    stockCoverage.push({
      sparepart: sp,
      demand,
      lambda,
      reorder_point_sla: reorderPointSla,
      reorder_level: reorderLevel,
      stok_baru: stokBaru,
      needs_order: needsOrder,
      order_qty: needsOrder ? reorderLevel - stokBaru : 0
    });

    movements.push({
      sparepart: sp,
      demand,
      category: classifyMovement(demand),
      per_month: demand.rate_per_day * DAYS_PER_MONTH
    });

    const annual = hasDemand ? ceilQty((demand.usage_qty * 365) / demand.window_days) : null;
    annualNeeds.push({
      sparepart: sp,
      demand,
      annual_forecast_qty: annual,
      stok_baru: stokBaru,
      order_needed_qty: annual === null ? 0 : Math.max(0, annual - stokBaru)
    });
  });

  positionAlerts.sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (b.ratio ?? -1) - (a.ratio ?? -1) ||
      b.age_days - a.age_days
  );
  stockCoverage.sort(
    (a, b) => Number(b.needs_order) - Number(a.needs_order) || b.order_qty - a.order_qty || a.sparepart.sku.localeCompare(b.sparepart.sku)
  );

  const MOVEMENT_ORDER: Record<MovementClass, number> = {
    FAST_MOVING: 0,
    MEDIUM_MOVING: 1,
    SLOW_MOVING: 2,
    BELUM_CUKUP_DATA: 3
  };
  movements.sort(
    (a, b) =>
      MOVEMENT_ORDER[a.category] - MOVEMENT_ORDER[b.category] ||
      b.per_month - a.per_month ||
      a.sparepart.sku.localeCompare(b.sparepart.sku)
  );

  const urgentCount =
    positionAlerts.filter((a) => a.status === 'KRITIS' || a.status === 'LEWAT').length +
    stockCoverage.filter((c) => c.needs_order).length;

  return { mtbfBySparepart, positionAlerts, stockCoverage, annualNeeds, movements, urgentCount };
};
