import React from 'react';
import { BarChart3, TrendingUp, RotateCcw, Zap, Boxes, ShieldCheck } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const ReportsPage: React.FC = () => {
  const { spareparts, mutations } = useInventory();

  // Calculate Fast Moving vs Slow Moving based on mutation frequency
  const mutationCountMap: Record<string, number> = {};
  mutations.forEach((m) => {
    mutationCountMap[m.sparepart_id] = (mutationCountMap[m.sparepart_id] || 0) + 1;
  });

  const categorizedParts = spareparts.map((sp) => {
    const freq = mutationCountMap[sp.id] || 0;
    const category = freq >= 2 ? 'FAST_MOVING' : freq === 1 ? 'MEDIUM_MOVING' : 'SLOW_MOVING';
    const totalPhysical = sp.stok_aktual + sp.stok_bekas;

    return {
      sparepart: sp,
      frequency: freq,
      category,
      totalPhysical
    };
  });

  const fastMovingCount = categorizedParts.filter((p) => p.category === 'FAST_MOVING').length;
  const slowMovingCount = categorizedParts.filter((p) => p.category === 'SLOW_MOVING').length;
  const totalRotableUnits = spareparts.reduce((sum, sp) => sum + sp.stok_bekas, 0);
  const grandTotalPhysicalUnits = spareparts.reduce((sum, sp) => sum + sp.stok_aktual + sp.stok_bekas, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Laporan Analisis Rotasi & Kuantitas Stok</h1>
        <p className="text-sm text-slate-400 mt-1">
          Evaluasi perputaran barang (Fast/Medium/Slow Moving) dan distribusi kuantitas unit stok fisik di gudang.
        </p>
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
            <span className="text-xs text-slate-400 ml-2">SKU Tinggi Mutasi</span>
          </div>
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
                <th className="py-3.5 px-4 text-center">Frekuensi Mutasi</th>
                <th className="py-3.5 px-4 text-center">Stok Baru</th>
                <th className="py-3.5 px-4 text-center">Stok Bekas (Rotable)</th>
                <th className="py-3.5 px-4 text-right">Total Unit Fisik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {categorizedParts.map(({ sparepart: sp, frequency, category, totalPhysical }) => (
                <tr key={sp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {category === 'FAST_MOVING' ? (
                      <span className="px-2.5 py-1 rounded-lg font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Fast Moving
                      </span>
                    ) : category === 'MEDIUM_MOVING' ? (
                      <span className="px-2.5 py-1 rounded-lg font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        Medium Moving
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Slow Moving
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono text-cyan-400 font-bold">{sp.sku}</div>
                    <div className="text-white font-medium">{sp.name}</div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                    {frequency} Transaksi
                  </td>

                  <td className="py-3.5 px-4 text-center text-emerald-400 font-semibold">
                    {sp.stok_aktual} {sp.unit}
                  </td>

                  <td className="py-3.5 px-4 text-center text-amber-400 font-semibold">
                    {sp.stok_bekas} {sp.unit}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                    {totalPhysical} {sp.unit}
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
