import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Sparepart } from '../../types';
import { getCompatibleEquipment } from '../../utils/compatibility';
import { EquipmentUnitSelect } from './EquipmentUnitSelect';

interface EquipmentPlacePickerProps {
  /** Spareparts of the transaction (or line); "compatible" = fits all of them */
  parts: Array<Sparepart | undefined | null>;
  unitId: string;
  onUnitChange: (unitId: string) => void;
  /** Pakai must name a unit; Masuk bekas/rusak may leave it empty */
  required: boolean;
  unitLabel?: string;
}

/**
 * Lokasi → Titik → Unit peralatan. Lokasi and titik only narrow down the unit list; the chosen
 * unit is the only value that is saved. Shared by Pakai (where it is installed) and Masuk
 * bekas/rusak (where it was removed from).
 */
export const EquipmentPlacePicker: React.FC<EquipmentPlacePickerProps> = ({
  parts,
  unitId,
  onUnitChange,
  required,
  unitLabel = 'Unit Peralatan'
}) => {
  const { lokasiList, titikLokasiList, unitPeralatanList, penempatanList, sparepartCompatibility, tipePeralatan } =
    useInventory();
  const [lokasiId, setLokasiId] = useState('');
  const [titikId, setTitikId] = useState('');

  const equipment = getCompatibleEquipment({
    parts,
    sparepartCompatibility,
    lokasiList,
    titikLokasiList,
    unitPeralatanList,
    penempatanList,
    selectedLokasiId: lokasiId,
    selectedTitikId: titikId
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
      <div>
        <label className="block font-semibold text-slate-300 mb-1">Lokasi Area</label>
        <select
          value={lokasiId}
          onChange={(e) => {
            setLokasiId(e.target.value);
            setTitikId('');
            onUnitChange('');
          }}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white cursor-pointer"
        >
          <option value="">-- Semua Lokasi --</option>
          {equipment.compatibleLokasiList.length > 0 && (
            <optgroup label="Lokasi Kompatibel">
              {equipment.compatibleLokasiList.map((lok) => (
                <option key={lok.id} value={lok.id}>
                  {lok.nama}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Lokasi Lain">
            {equipment.otherLokasiList.map((lok) => (
              <option key={lok.id} value={lok.id}>
                {lok.nama}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <div>
        <label className="block font-semibold text-slate-300 mb-1">Titik Lokasi</label>
        <select
          value={titikId}
          onChange={(e) => {
            setTitikId(e.target.value);
            onUnitChange('');
          }}
          disabled={!lokasiId}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white cursor-pointer disabled:opacity-50"
        >
          <option value="">-- Semua Titik --</option>
          {equipment.availableTitikList.map((t) => (
            <option key={t.id} value={t.id}>
              Titik {t.nomor}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-semibold text-slate-300 mb-1">
          {unitLabel}
          {required && <span className="text-amber-400"> *</span>}
        </label>
        <EquipmentUnitSelect
          value={unitId}
          onChange={onUnitChange}
          compatibleUnits={equipment.availableUnits}
          otherUnits={equipment.otherUnits}
          tipePeralatan={tipePeralatan}
          required={required}
        />
      </div>
    </div>
  );
};
