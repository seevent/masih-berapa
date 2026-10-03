import { Lokasi, StockMutation, TitikLokasi } from '../types';

/**
 * Where a unit sits (Pakai) or came from (Masuk bekas/rusak): lokasi → titik → unit, each either
 * picked from the list or typed by hand. State of the picker in the transaction form.
 */
export interface PlaceValue {
  lokasiId: string;
  titikId: string;
  unitId: string;
  lokasiManual: string;
  titikManual: string;
  unitManual: string;
  /** Field is typed by hand instead of picked from the list */
  manualLokasi: boolean;
  manualTitik: boolean;
  manualUnit: boolean;
}

export const emptyPlace: PlaceValue = {
  lokasiId: '',
  titikId: '',
  unitId: '',
  lokasiManual: '',
  titikManual: '',
  unitManual: '',
  manualLokasi: false,
  manualTitik: false,
  manualUnit: false
};

/** The stock_mutations columns that describe the place. Either the id or the manual text is set, never both. */
export interface PlaceColumns {
  unit_id: string | null;
  lokasi_id: string | null;
  titik_id: string | null;
  lokasi_manual: string | null;
  titik_manual: string | null;
  unit_manual: string | null;
}

export const emptyPlaceColumns: PlaceColumns = {
  unit_id: null,
  lokasi_id: null,
  titik_id: null,
  lokasi_manual: null,
  titik_manual: null,
  unit_manual: null
};

/**
 * Columns to write for a picker value. A hand-typed lokasi has no titik list, so its titik is
 * typed by hand too. With `allowManual` false (Pakai) only list values are kept: Pakai needs a
 * real unit_id for MTBF.
 */
export const placeToColumns = (p: PlaceValue, allowManual = true): PlaceColumns => {
  const lokasiManual = allowManual && p.manualLokasi;
  const titikManual = allowManual && (p.manualTitik || p.manualLokasi);
  const unitManual = allowManual && p.manualUnit;
  const text = (manual: boolean, v: string) => (manual ? v.trim() || null : null);
  const id = (manual: boolean, v: string) => (manual ? null : v || null);
  return {
    lokasi_id: id(lokasiManual, p.lokasiId),
    titik_id: id(titikManual, p.titikId),
    unit_id: id(unitManual, p.unitId),
    lokasi_manual: text(lokasiManual, p.lokasiManual),
    titik_manual: text(titikManual, p.titikManual),
    unit_manual: text(unitManual, p.unitManual)
  };
};

type PlaceSource = Partial<
  Pick<StockMutation, 'unit_id' | 'lokasi_id' | 'titik_id' | 'lokasi_manual' | 'titik_manual' | 'unit_manual'>
>;

/** Picker value that reproduces a stored mutation (edit form). */
export const placeFromMutation = (m: PlaceSource): PlaceValue => ({
  lokasiId: m.lokasi_id || '',
  titikId: m.titik_id || '',
  unitId: m.unit_id || '',
  lokasiManual: m.lokasi_manual || '',
  titikManual: m.titik_manual || '',
  unitManual: m.unit_manual || '',
  manualLokasi: Boolean(m.lokasi_manual),
  manualTitik: Boolean(m.titik_manual),
  manualUnit: Boolean(m.unit_manual)
});

/** The place columns exactly as stored on a mutation. */
export const placeColumnsOf = (m: PlaceSource): PlaceColumns => ({
  unit_id: m.unit_id || null,
  lokasi_id: m.lokasi_id || null,
  titik_id: m.titik_id || null,
  lokasi_manual: m.lokasi_manual || null,
  titik_manual: m.titik_manual || null,
  unit_manual: m.unit_manual || null
});

/** Pakai keeps only list values: it needs a real unit_id (MTBF per unit), so hand-typed text is dropped. */
export const listOnlyPlace = (c: PlaceColumns): PlaceColumns => ({
  ...c,
  lokasi_manual: null,
  titik_manual: null,
  unit_manual: null
});

/** "HBSCP 1.5", "X-Ray Conveyor Belt 15"; just the lokasi when there is no titik. */
export const formatPlace = (lokasi?: string | null, titik?: string | null): string =>
  [lokasi, titik].filter(Boolean).join(' ');

/** Saved lokasi + titik of a mutation as text ('' when none was saved). */
export const describeMutationPlace = (
  m: PlaceSource,
  lokasiList: Pick<Lokasi, 'id' | 'nama'>[],
  titikList: Pick<TitikLokasi, 'id' | 'nomor'>[]
): string => {
  const lokasi = (m.lokasi_id && lokasiList.find((l) => l.id === m.lokasi_id)?.nama) || m.lokasi_manual || '';
  const titik = (m.titik_id && titikList.find((t) => t.id === m.titik_id)?.nomor) || m.titik_manual || '';
  return formatPlace(lokasi, titik);
};
