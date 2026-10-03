import React, { useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Sparepart } from '../../types';
import { getCompatibleEquipment } from '../../utils/compatibility';
import { PlaceValue } from '../../utils/place';
import { EquipmentUnitSelect } from './EquipmentUnitSelect';

interface EquipmentPlacePickerProps {
  /** Spareparts of the transaction (or line); only lokasi, titik and units that fit all of them are listed */
  parts: Array<Sparepart | undefined | null>;
  value: PlaceValue;
  onChange: (value: PlaceValue) => void;
  /** Pakai must name a unit; Masuk bekas/rusak may leave it empty */
  required: boolean;
  /** Lets each field be typed by hand (Masuk bekas/rusak). Pakai needs a real unit, so it has none. */
  allowManual: boolean;
  unitLabel?: string;
  /** Drop a selection that stops fitting when the spareparts change. Off when editing old rows. */
  pruneIncompatible?: boolean;
}

const inputClass = 'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white';

/**
 * Lokasi → Titik → Unit peralatan. Lists show only what is compatible with the chosen spareparts.
 * Picking a unit fills its lokasi and titik. With `allowManual`, every field can be typed by hand
 * for places or units that are not (yet) in the data. Shared by Pakai (where it is installed) and
 * Masuk bekas/rusak (where it was removed from).
 */
