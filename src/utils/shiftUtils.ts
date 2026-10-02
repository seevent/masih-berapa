import { Personel, JadwalShift, UnitKerja } from '../types';

export interface ShiftInfo {
  activeShiftCode: 'PS' | 'M';
  activeShiftLabel: string;
  operationalDate: string; // YYYY-MM-DD
}

export interface ActiveDutyPersonelResult {
  personelOptions: Array<Personel & { formattedName: string; isDutyActive: boolean }>;
  activeDutyList: Array<Personel & { formattedName: string; isDutyActive: boolean }>;
  isFallback: boolean;
  shiftInfo: ShiftInfo;
}

const ABSENT_STATUSES = ['izin', 'sakit', 'cuti', 'alpa', 'alpha', 'off', 'libur', 'tidak hadir'];

/**
 * Formats Date to local YYYY-MM-DD
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns current shift info based on 2-shift model:
 * - PS (Dinas Pagi / Siang): 08:00 - 20:00
 * - M (Dinas Malam): 20:00 - 08:00
 * Note: For 00:00 - 07:59 (dinas malam), the operational date belongs to yesterday.
 */
export const getCurrentShiftInfo = (nowDate: Date = new Date()): ShiftInfo => {
  const hours = nowDate.getHours();

  let activeShiftCode: 'PS' | 'M';
  let activeShiftLabel: string;
  const targetDate = new Date(nowDate);

  if (hours >= 8 && hours < 20) {
    activeShiftCode = 'PS';
    activeShiftLabel = 'Dinas Pagi / Siang (08.00 - 20.00)';
  } else {
    activeShiftCode = 'M';
    activeShiftLabel = 'Dinas Malam (20.00 - 08.00)';
    // If midnight to 07:59, the shift started yesterday evening (20:00)
    if (hours < 8) {
      targetDate.setDate(targetDate.getDate() - 1);
    }
  }

  const operationalDate = formatDateToYYYYMMDD(targetDate);

  return {
    activeShiftCode,
    activeShiftLabel,
    operationalDate
  };
};

/** Select value for "write the officer's name by hand" (only offered when no shift schedule exists). */
export const MANUAL_PETUGAS_ID = '__manual__';

const MANUAL_PETUGAS_TAG = /^\[Petugas: ([^\]]+)\]\s*/;

/** Cleans a hand-written officer name: single line, no brackets, trimmed, max 80 characters. */
export const cleanManualPetugas = (name: string): string =>
  name.replace(/[\[\]\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

/**
 * stock_mutations has no column for a hand-written officer, so the name is kept at the start of
 * the notes as "[Petugas: Nama]" (same style as the "[Ref: ...]" tag of reference numbers).
 */
export const withManualPetugas = (notes: string | null | undefined, name: string): string => {
  const clean = cleanManualPetugas(name);
  const rest = (notes || '').trim();
  return clean ? `[Petugas: ${clean}]${rest ? ` ${rest}` : ''}` : rest;
};

/** The hand-written officer of a mutation, or null. */
export const extractManualPetugas = (notes: string | null | undefined): string | null => {
  const match = MANUAL_PETUGAS_TAG.exec(notes || '');
  return match ? match[1].trim() : null;
};

/** Notes without the "[Petugas: ...]" tag (for display and editing). */
export const stripManualPetugas = (notes: string | null | undefined): string =>
  (notes || '').replace(MANUAL_PETUGAS_TAG, '').trim();

/**
 * Display order of work units in the personel list: API first, then IAS (e.g. "OM/IAS T2"),
 * then any other unit by name, and personnel without a unit last.
 */
const unitRank = (unitName?: string): number => {
  if (!unitName) return 3;
  const name = unitName.toUpperCase();
  if (/\bAPI\b/.test(name)) return 0;
  if (/\bIAS\b/.test(name)) return 1;
  return 2;
};

/** Sorts personnel: unit order (API, IAS, others), then `urutan` (empty last), then name. */
export const compareDutyPersonel = (
  a: { unitName?: string; urutan?: number | null; nama: string },
  b: { unitName?: string; urutan?: number | null; nama: string }
): number => {
  const rank = unitRank(a.unitName) - unitRank(b.unitName);
  if (rank !== 0) return rank;
  if (unitRank(a.unitName) === 2) {
    const byUnit = (a.unitName || '').localeCompare(b.unitName || '');
    if (byUnit !== 0) return byUnit;
  }
  const ua = a.urutan ?? Number.POSITIVE_INFINITY;
  const ub = b.urutan ?? Number.POSITIVE_INFINITY;
  if (ua !== ub) return ua < ub ? -1 : 1;
  return a.nama.localeCompare(b.nama);
};

/**
 * Gets personnel currently on duty based on date and shift schedule.
 * Fallbacks to all personnel if no schedule exists for active date/shift.
 */
export const getActiveDutyPersonel = (
  personelList: Personel[],
  jadwalShiftList: JadwalShift[],
  unitKerjaList: UnitKerja[],
  nowDate: Date = new Date()
): ActiveDutyPersonelResult => {
  const shiftInfo = getCurrentShiftInfo(nowDate);
  const { activeShiftCode, operationalDate } = shiftInfo;

  // Map personnel with formatted names and duty status
  const formattedPersonelList = personelList.map((p) => {
    const unitObj = unitKerjaList.find((u) => u.id === p.unit_id);
    const unitPrefix = unitObj ? `[${unitObj.nama}] ` : '[TEK] ';
    const formattedName = `${unitPrefix}${p.nama}`;

    // Check if scheduled on operationalDate and active shift
    const isDutyActive = jadwalShiftList.some((s) => {
      if (s.personel_id !== p.id) return false;

      // Date check if date property exists on schedule
      const matchesDate = !s.tanggal || s.tanggal === operationalDate;

      // Shift string match: accepts 'PS', 'Pagi', 'Siang' for PS shift, and 'M', 'Malam' for M shift
      const shiftStr = (s.shift || '').toLowerCase();
      let matchesShift = false;

      if (activeShiftCode === 'PS') {
        matchesShift = shiftStr === 'ps' || shiftStr.includes('pagi') || shiftStr.includes('siang');
      } else {
        matchesShift = shiftStr === 'm' || shiftStr.includes('malam');
      }

      // Scheduled but absent (izin/sakit/cuti/...) is not on duty
      const status = (s.status_kehadiran || '').trim().toLowerCase();
      const isPresent = !ABSENT_STATUSES.some((absent) => status.startsWith(absent));

      return matchesDate && matchesShift && isPresent;
    });

    return {
      ...p,
      formattedName,
      isDutyActive
    };
  });

  // API personnel first, then IAS (see compareDutyPersonel)
  const unitNameOf = (unitId?: string) => unitKerjaList.find((u) => u.id === unitId)?.nama;
  formattedPersonelList.sort((a, b) =>
    compareDutyPersonel(
      { unitName: unitNameOf(a.unit_id), urutan: a.urutan, nama: a.nama },
      { unitName: unitNameOf(b.unit_id), urutan: b.urutan, nama: b.nama }
    )
  );

  const activeDutyList = formattedPersonelList.filter((p) => p.isDutyActive);
  const isFallback = activeDutyList.length === 0;

  // Use active duty list if available, otherwise fallback to all personnel
  const personelOptions = !isFallback ? activeDutyList : formattedPersonelList;

  return {
    personelOptions,
    activeDutyList,
    isFallback,
    shiftInfo
  };
};
