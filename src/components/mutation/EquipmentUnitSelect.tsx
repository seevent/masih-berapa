import React from 'react';
import { TipePeralatan, UnitPeralatan } from '../../types';

interface EquipmentUnitSelectProps {
  value: string;
  onChange: (unitId: string) => void;
  /** Units compatible with the chosen spareparts (and place) */
  units: UnitPeralatan[];
  tipePeralatan: TipePeralatan[];
  /** 'Pakai' must name a unit; other types may leave it empty */
  required: boolean;
  disabled?: boolean;
  className?: string;
}

/** Unit peralatan picker; lists only the units that fit the chosen spareparts. */
export const EquipmentUnitSelect: React.FC<EquipmentUnitSelectProps> = ({
  value,
  onChange,
  units,
  tipePeralatan,
  required,
  disabled,
  className
}) => {
  const label = (u: UnitPeralatan) => {
    const tp = tipePeralatan.find((t) => t.id === u.id_tipe);
    return `[${tp?.nama || 'Unit'}] ${u.serial_number || u.id} (${u.status})`;
  };

  // Keep a selected unit visible even when it is no longer in the list (e.g. an old row being edited)
  const listed = units.some((u) => u.id === value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      className={
        className ||
        `w-full bg-slate-900 border rounded-xl px-3 py-2 text-white cursor-pointer disabled:opacity-50 ${
          required && !value ? 'border-amber-500/60' : 'border-slate-700'
        }`
      }
    >
      <option value="">{required ? '-- Pilih unit (wajib untuk Pakai) --' : '-- Tanpa Unit Spesifik --'}</option>
      {value && !listed && <option value={value}>Unit tidak ada di daftar kompatibel ({value.slice(0, 8)}…)</option>}
      {units.map((u) => (
        <option key={u.id} value={u.id}>
          {label(u)}
        </option>
      ))}
    </select>
  );
};