export const EquipmentPlacePicker: React.FC<EquipmentPlacePickerProps> = ({
  parts,
  value,
  onChange,
  required,
  allowManual,
  unitLabel = 'Unit Peralatan',
  pruneIncompatible = true
}) => {
  const { lokasiList, titikLokasiList, unitPeralatanList, penempatanList, sparepartCompatibility, tipePeralatan } =
    useInventory();

  const lokasiIsManual = allowManual && value.manualLokasi;
  // A hand-typed lokasi has no titik list
  const titikIsManual = allowManual && (value.manualTitik || value.manualLokasi);
  const unitIsManual = allowManual && value.manualUnit;
  const hasParts = parts.some(Boolean);

  const compat = (selectedLokasiId: string, selectedTitikId: string) =>
    getCompatibleEquipment({
      parts,
      sparepartCompatibility,
      lokasiList,
      titikLokasiList,
      unitPeralatanList,
      penempatanList,
      selectedLokasiId,
      selectedTitikId
    });
  const all = compat('', '');
  const eq = compat(lokasiIsManual ? '' : value.lokasiId, titikIsManual ? '' : value.titikId);

  // A chosen part change can make the selection stop fitting: clear it
  const fitKey = `${all.compatTypeIds.join(',')}|${all.compatibleLokasiList.map((l) => l.id).join(',')}`;
  useEffect(() => {
    if (!pruneIncompatible || !hasParts) return;
    const badLokasi =
      Boolean(value.lokasiId) && !lokasiIsManual && !all.compatibleLokasiList.some((l) => l.id === value.lokasiId);
    const badUnit = Boolean(value.unitId) && !unitIsManual && !all.availableUnits.some((u) => u.id === value.unitId);
    if (badLokasi) onChange({ ...value, lokasiId: '', titikId: '', unitId: badUnit ? '' : value.unitId });
    else if (badUnit) onChange({ ...value, unitId: '' });
  }, [fitKey, value.lokasiId, value.unitId]);

  const pickUnit = (unitId: string) => {
    const pen = unitId ? penempatanList.find((p) => p.is_active && p.id_unit === unitId) : undefined;
    // The unit decides its own place, so lokasi and titik follow it (unless lokasi is typed by hand)
    if (pen && !lokasiIsManual) {
      onChange({ ...value, unitId, lokasiId: pen.id_lokasi || '', titikId: pen.id_titik || '', manualTitik: false });
    } else {
      onChange({ ...value, unitId });
    }
  };

  const toggle = (manual: boolean, onClick: () => void) =>
    allowManual && (
      <button type="button" onClick={onClick} className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300">
        {manual ? 'Pilih dari daftar' : 'Tulis manual'}
      </button>
    );

  const selectedLokasiName = lokasiList.find((l) => l.id === value.lokasiId)?.nama;
  const selectedTitikNomor = titikLokasiList.find((t) => t.id === value.titikId)?.nomor;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-300">Lokasi Area</label>
            {toggle(lokasiIsManual, () =>
              onChange(
                lokasiIsManual
                  ? { ...value, manualLokasi: false, lokasiManual: '' }
                  : { ...value, manualLokasi: true, lokasiId: '', titikId: '' }
              )
            )}
          </div>
          {lokasiIsManual ? (
            <input
              type="text"
              value={value.lokasiManual}
              onChange={(e) => onChange({ ...value, lokasiManual: e.target.value })}
              placeholder="Tulis lokasi"
              className={inputClass}
            />
          ) : (
            <select
              value={value.lokasiId}
              onChange={(e) => onChange({ ...value, lokasiId: e.target.value, titikId: '', unitId: '' })}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">-- Semua Lokasi Kompatibel --</option>
              {value.lokasiId && !all.compatibleLokasiList.some((l) => l.id === value.lokasiId) && (
                <option value={value.lokasiId}>{selectedLokasiName || 'Lokasi tidak ada di daftar'}</option>
              )}
              {all.compatibleLokasiList.map((lok) => (
                <option key={lok.id} value={lok.id}>
                  {lok.nama}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-300">Titik Lokasi</label>
            {!lokasiIsManual &&
              toggle(titikIsManual, () =>
                onChange(
                  titikIsManual
                    ? { ...value, manualTitik: false, titikManual: '' }
                    : { ...value, manualTitik: true, titikId: '' }
                )
              )}
          </div>
          {titikIsManual ? (
            <input
              type="text"
              value={value.titikManual}
              onChange={(e) => onChange({ ...value, titikManual: e.target.value })}
              placeholder="Tulis titik / nomor"
              className={inputClass}
            />
          ) : (
            <select
              value={value.titikId}
              onChange={(e) => onChange({ ...value, titikId: e.target.value, unitId: '' })}
              disabled={!value.lokasiId}
              className={`${inputClass} cursor-pointer disabled:opacity-50`}
            >
              <option value="">-- Semua Titik Kompatibel --</option>
              {value.titikId && !eq.availableTitikList.some((t) => t.id === value.titikId) && (
                <option value={value.titikId}>Titik {selectedTitikNomor || 'tidak ada di daftar'}</option>
              )}
              {eq.availableTitikList.map((t) => (
                <option key={t.id} value={t.id}>
                  Titik {t.nomor}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-300">
              {unitLabel}
              {required && <span className="text-amber-400"> *</span>}
            </label>
            {toggle(unitIsManual, () =>
              onChange(
                unitIsManual
                  ? { ...value, manualUnit: false, unitManual: '' }
                  : { ...value, manualUnit: true, unitId: '' }
              )
            )}
          </div>
          {unitIsManual ? (
            <input
              type="text"
              value={value.unitManual}
              onChange={(e) => onChange({ ...value, unitManual: e.target.value })}
              placeholder="Tulis unit / serial"
              className={inputClass}
            />
          ) : (
            <EquipmentUnitSelect
              value={value.unitId}
              onChange={pickUnit}
              units={eq.availableUnits}
              tipePeralatan={tipePeralatan}
              required={required}
            />
          )}
        </div>
      </div>

      {!hasParts ? (
        <p className="text-[11px] text-slate-500">
          Pilih sparepart dulu: daftar hanya menampilkan lokasi, titik, dan unit yang kompatibel dengannya.
        </p>
      ) : (
        all.availableUnits.length === 0 &&
        !unitIsManual && (
          <p className="text-[11px] text-amber-400">
            Belum ada unit terpasang yang kompatibel dengan sparepart ini.{' '}
            {allowManual ? 'Gunakan "Tulis manual", atau' : 'Atur'} tipe kompatibel sparepart di Katalog.
          </p>
        )
      )}
    </div>
  );
};
