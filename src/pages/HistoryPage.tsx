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
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useInventory } from '../context/InventoryContext';
import { MutationType } from '../types';

export const HistoryPage: React.FC = () => {
  const {
    mutations,
    spareparts,
    unitPeralatanList,
    tipePeralatan,
    penempatanList,
    lokasiList,
    titikLokasiList
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  const enrichedMutations = mutations.map((m) => {
    const sp = spareparts.find((s) => s.id === m.sparepart_id);
    const unit = unitPeralatanList.find((u) => u.id === m.unit_id);

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
    } else if (sp?.location || sp?.lokasi) {
      locationStr = sp.location || sp.lokasi || '-';
    }

    return {
      ...m,
      tipeName,
      locationStr,
      personelName: m.operator_name
    };
  });

  const filteredMutations = enrichedMutations.filter((m) => {
    const matchesSearch =
      (m.sparepart_sku?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (m.sparepart_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (m.personelName.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (m.tipeName.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (m.locationStr.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesType = !selectedType || m.mutation_type === selectedType;

    return matchesSearch && matchesType;
  });

  const handleExportExcel = () => {
    const exportData = filteredMutations.map((m) => ({
      Waktu: new Date(m.created_at).toLocaleString('id-ID'),
      SKU: m.sparepart_sku || '-',
      'Nama Sparepart': m.sparepart_name || '-',
      'Tipe Peralatan': m.tipeName,
      'Tipe Mutasi': m.mutation_type === 'Masuk' ? 'MASUK' : m.mutation_type === 'Pakai' ? 'PAKAI' : m.mutation_type === 'Bekas' ? 'BEKAS' : 'RUSAK',
      Jumlah: m.qty,
      Personel: m.personelName,
      'Lokasi & Titik': m.locationStr,
      Catatan: m.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Mutasi');

    XLSX.writeFile(workbook, `Audit_Mutasi_Sparepart_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getMutationBadge = (type: MutationType) => {
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">History & Audit Logging</h1>
          <p className="text-sm text-slate-400 mt-1">
            Log lengkap riwayat mutasi barang masuk, pemakaian work order, pengembalian bekas, dan barang rusak.
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
                <th className="py-3.5 px-4">Tipe Peralatan</th>
                <th className="py-3.5 px-4 text-center">Jumlah (Qty)</th>
                <th className="py-3.5 px-4">Personel</th>
                <th className="py-3.5 px-4">Lokasi & Titik</th>
                <th className="py-3.5 px-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
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
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-cyan-400 font-bold">{m.sparepart_sku}</div>
                      <div className="text-white font-medium text-xs">{m.sparepart_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300 whitespace-nowrap">
                      {m.tipeName}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-sm text-white">
                      {m.qty}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-medium">
                      {m.personelName}
                    </td>
                    <td className="py-3.5 px-4 text-cyan-300 font-medium whitespace-nowrap">
                      {m.locationStr}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {m.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
