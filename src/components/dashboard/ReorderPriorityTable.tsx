import React, { useState } from 'react';
import { ReorderPriorityItemPhysical } from '../../lib/sparepartAnalytics';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Search,
  ShoppingCart,
  Clock,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReorderPriorityTableProps {
  reorderItems: ReorderPriorityItemPhysical[];
}

export const ReorderPriorityTable: React.FC<ReorderPriorityTableProps> = ({ reorderItems }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');

  const filteredItems = reorderItems.filter((item) => {
    const matchQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchUrgency =
      urgencyFilter === 'ALL' ? item.urgency !== 'HEALTHY' : item.urgency === urgencyFilter;

    return matchQuery && matchUrgency;
  });

  const totalSuggestedUnits = filteredItems.reduce((sum, item) => sum + item.suggestedReorderQty, 0);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
      {/* Header & Priority Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Prioritas Pengadaan Kuantitas Fisik (Reorder Safety Stock)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar otomatis sparepart yang menyentuh batas Minimum Stock / Safety Stock.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Total Kuantitas Reorder
            </span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">
              {totalSuggestedUnits} Unit
            </span>
          </div>

          <Link
            to="/input-sparepart"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buat Input Transaksi</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SKU, Nama Sparepart, Kategori..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setUrgencyFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              urgencyFilter === 'ALL'
                ? 'bg-slate-800 text-white border-slate-600'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Semua Peringatan ({reorderItems.filter((i) => i.urgency !== 'HEALTHY').length})
          </button>
          <button
            onClick={() => setUrgencyFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              urgencyFilter === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-rose-400'
            }`}
          >
            Kritis ({reorderItems.filter((i) => i.urgency === 'CRITICAL').length})
          </button>
          <button
            onClick={() => setUrgencyFilter('WARNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              urgencyFilter === 'WARNING'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-amber-400'
            }`}
          >
            Waspada ({reorderItems.filter((i) => i.urgency === 'WARNING').length})
          </button>
        </div>
      </div>

      {/* Reorder Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs text-left text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Status & Urgency</th>
              <th className="px-4 py-3">SKU & Sparepart Name</th>
              <th className="px-4 py-3 text-center">Stok Aktual vs Min/Safety</th>
              <th className="px-4 py-3 text-center">Rekomendasi Reorder</th>
              <th className="px-4 py-3 text-center">Lead Time Supplier</th>
              <th className="px-4 py-3 text-center">Lokasi Rak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/40">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-300">Tidak ada item yang membutuhkan reorder darurat!</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Semua stok sparepart berada di atas batas safety stock minimum.
                  </p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Status Badge */}
                  <td className="px-4 py-3">
                    {item.urgency === 'CRITICAL' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> CRITICAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold">
                        <Clock className="w-3.5 h-3.5" /> REORDER WARNING
                      </span>
                    )}
                  </td>

                  {/* SKU & Name */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono text-blue-400">{item.sku}</span>
                      <span>•</span>
                      <span>{item.categoryName}</span>
                    </div>
                  </td>

                  {/* Stock Levels */}
                  <td className="px-4 py-3 text-center">
                    <div className="font-extrabold text-white">
                      <span className={item.stokAktual <= item.minimumStok ? 'text-rose-400' : 'text-amber-400'}>
                        {item.stokAktual}
                      </span>{' '}
                      <span className="text-slate-500 font-normal">/ Min: {item.minimumStok}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Safety Buffer: {item.safetyStok}
                    </div>
                  </td>

                  {/* Reorder Qty */}
                  <td className="px-4 py-3 text-center font-bold text-emerald-400 font-mono">
                    +{item.suggestedReorderQty} Unit
                  </td>

                  {/* Supplier & Lead Time */}
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium inline-block">
                      {item.supplierType} ({item.estimatedLeadTimeDays} Hari)
                    </span>
                  </td>

                  {/* Location Rack */}
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-slate-300 font-mono text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400" /> {item.locationRack}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
