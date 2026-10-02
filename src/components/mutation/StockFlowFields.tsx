import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { MutationType, Sparepart } from '../../types';
import { FlowOptions, StockBucket, STOCK_BUCKET_LABEL } from '../../utils/stock';

export interface StockFlowFormState extends FlowOptions {
  /** Serah Terima: the other party (receiver when handing over, giver when receiving) */
  pihak: string;
  unitPihak: string;
}

export const initialStockFlowForm: StockFlowFormState = {
  rusakAsal: 'bekas',
  arah: 'serah',
  kondisi: 'baru',
  pihak: '',
  unitPihak: ''
};

/** Whether the extra fields of this type are filled in enough to submit. */
export const isStockFlowFormComplete = (type: MutationType, form: StockFlowFormState): boolean =>
  type !== 'Serah Terima' || form.pihak.trim().length > 0;

interface StockFlowFieldsProps {
  mutationType: MutationType;
  value: StockFlowFormState;
  onChange: (next: StockFlowFormState) => void;
  /** Used to show the stock available in each bucket */
  part?: Sparepart | null;
}

const stockOf = (part: Sparepart | null | undefined, bucket: StockBucket): number | null => {
  if (!part) return null;
  if (bucket === 'baru') return part.stok_aktual;
  if (bucket === 'bekas') return part.stok_bekas;
  return part.stok_rusak;
};

const optionClass = (selected: boolean) =>
  `flex-1 px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
    selected
      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200'
      : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
  }`;

/** Extra inputs for 'Rusak' (which stock it comes from) and 'Serah Terima' (direction, condition, party). */
export const StockFlowFields: React.FC<StockFlowFieldsProps> = ({ mutationType, value, onChange, part }) => {
  const set = (patch: Partial<StockFlowFormState>) => onChange({ ...value, ...patch });

  if (mutationType === 'Rusak') {
    return (
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider">
          Barang rusak diambil dari
        </label>
        <div className="flex gap-2">
          {(['bekas', 'baru'] as const).map((b) => (
            <button key={b} type="button" onClick={() => set({ rusakAsal: b })} className={optionClass(value.rusakAsal === b)}>
              {STOCK_BUCKET_LABEL[b]}
              {part && <span className="block text-[10px] font-normal opacity-80">Tersedia: {stockOf(part, b)}</span>}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">
          Barang dipindah ke Stok Rusak. Pilih Stok Baru untuk barang baru yang ternyata tidak bisa dipakai saat dipasang.
        </p>
      </div>
    );
  }

  if (mutationType === 'Serah Terima') {
    const isSerah = value.arah === 'serah';
    return (
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider">Arah Serah Terima</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => set({ arah: 'serah' })} className={optionClass(isSerah)}>
              <ArrowUpFromLine className="w-4 h-4 mb-1" />
              Serahkan
              <span className="block text-[10px] font-normal opacity-80">Keluar dari gudang</span>
            </button>
            <button type="button" onClick={() => set({ arah: 'terima' })} className={optionClass(!isSerah)}>
              <ArrowDownToLine className="w-4 h-4 mb-1" />
              Terima
              <span className="block text-[10px] font-normal opacity-80">Masuk ke gudang</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider">Kondisi Barang</label>
          <div className="flex gap-2">
            {(['baru', 'bekas', 'rusak'] as const).map((b) => (
              <button key={b} type="button" onClick={() => set({ kondisi: b })} className={optionClass(value.kondisi === b)}>
                {b.charAt(0).toUpperCase() + b.slice(1)}
                {part && isSerah && (
                  <span className="block text-[10px] font-normal opacity-80">Tersedia: {stockOf(part, b)}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              {isSerah ? 'Diserahkan kepada *' : 'Diterima dari *'}
            </label>
            <input
              type="text"
              required
              value={value.pihak}
              onChange={(e) => set({ pihak: e.target.value })}
              placeholder="Nama orang / pihak"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Unit / Instansi</label>
            <input
              type="text"
              value={value.unitPihak}
              onChange={(e) => set({ unitPihak: e.target.value })}
              placeholder="Contoh: Unit T3, Vendor X"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
};
