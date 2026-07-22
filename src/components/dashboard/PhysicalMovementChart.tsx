import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { MonthlyPhysicalTrend, CategoryPhysicalBreakdown } from '../../lib/sparepartAnalytics';
import { BarChart3 } from 'lucide-react';

interface PhysicalMovementChartProps {
  physicalTrend: MonthlyPhysicalTrend[];
  categoryBreakdown: CategoryPhysicalBreakdown[];
}

export const PhysicalMovementChart: React.FC<PhysicalMovementChartProps> = ({
  physicalTrend,
  categoryBreakdown
}) => {
  const [activeTab, setActiveTab] = useState<'movement' | 'category'>('movement');

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Tren Pergerakan & Distribusi Fisik Unit
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualisasi kuantitas barang Masuk vs Pakai dan rotasi stok fisik.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('movement')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'movement'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Masuk vs Pakai (Unit)
          </button>
          <button
            onClick={() => setActiveTab('category')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'category'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Stok Per Kategori
          </button>
        </div>
      </div>

      {/* Chart View */}
      {activeTab === 'movement' ? (
        <div className="space-y-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={physicalTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
                          <p className="font-bold text-white border-b border-slate-800 pb-1">{label}</p>
                          <p className="text-emerald-400 flex items-center justify-between gap-4">
                            <span>Barang Masuk:</span>
                            <span className="font-semibold">{payload[0]?.value} Unit</span>
                          </p>
                          <p className="text-rose-400 flex items-center justify-between gap-4">
                            <span>Barang Dipakai:</span>
                            <span className="font-semibold">{payload[1]?.value} Unit</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                <Bar dataKey="inflowUnit" name="Barang Masuk (Unit)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflowUnit" name="Barang Dipakai (Unit)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Rata-rata Masuk Bulanan:</span>
              <span className="font-bold text-emerald-400">55 Unit</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Rata-rata Pakai Bulanan:</span>
              <span className="font-bold text-rose-400">49 Unit</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Net Unit Change:</span>
              <span className="font-bold text-cyan-400">+ 6 Unit / bln</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="categoryName" type="category" stroke="#64748b" tick={{ fontSize: 11 }} width={120} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as CategoryPhysicalBreakdown;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.categoryName}</p>
                          <p className="text-emerald-400">Total Stok Fisik: {data.totalPhysicalStock} Unit</p>
                          <p className="text-slate-300">Stok Baru: {data.totalNewStock} Unit</p>
                          <p className="text-amber-400">Stok Bekas: {data.totalUsedStock} Unit</p>
                          <p className="text-cyan-400">Tingkat Rotasi: {data.rotationRatio}x / tahun</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalPhysicalStock" name="Total Unit Fisik" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-2">Kategori Peralatan</th>
                  <th className="px-4 py-2">Jumlah SKU</th>
                  <th className="px-4 py-2">Stok Baru (Unit)</th>
                  <th className="px-4 py-2">Stok Bekas (Unit)</th>
                  <th className="px-4 py-2 text-right">Total Unit Fisik</th>
                  <th className="px-4 py-2 text-center">Tingkat Rotasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {categoryBreakdown.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-white">{cat.categoryName}</td>
                    <td className="px-4 py-2.5">{cat.itemCount} SKU</td>
                    <td className="px-4 py-2.5 text-emerald-400">{cat.totalNewStock} Unit</td>
                    <td className="px-4 py-2.5 text-amber-400">{cat.totalUsedStock} Unit</td>
                    <td className="px-4 py-2.5 text-right font-extrabold text-blue-400 font-mono">
                      {cat.totalPhysicalStock} Unit
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold font-mono">
                        {cat.rotationRatio}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
