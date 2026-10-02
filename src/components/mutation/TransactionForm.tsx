import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Handshake,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  UserCheck
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { MutationType, Sparepart, SupplierType } from '../../types';
import { ACTIVE_MUTATION_TYPES, StockBucket, resolveStockFlow } from '../../utils/stock';
import { getCompatibleEquipment, requiresEquipmentUnit } from '../../utils/compatibility';
import { MANUAL_PETUGAS_ID, cleanManualPetugas, getActiveDutyPersonel } from '../../utils/shiftUtils';
import {
  KondisiPicker,
  StockFlowFields,
  StockFlowFormState,
  initialStockFlowForm,
  isStockFlowFormComplete,
  kondisiIsSource,
  stockOf
} from './StockFlowFields';
import { EquipmentUnitSelect } from './EquipmentUnitSelect';
import { PetugasSelect } from './PetugasSelect';

/** One sparepart line of the form. */
interface LineState {
  key: string;
  sparepart_id: string;
  qty: number;
  kondisi: StockBucket;
  /** Masuk bekas/rusak: unit the part was removed from (optional) */
  unit_id: string;
  /** Masuk bekas/rusak: origin of the part (optional) */
  sumber: SupplierType | '';
}

const newLine = (sparepartId = ''): LineState => ({
  key: crypto.randomUUID(),
  sparepart_id: sparepartId,
  qty: 1,
  kondisi: 'baru',
  unit_id: '',
  sumber: ''
});

const TYPE_INFO: Record<string, { label: string; desc: string; icon: React.ElementType; color: string }> = {
  Masuk: {
    label: 'Masuk',
    desc: 'Barang masuk gudang: baru, bekas (copotan layak pakai), atau rusak',
    icon: ArrowDownLeft,
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
  },
  Pakai: {
    label: 'Pakai',
    desc: 'Dipasang ke unit peralatan, dari stok baru atau bekas',
    icon: ArrowUpRight,
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-300'
  },
  'Serah Terima': {
    label: 'Serah Terima',
    desc: 'Menyerahkan atau menerima barang baru / bekas / rusak dari pihak lain',
    icon: Handshake,
    color: 'border-violet-500/40 bg-violet-500/10 text-violet-300'
  }
};

const SUMBER_OPTIONS: SupplierType[] = ['IASS', 'SUP API', 'SISA PEKERJAAN', 'MANDIRI', 'DARI UNIT LAIN', 'VENDOR'];

interface TransactionFormProps {
  defaultType?: MutationType;
  /** Scanner: every change of `nonce` adds the part (or +1 to its line) */
  incomingPart?: { id: string; nonce: number } | null;
  /** Show the search / jenis / tipe filter above the lines */
  showPartFilters?: boolean;
  /** Notes used when the user leaves the field empty */
  fallbackNotes?: (type: MutationType) => string;
  onSaved?: () => void;
}

/**
 * Transaction form ("nota"): header fields once, then one or more sparepart lines, each with its
 * own quantity and condition. Saved all at once by addMutations (all lines or none).
 */
