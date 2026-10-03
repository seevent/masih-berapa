import React, { useState } from 'react';
import { SupplierType } from '../../types';

export const SUMBER_OPTIONS: SupplierType[] = ['IASS', 'SUP API', 'SISA PEKERJAAN', 'MANDIRI', 'DARI UNIT LAIN', 'VENDOR'];

const MANUAL = '__manual__';

interface SumberInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Adds a "Tidak diisi" choice (Masuk bekas/rusak); Masuk baru always needs a sumber */
  optional?: boolean;
  className?: string;
}

const inputClass =
  'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500';

/**
 * Sumber asal barang: one of the usual sources, or written by hand. A value that is not in the
 * list opens in manual mode, so a hand-written source stays editable.
 */
export const SumberInput: React.FC<SumberInputProps> = ({ value, onChange, optional = false, className }) => {
  const [manual, setManual] = useState(Boolean(value) && !SUMBER_OPTIONS.includes(value as SupplierType));

  if (manual) {
    return (
      <div className={`flex gap-2 ${className || ''}`}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tulis sumber asal barang"
          className={inputClass}
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            setManual(false);
            onChange(optional ? '' : SUMBER_OPTIONS[0]);
          }}
          className="shrink-0 px-3 rounded-xl border border-slate-700 text-[11px] text-slate-300 hover:border-cyan-500 hover:text-cyan-300"
        >
          Pilih daftar
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === MANUAL) {
          setManual(true);
          onChange('');
        } else {
          onChange(e.target.value);
        }
      }}
      className={`${inputClass} cursor-pointer ${className || ''}`}
    >
      {optional && <option value="">-- Tidak diisi --</option>}
      {SUMBER_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
      <option value={MANUAL}>✎ Tulis manual…</option>
    </select>
  );
};
