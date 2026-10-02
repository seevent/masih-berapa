import React from 'react';
import { TipePeralatan, UnitPeralatan } from '../../types';

interface EquipmentUnitSelectProps {
  value: string;
  onChange: (unitId: string) => void;
  compatibleUnits: UnitPeralatan[];
  otherUnits: UnitPeralatan[];
  tipePeralatan: TipePeralatan[];
  /** 'Pakai' must name a unit; other types may leave it empty */
  required: boolean;
  className?: string;
}

/** Unit peralatan picker: compatible units first, then all other units in a separate group. */
export const EquipmentUnitSelect: React.FC<EquipmentUnitSelectProps> = ({
  value,
  onChange,
  compatibleUnits,
  otherUnits,
  tipePeralatan,
  required,
  className
}) => {
  const label = (u: UnitPeralatan) => {
    const tp = tipePeralatan.find((t) => t.id === u.id_tipe);
    return `[${tp?.nama || 'Unit'}] ${u.serial_number || u.id} (${u.status})`;
  };

  // Keep a selected unit visible even when the location filter no longer lists it
  const listed = compatibleUnits.some((u) => u.id === value) || otherUnits.some((u) => u.id === value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={
        className ||
        `w-full bg-slate-900 border rounded-xl px-3 py-2 text-white cursor-pointer ${
          required && !value ? 'border-amber-500/60' : 'border-slate-700'
        }`
      }
    >
      <option value="">{required ? '-- Pilih unit (wajib untuk Pakai) --' : '-- Tanpa Unit Spesifik --'}</option>
      {value && !listed && <option value={value}>Unit tidak ada di daftar ({value.slice(0, 8)}…)</option>}
      {compatibleUnits.length > 0 && (
        <optgroup label="✨ Unit Kompatibel">
          {compatibleUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {label(u)}
            </option>
          ))}
        </optgroup>
      )}
      {otherUnits.length > 0 && (
        <optgroup label="Unit Lain (tidak tercatat kompatibel)">
          {otherUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {label(u)}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
};
