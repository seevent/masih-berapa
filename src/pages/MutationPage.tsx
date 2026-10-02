import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Trash2,
  CheckCircle2,
  UserCheck,
  MessageSquare,
  Cpu,
  Clock,
  Search,
  Filter,
  MapPin,
  Building2,
  AlertCircle,
  Handshake
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { MutationType, SupplierType } from '../types';
import { resolveStockFlow } from '../utils/stock';
import {
  StockFlowFields,
  StockFlowFormState,
  initialStockFlowForm,
  isStockFlowFormComplete
} from '../components/mutation/StockFlowFields';
import { getCompatibleEquipment, requiresEquipmentUnit, usesEquipmentUnit } from '../utils/compatibility';
import { EquipmentUnitSelect } from '../components/mutation/EquipmentUnitSelect';
import { MANUAL_PETUGAS_ID, cleanManualPetugas, getActiveDutyPersonel } from '../utils/shiftUtils';
import { PetugasSelect } from '../components/mutation/PetugasSelect';

export const MutationPage: React.FC = () => {
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
    addMutation
  } = useInventory();

  const navigate = useNavigate();

  // 1. Mutation Type State
  const [mutationType, setMutationType] = useState<MutationType>('Masuk');

  // 2. Sparepart Search & Filter State
  const [sparepartSearch, setSparepartSearch] = useState('');
  const [selectedJenisFilter, setSelectedJenisFilter] = useState('');
  const [selectedTipeFilter, setSelectedTipeFilter] = useState('');
  const [selectedSparepartId, setSelectedSparepartId] = useState('');

  // 3. Personel State
  const [selectedPersonelId, setSelectedPersonelId] = useState('');
  const [manualPetugas, setManualPetugas] = useState('');

  // 4. Conditional Location & Equipment Unit State (Only for 'Pakai' & 'Bekas')
  const [selectedLokasiId, setSelectedLokasiId] = useState('');
  const [selectedTitikId, setSelectedTitikId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  // 5. Quantity, Sumber & Notes
  const [sumber, setSumber] = useState<SupplierType>('IASS');
  const [flowForm, setFlowForm] = useState<StockFlowFormState>(initialStockFlowForm);
  const [qty, setQty] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Calculate Shift Time & Filter Active Duty Personel ---
  const {
    personelOptions,
    isFallback,
    shiftInfo
  } = getActiveDutyPersonel(personelList, jadwalShiftList, unitKerjaList);

  const { activeShiftLabel, operationalDate } = shiftInfo;

  // Default select first available personnel
  // (also re-selects when the active shift changes and the chosen person is no longer on duty)
  useEffect(() => {
    // A hand-written name stays selected while no schedule exists (isFallback)
    if (isFallback && selectedPersonelId === MANUAL_PETUGAS_ID) return;
    if (personelOptions.length > 0 && !personelOptions.some((p) => p.id === selectedPersonelId)) {
      setSelectedPersonelId(personelOptions[0].id);
    }
  }, [personelOptions, selectedPersonelId, isFallback]);

  // Available Tipe filter options based on selected Jenis filter
  const availableTipesForFilter = selectedJenisFilter
    ? tipePeralatan.filter((t) => t.id_jenis === selectedJenisFilter)
    : tipePeralatan;

  // Filtered Spareparts List
  const filteredSpareparts = spareparts.filter((sp) => {
    const matchesSearch =
      sp.name.toLowerCase().includes(sparepartSearch.toLowerCase()) ||
      sp.sku.toLowerCase().includes(sparepartSearch.toLowerCase());

    const matchesJenis = !selectedJenisFilter || sp.jenis_ids.includes(selectedJenisFilter);
    const matchesTipe = !selectedTipeFilter || sp.tipe_ids.includes(selectedTipeFilter);

    return matchesSearch && matchesJenis && matchesTipe;
  });

  const selectedPart = spareparts.find((p) => p.id === selectedSparepartId);

  // --- Compatible Locations & Equipment Units for Selected Sparepart ---
  const { compatibleLokasiList, otherLokasiList, availableTitikList, availableUnits: availableUnitsForLocation, otherUnits } =
    getCompatibleEquipment({
      part: selectedPart,
      sparepartCompatibility,
      lokasiList,
      titikLokasiList,
      unitPeralatanList,
      penempatanList,
      selectedLokasiId,
      selectedTitikId
    });

  const selectedPersonelObj = personelOptions.find((p) => p.id === selectedPersonelId);
  const isManualPetugas = isFallback && selectedPersonelId === MANUAL_PETUGAS_ID;
  const petugasMissing = isManualPetugas ? !cleanManualPetugas(manualPetugas) : !selectedPersonelObj;

  // Equipment unit / location applies when a part goes into or comes out of a machine; 'Pakai' requires it
  const showsEquipmentUnit = usesEquipmentUnit(mutationType);
  const unitMissing = requiresEquipmentUnit(mutationType) && !selectedUnitId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSparepartId || qty <= 0 || petugasMissing) return;
    if (!isStockFlowFormComplete(mutationType, flowForm) || unitMissing) return;

    setIsSubmitting(true);

    const success = await addMutation({
      sparepart_id: selectedSparepartId,
      unit_id: showsEquipmentUnit ? selectedUnitId || undefined : undefined,
      personel_id: isManualPetugas ? undefined : selectedPersonelObj?.id,
      petugas_manual: isManualPetugas ? manualPetugas : undefined,
      mutation_type: mutationType,
      flow: resolveStockFlow(mutationType, flowForm),
      sumber: mutationType === 'Masuk' ? sumber : undefined,
      penerima: flowForm.pihak,
      unit_penerima: flowForm.unitPihak,
      qty,
      notes: notes.trim()
    });

    setIsSubmitting(false);
    if (success) {
      navigate('/history');
    }
  };

  const mutationTypesInfo = [
    {
      type: 'Masuk' as MutationType,
      label: 'Masuk',
      desc: 'Penambahan stok baru dari Pembelian / PO Vendor',
      icon: ArrowDownLeft,
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    },
    {
      type: 'Pakai' as MutationType,
      label: 'Pakai',
      desc: 'Pengeluaran stok untuk pemakaian perbaikan unit',
      icon: ArrowUpRight,
      color: 'border-blue-500/40 bg-blue-500/10 text-blue-300'
    },
    {
      type: 'Bekas' as MutationType,
      label: 'Bekas',
      desc: 'Mengembalikan barang bekas yang dilepas dari mesin ke stok backup',
      icon: RotateCcw,
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300'
    },
    {
      type: 'Rusak' as MutationType,
      label: 'Rusak',
      desc: 'Barang baru / bekas yang tidak layak pakai dipindah ke stok rusak',
      icon: Trash2,
      color: 'border-rose-500/40 bg-rose-500/10 text-rose-300'
    },
    {
      type: 'Serah Terima' as MutationType,
      label: 'Serah Terima',
      desc: 'Menyerahkan atau menerima barang baru / bekas / rusak dari pihak lain',
      icon: Handshake,
      color: 'border-violet-500/40 bg-violet-500/10 text-violet-300'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Input Transaksi & Mutasi Stok</h1>
        <p className="text-sm text-slate-400 mt-1">
          Form pencatatan barang Masuk, Pakai work order, Pengembalian Bekas, Rusak, dan Serah Terima.
        </p>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-800 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Select Mutation Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              1. Pilih Tipe Transaksi Mutasi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {mutationTypesInfo.map((m) => {
                const Icon = m.icon;
                const isSelected = mutationType === m.type;
                return (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setMutationType(m.type)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? `${m.color} ring-2 ring-cyan-500/50 shadow-lg`
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <Icon className="w-5 h-5 mb-2" />
                      <div className="font-bold text-sm text-white">{m.label}</div>
                    </div>
                    <div className="text-[11px] opacity-80 mt-2 line-clamp-2">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Select Sparepart Item with Search & Filter */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Pilih Sparepart Master
            </label>

            {/* Filter Controls for Search Results */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Sparepart / SKU..."
                  value={sparepartSearch}
                  onChange={(e) => setSparepartSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <select
                  value={selectedJenisFilter}
                  onChange={(e) => {
                    setSelectedJenisFilter(e.target.value);
                    setSelectedTipeFilter('');
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
              </div>

              <div>
                <select
                  value={selectedTipeFilter}
                  onChange={(e) => setSelectedTipeFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">Filter Tipe Peralatan</option>
                  {availableTipesForFilter.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sparepart Select Box */}
            <select
              required
              value={selectedSparepartId}
              onChange={(e) => {
                setSelectedSparepartId(e.target.value);
                setSelectedLokasiId('');
                setSelectedTitikId('');
                setSelectedUnitId('');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
            >
              <option value="">-- Pilih Sparepart berdasarkan SKU / Nama ({filteredSpareparts.length} item) --</option>
              {filteredSpareparts.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  [{sp.sku}] {sp.name} — Stok Baru: {sp.stok_aktual} {sp.unit || 'PCS'} | Bekas: {sp.stok_bekas} {sp.unit || 'PCS'}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Item Preview Box */}
          {selectedPart && (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div>
                <span className="font-mono text-cyan-400 font-bold">{selectedPart.sku}</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{selectedPart.name}</h4>
                <p className="text-slate-400 mt-1">Gudang: {selectedPart.lokasi || '-'} | Rak: {selectedPart.rack || '-'}</p>
              </div>
              <div className="flex items-center gap-4 bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Stok Baru</span>
                  <span className="font-bold text-emerald-400 text-sm">{selectedPart.stok_aktual} {selectedPart.unit || 'PCS'}</span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Stok Bekas</span>
                  <span className="font-bold text-amber-400 text-sm">{selectedPart.stok_bekas} {selectedPart.unit || 'PCS'}</span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Stok Rusak</span>
                  <span className="font-bold text-rose-400 text-sm">{selectedPart.stok_rusak} {selectedPart.unit || 'PCS'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Extra fields: Rusak (asal stok) & Serah Terima (arah, kondisi, pihak) */}
          <StockFlowFields mutationType={mutationType} value={flowForm} onChange={setFlowForm} part={selectedPart} />

          {/* 3. Dynamic Location & Compatible Equipment Dropdowns (Pakai, Bekas & Rusak) */}
          {showsEquipmentUnit && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>3. Penempatan Lokasi & Peralatan Kompatibel</span>
                </label>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Trans: {mutationType}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Select Lokasi */}
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
                    <option value="">-- Semua Lokasi / Pilih Lokasi --</option>

                    {compatibleLokasiList.length > 0 && (
                      <optgroup label="✨ Lokasi Kompatibel">
                        {compatibleLokasiList.map((lok) => (
                          <option key={lok.id} value={lok.id}>
                            {lok.nama}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    <optgroup label="📍 Semua Lokasi Lain">
                      {otherLokasiList.map((lok) => (
                        <option key={lok.id} value={lok.id}>
                          {lok.nama}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Select Titik Lokasi */}
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
                    {availableTitikList.map((t) => (
                      <option key={t.id} value={t.id}>
                        Titik {t.nomor}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Unit Peralatan */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Unit Peralatan{requiresEquipmentUnit(mutationType) && <span className="text-amber-400"> *</span>}
                  </label>
                  <EquipmentUnitSelect
                    value={selectedUnitId}
                    onChange={setSelectedUnitId}
                    compatibleUnits={availableUnitsForLocation}
                    otherUnits={otherUnits}
                    tipePeralatan={tipePeralatan}
                    required={requiresEquipmentUnit(mutationType)}
                  />
                  {unitMissing && (
                    <p className="text-[10px] text-amber-400 mt-1">Pakai wajib memilih unit tempat sparepart dipasang.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. Personel Operator Berdinas */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Personel Berdinas</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {operationalDate}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{activeShiftLabel}</span>
                </span>
              </div>
            </div>

            {isFallback && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Jadwal shift untuk tanggal ini ({operationalDate}) belum diisi. Menampilkan semua personel sebagai pilihan; bila nama tidak ada, pilih "Tulis nama manual".</span>
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

          {/* 5. Transaction Quantity, Sumber & Notes */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mutationType === 'Masuk' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sumber Asal Barang *
                  </label>
                  <select
                    value={sumber}
                    onChange={(e) => setSumber(e.target.value as SupplierType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="IASS">IASS</option>
                    <option value="SUP API">SUP API</option>
                    <option value="SISA PEKERJAAN">SISA PEKERJAAN</option>
                    <option value="MANDIRI">MANDIRI</option>
                    <option value="DARI UNIT LAIN">DARI UNIT LAIN</option>
                    <option value="VENDOR">VENDOR</option>
                  </select>
                </div>
              )}

              <div className={mutationType === 'Masuk' ? '' : 'sm:col-span-2'}>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jumlah Mutasi (Qty Unit)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-base focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Catatan Transaksi - Moved Below */}
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
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !selectedSparepartId || petugasMissing || !isStockFlowFormComplete(mutationType, flowForm) || unitMissing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Simpan Transaksi Mutasi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
