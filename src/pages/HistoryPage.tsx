import React, { useState } from 'react';
import {
  History,
  Download,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Trash2,
  Calendar,
  FileSpreadsheet,
  Pencil,
  AlertTriangle,
  X,
  Check,
  Handshake
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useInventory } from '../context/InventoryContext';
import { MutationType, StockMutation, SupplierType } from '../types';
import { describeFlow, flowToOptions, isIncompleteSerahTerima, resolveStockFlow } from '../utils/stock';
import {
  StockFlowFields,
  StockFlowFormState,
  initialStockFlowForm,
  isStockFlowFormComplete
} from '../components/mutation/StockFlowFields';
import { EquipmentUnitSelect } from '../components/mutation/EquipmentUnitSelect';
import { getCompatibleEquipment, requiresEquipmentUnit, usesEquipmentUnit } from '../utils/compatibility';

export const HistoryPage: React.FC = () => {
  const {
    mutations,
    spareparts,
    unitPeralatanList,
    tipePeralatan,
    penempatanList,
    lokasiList,
    titikLokasiList,
    personelList,
    sparepartCompatibility,
    updateMutation,
    deleteMutation
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Edit Modal State
  const [editingMutation, setEditingMutation] = useState<StockMutation | null>(null);
  const [editType, setEditType] = useState<MutationType>('Masuk');
  const [editFlow, setEditFlow] = useState<StockFlowFormState>(initialStockFlowForm);
  const [editSumber, setEditSumber] = useState<SupplierType>('VENDOR');
  const [editQty, setEditQty] = useState<number>(1);
  const [editPersonelId, setEditPersonelId] = useState<string>('');
  const [editUnitId, setEditUnitId] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const enrichedMutations = mutations.map((m) => {
    const sp = spareparts.find((s) => s.id === m.sparepart_id);
    const unit = unitPeralatanList.find((u) => u.id === m.unit_id);
    const persObj = personelList.find((p) => p.id === m.personel_id);

    // Determine Tipe Peralatan
    const tipeId = unit?.id_tipe || sp?.id_tipe;
    const tipeObj = tipePeralatan.find((t) => t.id === tipeId);
    const tipeName = tipeObj ? tipeObj.nama : sp?.equipment_type_name || '-';

    // Determine Lokasi & Titik
    let locationStr = '-';
    if (unit) {
      const pen = penempatanList.find((p) => p.id_unit === unit.id && p.is_active);
      if (pen) {
        const lok = lokasiList.find((l) => l.id === pen.id_lokasi);
        const titik = titikLokasiList.find((t) => t.id === pen.id_titik);
        locationStr = lok ? (titik ? `${lok.nama} (Titik ${titik.nomor})` : lok.nama) : '-';
      }
    } else if (m.location) {
      locationStr = m.location;
    } else if (sp?.lokasi) {
      locationStr = sp.lokasi;
    }

    const personelName = persObj ? persObj.nama : m.operator_name || 'Teknisi';
    const penerimaStr = [m.penerima, m.unit_penerima].filter(Boolean).join(' / ');
    const flowStr = describeFlow(m);

    return {
      ...m,
      tipeName,
      locationStr,
      personelName,
      penerimaStr,
      flowStr
    };
  });

  const filteredMutations = enrichedMutations.filter((m) => {
    const matchesSearch =
      (m.sparepart_sku?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (m.sparepart_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (m.personelName.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (m.tipeName.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (m.locationStr.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (m.sumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      m.penerimaStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !selectedType || m.mutation_type === selectedType;

    return matchesSearch && matchesType;
  });

  const handleExportExcel = () => {
    const exportData = filteredMutations.map((m) => ({
      Waktu: new Date(m.created_at).toLocaleString('id-ID'),
      SKU: m.sparepart_sku || '-',
      'Nama Sparepart': m.sparepart_name || '-',
      'Tipe Peralatan': m.tipeName,
      'Tipe Mutasi': m.mutation_type.toUpperCase(),
      'Sumber Barang': m.sumber || '-',
      Jumlah: m.qty,
      Personel: m.personelName,
      'Lokasi & Titik': m.locationStr,
      'Aliran Stok': m.flowStr,
      'Pihak Serah Terima': m.penerimaStr || '-',
      Catatan: m.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Mutasi');

    XLSX.writeFile(workbook, `Audit_Mutasi_Sparepart_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleOpenEdit = (m: StockMutation) => {
    setEditingMutation(m);
    setEditType(m.mutation_type);
    setEditFlow({ ...flowToOptions(m), pihak: m.penerima || '', unitPihak: m.unit_penerima || '' });
    setEditSumber(m.sumber || 'VENDOR');
    setEditQty(m.qty);
    setEditPersonelId(m.personel_id || '');
    setEditUnitId(m.unit_id || '');
    setEditNotes(m.notes || '');
  };

  const editPart = editingMutation ? spareparts.find((s) => s.id === editingMutation.sparepart_id) : undefined;
  const { availableUnits: editCompatibleUnits, otherUnits: editOtherUnits } = getCompatibleEquipment({
    part: editPart,
    sparepartCompatibility,
    lokasiList,
    titikLokasiList,
    unitPeralatanList,
    penempatanList,
    selectedLokasiId: '',
    selectedTitikId: ''
  });
  const editUnitMissing = requiresEquipmentUnit(editType) && !editUnitId;

  const handleSaveEdit = async () => {
    if (!editingMutation || !isStockFlowFormComplete(editType, editFlow) || editUnitMissing) return;
    setIsSubmitting(true);
    try {
      const success = await updateMutation(editingMutation.id, {
        mutation_type: editType,
        flow: resolveStockFlow(editType, editFlow),
        penerima: editFlow.pihak,
        unit_penerima: editFlow.unitPihak,
        sumber: editType === 'Masuk' ? editSumber : null,
        qty: editQty,
        personel_id: editPersonelId || null,
        // Types without a unit field keep whatever unit the row already had
        unit_id: usesEquipmentUnit(editType) ? editUnitId || null : editingMutation.unit_id || null,
        notes: editNotes || null
      });
      // Keep the modal open when the change was rejected so the user can correct it
      if (success) setEditingMutation(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsSubmitting(true);
    try {
      const success = await deleteMutation(deletingId);
      if (success) setDeletingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMutationBadge = (type: MutationType | string) => {
    switch (type) {
      case 'Masuk':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            MASUK
          </span>
        );
      case 'Pakai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <ArrowUpRight className="w-3.5 h-3.5" />
            PAKAI
          </span>
        );
      case 'Bekas':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <RotateCcw className="w-3.5 h-3.5" />
            BEKAS
          </span>
        );
      case 'Rusak':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Trash2 className="w-3.5 h-3.5" />
            RUSAK
          </span>
        );
      case 'Serah Terima':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-500/10 text-violet-300 border border-violet-500/30">
            <Handshake className="w-3.5 h-3.5" />
            SERAH TERIMA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-300 border border-slate-500/30 uppercase">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">History & Audit Logging</h1>
          <p className="text-sm text-slate-400 mt-1">
            Log lengkap riwayat mutasi barang masuk, pemakaian work order, pengembalian bekas, dan barang rusak dengan opsi edit & hapus.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ekspor Excel (.xlsx)</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari SKU, Nama Sparepart, Personel, Tipe Peralatan, atau Lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-semibold"
          >
            <option value="">Semua Tipe Transaksi</option>
            <option value="Masuk">Masuk (Penerimaan)</option>
            <option value="Pakai">Pakai (Pemakaian)</option>
            <option value="Bekas">Bekas (Pengembalian)</option>
            <option value="Rusak">Rusak (Afkir)</option>
            <option value="Serah Terima">Serah Terima</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Waktu Transaksi</th>
                <th className="py-3.5 px-4">Tipe Mutasi</th>
                <th className="py-3.5 px-4">SKU & Sparepart</th>
                <th className="py-3.5 px-4">Sumber</th>
                <th className="py-3.5 px-4">Tipe Peralatan</th>
                <th className="py-3.5 px-4 text-center">Jumlah (Qty)</th>
                <th className="py-3.5 px-4">Personel</th>
                <th className="py-3.5 px-4">Lokasi & Titik</th>
                <th className="py-3.5 px-4">Catatan</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Belum ada riwayat mutasi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredMutations.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getMutationBadge(m.mutation_type)}
                      <div
                        className={`text-[10px] mt-1 ${
                          isIncompleteSerahTerima(m) ? 'text-amber-400 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {m.flowStr}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-cyan-400 font-bold">{m.sparepart_sku}</div>
                      <div className="text-white font-medium text-xs">{m.sparepart_name}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {m.sumber ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {m.sumber}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300 whitespace-nowrap">
                      {m.tipeName}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-sm text-white">
                      {m.qty}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-medium">
                      {m.personelName}
                      {m.penerimaStr && (
                        <div className="text-[10px] text-slate-400">
                          {m.mutation_type === 'Serah Terima' && m.stok_tujuan ? 'Dari' : 'Kepada'}: {m.penerimaStr}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-cyan-300 font-medium whitespace-nowrap">
                      {m.locationStr}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {m.notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          title="Edit Transaksi"
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(m.id)}
                          title="Hapus Transaksi"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Transaksi Modal */}
      {editingMutation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Transaksi Mutasi</h3>
                <p className="text-xs text-cyan-400 font-mono font-semibold mt-0.5">
                  [{editingMutation.sparepart_sku}] {editingMutation.sparepart_name}
                </p>
              </div>
              <button
                onClick={() => setEditingMutation(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipe Mutasi</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as MutationType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                >
                  <option value="Masuk">Masuk (Penerimaan Stok Baru)</option>
                  <option value="Pakai">Pakai (Pemakaian Unit)</option>
                  <option value="Bekas">Bekas (Pengembalian Rotable)</option>
                  <option value="Rusak">Rusak (Pindah ke Stok Rusak)</option>
                  <option value="Serah Terima">Serah Terima (Serahkan / Terima)</option>
                </select>
              </div>

              <StockFlowFields
                mutationType={editType}
                value={editFlow}
                onChange={setEditFlow}
                part={editPart}
              />

              {usesEquipmentUnit(editType) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unit Peralatan{requiresEquipmentUnit(editType) && <span className="text-amber-400"> *</span>}
                  </label>
                  <EquipmentUnitSelect
                    value={editUnitId}
                    onChange={setEditUnitId}
                    compatibleUnits={editCompatibleUnits}
                    otherUnits={editOtherUnits}
                    tipePeralatan={tipePeralatan}
                    required={requiresEquipmentUnit(editType)}
                    className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs text-white ${
                      editUnitMissing ? 'border-amber-500/60' : 'border-slate-700'
                    }`}
                  />
                  {editUnitMissing && (
                    <p className="text-[10px] text-amber-400 mt-1">Pakai wajib memilih unit tempat sparepart dipasang.</p>
                  )}
                </div>
              )}

              {editType === 'Masuk' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sumber Asal Barang</label>
                  <select
                    value={editSumber}
                    onChange={(e) => setEditSumber(e.target.value as SupplierType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    <option value="SUP API">SUP API</option>
                    <option value="SISA PEKERJAAN">SISA PEKERJAAN</option>
                    <option value="IASS">IASS</option>
                    <option value="MANDIRI">MANDIRI</option>
                    <option value="DARI UNIT LAIN">DARI UNIT LAIN</option>
                    <option value="VENDOR">VENDOR</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Jumlah (Qty)</label>
                <input
                  type="number"
                  min={1}
                  value={editQty}
                  onChange={(e) => setEditQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Personel / Teknisi</label>
                <select
                  value={editPersonelId}
                  onChange={(e) => setEditPersonelId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                >
                  <option value="">-- Pilih Personel --</option>
                  {personelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.nik})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan transaksi..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingMutation(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSubmitting || !isStockFlowFormComplete(editType, editFlow) || editUnitMissing}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-600/25 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 rounded-2xl border border-rose-500/30 space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Konfirmasi Hapus Transaksi</h3>
              <p className="text-xs text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus data riwayat mutasi ini? Stok sparepart terkait akan dihitung ulang secara otomatis.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isSubmitting}
                className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/25"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
