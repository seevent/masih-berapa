import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ABCPhysicalBreakdown } from '../../lib/sparepartAnalytics';
import { Layers, Zap, Clock, ShieldAlert } from 'lucide-react';

interface ABCAnalysisChartProps {
  abcData: ABCPhysicalBreakdown;
}

export const ABCAnalysisChart: React.FC<ABCAnalysisChartProps> = ({ abcData }) => {
  const chartData = [
    {
      name: 'Class A (Fast Moving)',
      value: abcData.classA.totalVolume,
      count: abcData.classA.count,
      pct: abcData.classA.percentage,
      color: '#3b82f6' // Blue
    },
    {
      name: 'Class B (Medium Moving)',
      value: abcData.classB.totalVolume,
      count: abcData.classB.count,
      pct: abcData.classB.percentage,
      color: '#10b981' // Emerald
    },
    {
      name: 'Class C (Slow / Dead Stock)',
      value: abcData.classC.totalVolume,
      count: abcData.classC.count,
      pct: abcData.classC.percentage,
      color: '#f59e0b' // Amber
    }
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Sparepart (Frekuensi Pemakaian Fisik)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pengelompokan pergerakan barang berdasarkan volume unit terpakai & kecepatan rotasi.
          </p>
        </div>

        <span className="self-start sm:self-auto text-[11px] font-semibold px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
          Pareto Volume 80/15/5
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
        {/* Donut Chart */}
        <div className="xl:col-span-5 h-60 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                        <p className="font-bold text-white">{data.name}</p>
                        <p className="text-slate-300">
                          Volume Pemakaian: <span className="text-emerald-400 font-semibold">{data.value} Unit</span>
                        </p>
                        <p className="text-slate-300">
                          Jumlah Item: <span className="text-blue-400 font-semibold">{data.count} SKU</span> ({data.pct}% volume)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-white">ABC</span>
            <span className="text-[9px] font-semibold uppercase text-slate-400 tracking-wider">
              Volume Fisik
            </span>
          </div>
        </div>

        {/* Class Breakdown Cards */}
        <div className="xl:col-span-7 space-y-3">
          {/* Class A Card */}
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 hover:bg-blue-950/30 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-10 rounded-full bg-blue-500 shrink-0 mt-0.5"></div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-white">Class A (Fast Moving)</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold whitespace-nowrap">
                      80% Volume
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {abcData.classA.count} SKU Sering Terpakai
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black text-blue-400 block font-mono">
                  {abcData.classA.totalVolume} Unit
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {abcData.classA.percentage}% total
                </span>
              </div>
            </div>
          </div>

          {/* Class B Card */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 hover:bg-emerald-950/30 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-10 rounded-full bg-emerald-500 shrink-0 mt-0.5"></div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-white">Class B (Medium Moving)</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold whitespace-nowrap">
                      15% Volume
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {abcData.classB.count} SKU Rotasi Sedang
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black text-emerald-400 block font-mono">
                  {abcData.classB.totalVolume} Unit
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {abcData.classB.percentage}% total
                </span>
              </div>
            </div>
          </div>

          {/* Class C Card */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 hover:bg-amber-950/30 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-10 rounded-full bg-amber-500 shrink-0 mt-0.5"></div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-white">Class C (Slow Moving)</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold whitespace-nowrap">
                      5% Volume
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {abcData.classC.count} SKU Cadangan Buffer
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black text-amber-400 block font-mono">
                  {abcData.classC.totalVolume} Unit
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {abcData.classC.percentage}% total
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
