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
  FileText,
  MessageSquare,
  Cpu,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { MutationType } from '../types';

export const MutationPage: React.FC = () => {
  const { spareparts, unitPeralatanList, getOnDutyPersonel, addMutation } = useInventory();
  const navigate = useNavigate();

  const onDutyList = getOnDutyPersonel();

  const [selectedSparepartId, setSelectedSparepartId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedPersonelId, setSelectedPersonelId] = useState('');
  const [mutationType, setMutationType] = useState<MutationType>('Masuk');
  const [qty, setQty] = useState<number>(1);
  const [referenceNo, setReferenceNo] = useState('WO-2026-001');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default select first on-duty personnel
  useEffect(() => {
    if (onDutyList.length > 0 && !selectedPersonelId) {
      setSelectedPersonelId(onDutyList[0].id);
    }
  }, [onDutyList, selectedPersonelId]);

  const selectedPart = spareparts.find((p) => p.id === selectedSparepartId);
  const selectedPersonel = onDutyList.find((p) => p.id === selectedPersonelId) || onDutyList[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSparepartId || qty <= 0 || !selectedPersonel) return;

    setIsSubmitting(true);
    const operatorName = `${selectedPersonel.nama} (${selectedPersonel.jabatan || 'Teknisi'})`;

    const success = await addMutation({
      sparepart_id: selectedSparepartId,
      unit_id: selectedUnitId || undefined,
      personel_id: selectedPersonel.id,
      mutation_type: mutationType,
      qty,
      operator_name: operatorName,
      reference_no: referenceNo,
      notes
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
      desc: 'Pengeluaran stok untuk pemakaian perbaikan unit / Work Order',
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
      desc: 'Mengubah status barang menjadi rusak dan menghapus dari stok',
      icon: Trash2,
      color: 'border-rose-500/40 bg-rose-500/10 text-rose-300'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Input Transaksi & Mutasi Stok</h1>
        <p className="text-sm text-slate-400 mt-1">
          Form pencatatan barang Masuk, Pakai work order, Pengembalian Bekas, dan Rusak.
        </p>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-800 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Select Mutation Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              1. Pilih Tipe Transaksi Mutasi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {mutationTypesInfo.map((m) => {
                const Icon = m.icon;
                const isSelected = mutationType === m.type;
                return (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setMutationType(m.type)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
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

          {/* 2. Select Sparepart Item */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              2. Pilih Sparepart Master
            </label>
            <select
              required
              value={selectedSparepartId}
              onChange={(e) => setSelectedSparepartId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
            >
              <option value="">-- Pilih Sparepart berdasarkan SKU / Nama --</option>
              {spareparts.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  [{sp.sku}] {sp.name} — Stok Baru: {sp.stok_aktual} {sp.unit} | Bekas: {sp.stok_bekas} {sp.unit} (Rak: {sp.location_rack})
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
                <p className="text-slate-400 mt-1">Peralatan: {selectedPart.equipment_type_name} | Lokasi: {selectedPart.location_rack}</p>
              </div>
              <div className="flex items-center gap-4 bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Stok Baru</span>
                  <span className="font-bold text-emerald-400 text-sm">{selectedPart.stok_aktual} {selectedPart.unit}</span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Stok Bekas</span>
                  <span className="font-bold text-amber-400 text-sm">{selectedPart.stok_bekas} {selectedPart.unit}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Operator/Personel Berdinas */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>3. Personel Operator Berdinas (Sesuai Jadwal Shift)</span>
              </label>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Shift Active Only
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Pilih Teknisi / Personel Berdinas
                </label>
                <select
                  required
                  value={selectedPersonelId}
                  onChange={(e) => setSelectedPersonelId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 cursor-pointer font-semibold"
                >
                  {onDutyList.length === 0 ? (
                    <option value="">Tidak ada personel berdinas saat ini</option>
                  ) : (
                    onDutyList.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.current_shift || 'Shift Active'}] {p.nama} — NIK: {p.nik} ({p.jabatan || 'Teknisi'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Target Equipment Unit Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  Target Unit Peralatan (Opsional)
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">-- Tanpa Unit Spesifik / Gudang Umum --</option>
                  {unitPeralatanList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.serial_number || u.id} — Status: {u.status} ({u.catatan || 'Unit Asset'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPersonel && (
              <div className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  Operator Terpilih: <span className="font-bold text-white">{selectedPersonel.nama}</span> (NIK: {selectedPersonel.nik})
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">
                  {selectedPersonel.current_shift || 'Berdinas'}
                </span>
              </div>
            )}
          </div>

          {/* 4. Transaction Quantity & References */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                No. Referensi (PO / Work Order)
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Contoh: WO-BFP-9902"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Catatan Transaksi
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail alasan transaksi, kondisi sparepart, atau lokasi unit..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !selectedSparepartId || !selectedPersonelId}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all disabled:opacity-50"
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
