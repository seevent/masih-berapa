import React from 'react';
import { MANUAL_PETUGAS_ID } from '../../utils/shiftUtils';

interface PetugasOption {
  id: string;
  formattedName: string;
}

interface PetugasSelectProps {
  options: PetugasOption[];
  value: string;
  onChange: (id: string) => void;
  /** No shift schedule for the active shift: the list falls back to everyone and manual entry is offered */
  isFallback: boolean;
  manualName: string;
  onManualNameChange: (name: string) => void;
}

/** Officer picker; offers a hand-written name when the shift schedule has not been uploaded. */
export const PetugasSelect: React.FC<PetugasSelectProps> = ({
  options,
  value,
  onChange,
  isFallback,
  manualName,
  onManualNameChange
}) => {
  const isManual = isFallback && value === MANUAL_PETUGAS_ID;

  return (
    <div className="space-y-2">
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 cursor-pointer font-bold"
      >
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.formattedName}
          </option>
        ))}
        {isFallback && <option value={MANUAL_PETUGAS_ID}>Tulis nama manual…</option>}
      </select>
      {isManual && (
        <input
          type="text"
          required
          maxLength={80}
          autoFocus
          value={manualName}
          onChange={(e) => onManualNameChange(e.target.value)}
          placeholder="Tulis nama petugas…"
          className={`w-full bg-slate-900 border rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 ${
            manualName.trim() ? 'border-slate-700' : 'border-amber-500/60'
          }`}
        />
      )}
    </div>
  );
};
