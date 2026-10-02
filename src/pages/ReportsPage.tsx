import React from 'react';
import { BarChart3, TrendingUp, RotateCcw, Zap, Boxes, ShieldCheck } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { DEMAND_WINDOW_MIN_DAYS, MOVEMENT_FAST_PER_MONTH, MovementClass } from '../utils/reliability';

const CATEGORY_STYLE: Record<MovementClass, { label: string; className: string }> = {
  FAST_MOVING: { label: 'Fast Moving', className: 'font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40' },
  MEDIUM_MOVING: { label: 'Medium Moving', className: 'font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30' },
  SLOW_MOVING: { label: 'Slow Moving', className: 'font-semibold bg-slate-800 text-slate-400 border border-slate-700' },
  BELUM_CUKUP_DATA: { label: 'Belum cukup data', className: 'font-semibold bg-slate-900 text-slate-500 border border-slate-800' }
};

const formatPerMonth = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 });

export const ReportsPage: React.FC = () => {
  const { spareparts, predictive } = useInventory();
  const movements = predictive.movements;

  const countOf = (c: MovementClass) => movements.filter((m) => m.category === c).length;
  const fastMovingCount = countOf('FAST_MOVING');
  const mediumMovingCount = countOf('MEDIUM_MOVING');
  const slowMovingCount = countOf('SLOW_MOVING');
  // Slow movers that still hold stock are the ones that pile up in the warehouse
  const slowWithStockCount = movements.filter(
    (m) => m.category === 'SLOW_MOVING' && m.sparepart.stok_aktual + m.sparepart.stok_bekas > 0
  ).length;
  const totalRotableUnits = spareparts.reduce((sum, sp) => sum + sp.stok_bekas, 0);
  const grandTotalPhysicalUnits = spareparts.reduce((sum, sp) => sum + sp.stok_aktual + sp.stok_bekas, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Laporan Analisis Rotasi & Kuantitas Stok</h1>
        <p className="text-sm text-slate-400 mt-1">
          Evaluasi perputaran barang (Fast/Medium/Slow Moving) dari pemakaian riil dan distribusi kuantitas unit stok fisik di gudang.
        </p>
      </div>

      <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-xs text-cyan-200">
        <span className="font-bold">Cara klasifikasi:</span> dihitung dari jumlah barang pada transaksi <b>Pakai</b> dalam 12 bulan terakhir
        (atau sejak transaksi pertama bila lebih singkat, minimal 30 hari). <b>Fast</b>: rata-rata ≥ {MOVEMENT_FAST_PER_MONTH} per bulan.
        {' '}<b>Medium</b>: ada pemakaian, kurang dari itu. <b>Slow</b>: tidak ada pemakaian sama sekali.
        {' '}<b>Belum cukup data</b>: belum ada pemakaian dan sparepart baru tercatat kurang dari {DEMAND_WINDOW_MIN_DAYS} hari.
        Masuk, Bekas, Rusak, dan Serah Terima bukan pemakaian.
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">FAST MOVING ITEMS</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white">{fastMovingCount}</span>
            <span className="text-xs text-slate-400 ml-2">SKU pemakaian ≥ {MOVEMENT_FAST_PER_MONTH} / bulan</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {mediumMovingCount} medium · {slowMovingCount} slow
            {slowWithStockCount > 0 && ` (${slowWithStockCount} slow masih menyimpan stok)`}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">STOK ROTABLE BEKAS</span>
            <RotateCcw className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-emerald-400">
              {totalRotableUnits} <span className="text-xs text-slate-400 font-normal">Unit</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Kuantitas barang bekas layak pakai (Rotable Recovery)</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">TOTAL STOK FISIK</span>
            <Boxes className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white">
              {grandTotalPhysicalUnits} <span className="text-xs text-slate-400 font-normal">Unit</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Total fisik unit baru + bekas di gudang</p>
        </div>
      </div>

      {/* Categorized Inventory Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Evaluasi Perputaran & Rotasi Kuantitas Fisik</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Klasifikasi Movement</th>
                <th className="py-3.5 px-4">SKU & Sparepart</th>
                <th className="py-3.5 px-4 text-center">Pemakaian (Pakai)</th>
                <th className="py-3.5 px-4 text-center">Stok Baru</th>
                <th className="py-3.5 px-4 text-center">Stok Bekas (Rotable)</th>
                <th className="py-3.5 px-4 text-right">Total Unit Fisik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {movements.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Belum ada sparepart terdaftar.
                  </td>
                </tr>
              )}
              {movements.map(({ sparepart: sp, demand, category, per_month }) => (
                <tr key={sp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg ${CATEGORY_STYLE[category].className}`}>
                      {CATEGORY_STYLE[category].label}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono text-cyan-400 font-bold">{sp.sku}</div>
                    <div className="text-white font-medium">{sp.name}</div>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="font-bold text-slate-200">
                      {demand.usage_qty} {sp.unit} / {Math.round(demand.window_days)} hari
                    </div>
                    <div className="text-[10px] text-slate-500">rata-rata {formatPerMonth(per_month)} per bulan</div>
                  </td>

                  <td className="py-3.5 px-4 text-center text-emerald-400 font-semibold">
                    {sp.stok_aktual} {sp.unit}
                  </td>

                  <td className="py-3.5 px-4 text-center text-amber-400 font-semibold">
                    {sp.stok_bekas} {sp.unit}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                    {sp.stok_aktual + sp.stok_bekas} {sp.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