export const TransactionForm: React.FC<TransactionFormProps> = ({
  defaultType = 'Masuk',
  incomingPart,
  showPartFilters = true,
  fallbackNotes,
  onSaved
}) => {
  const {
    spareparts,
    jenisPeralatan,
    tipePeralatan,
    lokasiList,
    titikLokasiList,
    unitPeralatanList,
    penempatanList,
    unitKerjaList,
    personelList,
    jadwalShiftList,
    sparepartCompatibility,
    addMutations
  } = useInventory();

  const [mutationType, setMutationType] = useState<MutationType>(defaultType);
  const [lines, setLines] = useState<LineState[]>(() => [newLine()]);

  // Filters for the sparepart dropdowns
  const [search, setSearch] = useState('');
  const [jenisFilter, setJenisFilter] = useState('');
  const [tipeFilter, setTipeFilter] = useState('');

  // Header
  const [flowForm, setFlowForm] = useState<StockFlowFormState>(initialStockFlowForm);
  const [sumber, setSumber] = useState<SupplierType>('IASS');
  const [selectedLokasiId, setSelectedLokasiId] = useState('');
  const [selectedTitikId, setSelectedTitikId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedPersonelId, setSelectedPersonelId] = useState('');
  const [manualPetugas, setManualPetugas] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { personelOptions, isFallback, shiftInfo } = getActiveDutyPersonel(personelList, jadwalShiftList, unitKerjaList);

  // Default to the first person on duty (a hand-written name stays while no schedule exists)
  useEffect(() => {
    if (isFallback && selectedPersonelId === MANUAL_PETUGAS_ID) return;
    if (personelOptions.length > 0 && !personelOptions.some((p) => p.id === selectedPersonelId)) {
      setSelectedPersonelId(personelOptions[0].id);
    }
  }, [personelOptions, selectedPersonelId, isFallback]);

  // Scanner: add the scanned part, or +1 on its existing line
  useEffect(() => {
    if (!incomingPart) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.sparepart_id === incomingPart.id);
      if (existing) return prev.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l));
      const empty = prev.find((l) => !l.sparepart_id);
      if (empty) return prev.map((l) => (l === empty ? { ...l, sparepart_id: incomingPart.id } : l));
      return [...prev, newLine(incomingPart.id)];
    });
  }, [incomingPart?.nonce]);

  const changeType = (type: MutationType) => {
    setMutationType(type);
    // Pakai cannot take from stok rusak
    if (type === 'Pakai') {
      setLines((prev) => prev.map((l) => (l.kondisi === 'rusak' ? { ...l, kondisi: 'baru' } : l)));
    }
  };

  const updateLine = (key: string, patch: Partial<LineState>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const removeLine = (key: string) => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));

  const partOf = (id: string) => spareparts.find((sp) => sp.id === id);

  const tipeFilterOptions = jenisFilter ? tipePeralatan.filter((t) => t.id_jenis === jenisFilter) : tipePeralatan;
  const filteredParts = spareparts.filter((sp) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || sp.name.toLowerCase().includes(q) || sp.sku.toLowerCase().includes(q);
    const matchesJenis = !jenisFilter || sp.jenis_ids.includes(jenisFilter);
    const matchesTipe = !tipeFilter || sp.tipe_ids.includes(tipeFilter);
    return matchesSearch && matchesJenis && matchesTipe;
  });

  // Pakai: one unit for all lines; "compatible" = fits every chosen part
  const chosenParts = lines.map((l) => partOf(l.sparepart_id)).filter((p): p is Sparepart => Boolean(p));
  const equipment = getCompatibleEquipment({
    parts: chosenParts,
    sparepartCompatibility,
    lokasiList,
    titikLokasiList,
    unitPeralatanList,
    penempatanList,
    selectedLokasiId,
    selectedTitikId
  });

  // Quantity taken from each (part, bucket) by all lines together, to warn before saving
  const isOutgoing = kondisiIsSource(mutationType, flowForm.arah);
  const takenByBucket = useMemo(() => {
    const map = new Map<string, number>();
    if (!isOutgoing) return map;
    lines.forEach((l) => {
      if (!l.sparepart_id) return;
      const k = `${l.sparepart_id}|${l.kondisi}`;
      map.set(k, (map.get(k) || 0) + (Number(l.qty) || 0));
    });
    return map;
  }, [lines, isOutgoing]);
  const shortageOf = (l: LineState): number | null => {
    if (!isOutgoing || !l.sparepart_id) return null;
    const available = stockOf(partOf(l.sparepart_id), l.kondisi) ?? 0;
    const taken = takenByBucket.get(`${l.sparepart_id}|${l.kondisi}`) || 0;
    return taken > available ? available : null;
  };

  const isManualPetugas = isFallback && selectedPersonelId === MANUAL_PETUGAS_ID;
  const petugasMissing = isManualPetugas
    ? !cleanManualPetugas(manualPetugas)
    : !personelOptions.some((p) => p.id === selectedPersonelId);
  const linesIncomplete = lines.some((l) => !l.sparepart_id || !(l.qty >= 1));
  const unitMissing = requiresEquipmentUnit(mutationType) && !selectedUnitId;
  const hasShortage = lines.some((l) => shortageOf(l) !== null);
  const canSubmit =
    !isSubmitting &&
    !linesIncomplete &&
    !petugasMissing &&
    !unitMissing &&
    !hasShortage &&
    isStockFlowFormComplete(mutationType, flowForm);

  const resetAfterSave = () => {
    setLines([newLine()]);
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    const success = await addMutations({
      mutation_type: mutationType,
      lines: lines.map((l) => ({
        sparepart_id: l.sparepart_id,
        qty: l.qty,
        flow: resolveStockFlow(mutationType, { ...flowForm, kondisi: l.kondisi }),
        unit_id: mutationType === 'Masuk' && l.kondisi !== 'baru' ? l.unit_id || null : null,
        sumber: mutationType === 'Masuk' && l.kondisi !== 'baru' ? l.sumber || null : null
      })),
      personel_id: isManualPetugas ? undefined : selectedPersonelId,
      petugas_manual: isManualPetugas ? manualPetugas : undefined,
      unit_id: mutationType === 'Pakai' ? selectedUnitId : undefined,
      sumber: mutationType === 'Masuk' ? sumber : undefined,
      penerima: flowForm.pihak,
      unit_penerima: flowForm.unitPihak,
      notes: notes.trim() || fallbackNotes?.(mutationType) || ''
    });
    setIsSubmitting(false);
    if (success) {
      resetAfterSave();
      onSaved?.();
    }
  };

  const hasBaruLine = lines.some((l) => l.kondisi === 'baru');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Type */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
          1. Tipe Transaksi
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ACTIVE_MUTATION_TYPES.map((type) => {
            const info = TYPE_INFO[type];
            const Icon = info.icon;
            const isSelected = mutationType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => changeType(type)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? `${info.color} ring-2 ring-cyan-500/50 shadow-lg`
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <Icon className="w-5 h-5 mb-2" />
                  <div className="font-bold text-sm text-white">{info.label}</div>
                </div>
                <div className="text-[11px] opacity-80 mt-2 line-clamp-2">{info.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Serah Terima header: direction and other party */}
      {mutationType === 'Serah Terima' && (
        <StockFlowFields mutationType={mutationType} value={flowForm} onChange={setFlowForm} />
      )}

      {/* 2. Lines */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            2. Daftar Sparepart ({lines.length})
          </label>
          <span className="text-[11px] text-slate-500">
            {mutationType === 'Pakai'
              ? 'Kondisi = stok yang dipakai (baru / bekas)'
              : mutationType === 'Masuk'
                ? 'Kondisi = kantong stok yang bertambah'
                : flowForm.arah === 'serah'
                  ? 'Kondisi = stok yang diserahkan'
                  : 'Kondisi = kantong stok yang bertambah'}
          </span>
        </div>

        {showPartFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Sparepart / SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500"
              />
            </div>
            <select
              value={jenisFilter}
              onChange={(e) => {
                setJenisFilter(e.target.value);
                setTipeFilter('');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 cursor-pointer"
            >
              <option value="">Filter Jenis Peralatan</option>
              {jenisPeralatan.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nama}
                </option>
              ))}
            </select>
            <select
              value={tipeFilter}
              onChange={(e) => setTipeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 cursor-pointer"
            >
              <option value="">Filter Tipe Peralatan</option>
              {tipeFilterOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-3">
          {lines.map((line, idx) => {
            const part = partOf(line.sparepart_id);
            // Keep the chosen part selectable even when the filter hides it
            const options = part && !filteredParts.includes(part) ? [part, ...filteredParts] : filteredParts;
            const shortage = shortageOf(line);
            // Masuk bekas/rusak: optional origin (unit it was removed from, and where it came from)
            const lineEquipment =
              mutationType === 'Masuk' && line.kondisi !== 'baru'
                ? getCompatibleEquipment({
                    parts: [part],
                    sparepartCompatibility,
                    lokasiList,
                    titikLokasiList,
                    unitPeralatanList,
                    penempatanList,
                    selectedLokasiId: '',
                    selectedTitikId: ''
                  })
                : null;
            return (
              <div
                key={line.key}
                className={`p-3 rounded-xl bg-slate-950 border space-y-3 ${shortage !== null ? 'border-rose-500/50' : 'border-slate-800'}`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-2.5 text-[11px] font-bold text-slate-500 w-5 shrink-0">{idx + 1}.</span>
                  <select
                    required
                    value={line.sparepart_id}
                    onChange={(e) => updateLine(line.key, { sparepart_id: e.target.value, unit_id: '' })}
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">-- Pilih sparepart ({filteredParts.length} item) --</option>
                    {options.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        [{sp.sku}] {sp.name} — Baru {sp.stok_aktual} · Bekas {sp.stok_bekas} · Rusak {sp.stok_rusak}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length === 1}
                    title="Hapus baris"
                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-3 pl-7">
                  <KondisiPicker
                    mutationType={mutationType}
                    value={line.kondisi}
                    onChange={(kondisi) => updateLine(line.key, { kondisi })}
                    arah={flowForm.arah}
                    part={part}
                    compact
                  />
                  <div>
                    <input
                      type="number"
                      min={1}
                      required
                      value={line.qty}
                      onChange={(e) => updateLine(line.key, { qty: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-center focus:border-cyan-500"
                      aria-label="Jumlah"
                    />
                    <span className="block text-[10px] text-slate-500 text-center mt-0.5">{part?.unit || 'Jumlah'}</span>
                  </div>
                </div>

                {shortage !== null && (
                  <p className="pl-7 text-[11px] text-rose-400">
                    Stok {line.kondisi} hanya {shortage}; total baris ini (bersama baris lain dengan sparepart dan kondisi yang sama) melebihi stok.
                  </p>
                )}

                {lineEquipment && (
                  <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Unit peralatan asal (opsional)
                      </label>
                      <EquipmentUnitSelect
                        value={line.unit_id}
                        onChange={(unitId) => updateLine(line.key, { unit_id: unitId })}
                        compatibleUnits={lineEquipment.availableUnits}
                        otherUnits={lineEquipment.otherUnits}
                        tipePeralatan={tipePeralatan}
                        required={false}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Sumber asal barang (opsional)
                      </label>
                      <select
                        value={line.sumber}
                        onChange={(e) => updateLine(line.key, { sumber: e.target.value as SupplierType | '' })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="">-- Tidak diisi --</option>
                        {SUMBER_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, newLine()])}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-300 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          Tambah sparepart
        </button>
      </div>

      {/* 3. Pakai: one unit for the whole transaction */}
      {mutationType === 'Pakai' && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>3. Unit Peralatan Tempat Dipasang</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Lokasi Area</label>
              <select
                value={selectedLokasiId}
                onChange={(e) => {
                  setSelectedLokasiId(e.target.value);
                  setSelectedTitikId('');
                  setSelectedUnitId('');
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
                value={selectedTitikId}
                onChange={(e) => {
                  setSelectedTitikId(e.target.value);
                  setSelectedUnitId('');
                }}
                disabled={!selectedLokasiId}
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
                Unit Peralatan<span className="text-amber-400"> *</span>
              </label>
              <EquipmentUnitSelect
                value={selectedUnitId}
                onChange={setSelectedUnitId}
                compatibleUnits={equipment.availableUnits}
                otherUnits={equipment.otherUnits}
                tipePeralatan={tipePeralatan}
                required
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Semua baris dipasang di unit ini. "Unit Kompatibel" = cocok dengan semua sparepart di daftar.
          </p>
        </div>
      )}

      {/* Masuk: origin of new stock */}
      {mutationType === 'Masuk' && hasBaruLine && (
        <div className="max-w-xs">
          <label className="block text-xs font-semibold text-slate-300 mb-1">Sumber Asal Barang Baru</label>
          <select
            value={sumber}
            onChange={(e) => setSumber(e.target.value as SupplierType)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:border-cyan-500 cursor-pointer"
          >
            {SUMBER_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Petugas */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Personel Berdinas</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {shiftInfo.operationalDate}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{shiftInfo.activeShiftLabel}</span>
            </span>
          </div>
        </div>
        {isFallback && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Jadwal shift untuk tanggal ini ({shiftInfo.operationalDate}) belum diisi. Menampilkan semua personel; bila nama
              tidak ada, pilih "Tulis nama manual".
            </span>
          </div>
        )}
        <PetugasSelect
          options={personelOptions}
          value={selectedPersonelId}
          onChange={setSelectedPersonelId}
          isFallback={isFallback}
          manualName={manualPetugas}
          onManualNameChange={setManualPetugas}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          Catatan Transaksi
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detail alasan transaksi, kondisi sparepart, atau lokasi unit..."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500"
        />
      </div>

      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500">
          {lines.length} baris disimpan sekaligus. Bila satu baris gagal, tidak ada yang tersimpan.
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{isSubmitting ? 'Menyimpan...' : `Simpan ${mutationType} (${lines.length} baris)`}</span>
        </button>
      </div>
    </form>
  );
};
