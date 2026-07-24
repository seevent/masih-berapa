import React from 'react';
import {
  Boxes,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  Layers,
  Sparkles,
  PackageCheck
} from 'lucide-react';
import { ReorderPriorityItemPhysical } from '../../lib/sparepartAnalytics';

interface SparepartMetricsCardsProps {
  totalSKU: number;
  totalNewStock: number;
  totalUsedStock: number;
  reorderItems: ReorderPriorityItemPhysical[];
  avgTurnoverRatio: number;
}

export const SparepartMetricsCards: React.FC<SparepartMetricsCardsProps> = ({
  totalSKU,
  totalNewStock,
  totalUsedStock,
  reorderItems,
  avgTurnoverRatio
}) => {
  const criticalCount = reorderItems.filter((i) => i.urgency === 'CRITICAL').length;
  const warningCount = reorderItems.filter((i) => i.urgency === 'WARNING').length;
  const totalPhysicalStock = totalNewStock + totalUsedStock;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Physical Stock */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-blue-950/40 p-5 border border-blue-500/20 shadow-xl hover:border-blue-500/40 transition-all duration-300 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Boxes className="w-24 h-24 text-blue-400" />
        </div>
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Boxes className="w-6 h-6" />
          </div>
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {totalSKU} Active SKU
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Unit Fisik Inventaris
          </p>
          <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
            {totalPhysicalStock.toLocaleString('id-ID')}{' '}
            <span className="text-sm font-medium text-slate-400">Unit</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 flex items-center">
            <Sparkles className="w-3 h-3 text-blue-400 mr-1" />
            Total kuantitas barang fisik di gudang
          </p>
        </div>
      </div>

      {/* 2. Break Down Stok Baru vs Bekas */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-emerald-950/40 p-5 border border-emerald-500/20 shadow-xl hover:border-emerald-500/40 transition-all duration-300 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <PackageCheck className="w-24 h-24 text-emerald-400" />
        </div>
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <PackageCheck className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Stok Siap Pakai
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Distribusi Kondisi Fisik
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-extrabold text-emerald-400 tracking-tight">
              {totalNewStock}{' '}
              <span className="text-xs font-semibold text-slate-400">Baru</span>
            </h3>
            <span className="text-slate-500 font-bold">/</span>
            <h3 className="text-2xl font-extrabold text-amber-400 tracking-tight">
              {totalUsedStock}{' '}
              <span className="text-xs font-semibold text-slate-400">Bekas</span>
            </h3>
          </div>

          {/* Option B: Visual Dual-Bar Progress Indicator */}
          <div className="mt-2.5 w-full bg-slate-950 rounded-full h-2 overflow-hidden flex border border-slate-800/80">
            <div
              style={{ width: `${totalPhysicalStock > 0 ? Math.round((totalNewStock / totalPhysicalStock) * 100) : 50}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Stok Baru: ${totalNewStock}`}
            />
            <div
              style={{ width: `${totalPhysicalStock > 0 ? Math.round((totalUsedStock / totalPhysicalStock) * 100) : 50}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`Stok Bekas: ${totalUsedStock}`}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
            <span>Baru ({totalPhysicalStock > 0 ? Math.round((totalNewStock / totalPhysicalStock) * 100) : 0}%)</span>
            <span>Bekas ({totalPhysicalStock > 0 ? Math.round((totalUsedStock / totalPhysicalStock) * 100) : 0}%)</span>
          </p>
        </div>
      </div>

      {/* 3. Reorder Point & Safety Stock Alerts */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-rose-950/40 p-5 border border-rose-500/20 shadow-xl hover:border-rose-500/40 transition-all duration-300 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <AlertTriangle className="w-24 h-24 text-rose-400" />
        </div>
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          {criticalCount > 0 ? (
            <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
              {criticalCount} Kritis !
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Stok Aman
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Alert Minimum & Safety Stock
          </p>
          <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
            {criticalCount + warningCount}{' '}
            <span className="text-sm font-medium text-slate-400">SKU Perlu Order</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {criticalCount} di bawah minimum, {warningCount} menyentuh safety buffer.
          </p>
        </div>
      </div>

      {/* 4. Rata-rata Turnover / Rotasi Fisik */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-cyan-950/40 p-5 border border-cyan-500/20 shadow-xl hover:border-cyan-500/40 transition-all duration-300 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <RefreshCw className="w-24 h-24 text-cyan-400" />
        </div>
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Rotasi Optimum
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tingkat Rotasi Fisik
          </p>
          <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
            {avgTurnoverRatio}x <span className="text-sm font-medium text-slate-400">/ Tahun</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Frekuensi pemakaian & perputaran fisik unit di gudang.
          </p>
        </div>
      </div>
    </div>
  );
};
