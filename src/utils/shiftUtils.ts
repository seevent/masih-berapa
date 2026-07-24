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

      return matchesDate && matchesShift;
    });

    return {
      ...p,
      formattedName,
      isDutyActive
    };
  });

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
