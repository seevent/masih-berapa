import React from 'react';
import { TrendingUp, FileSpreadsheet, Calculator, Package, ShieldAlert } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useInventory } from '../context/InventoryContext';

export const PredictiveNeedsPage: React.FC = () => {
  const { getAnnualNeeds } = useInventory();
  const needs = getAnnualNeeds();

  const totalOrderUnits = needs.reduce((sum, n) => sum + n.order_needed_qty, 0);
  const itemsNeedingOrderCount = needs.filter((n) => n.order_needed_qty > 0).length;

  const handleExportNeedsExcel = () => {
    const exportData = needs.map((n) => ({
      SKU: n.sparepart.sku,
      'Nama Sparepart': n.sparepart.name,
      Peralatan: n.sparepart.equipment_type_name,
      'Stok Baru (Unit)': n.sparepart.stok_aktual,
      'Stok Bekas (Unit)': n.sparepart.stok_bekas,
      'Total Stok Fisik Ada': n.total_available_stock,
      'Estimasi Kebutuhan Tahunan (Unit)': n.annual_forecast_qty,
      'Kuantitas Rekomendasi Order (Unit)': n.order_needed_qty,
      'Status Defisit': n.order_needed_qty > 0 ? 'PERLU PASOKAN' : 'STOK CUKUP'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Perencanaan Kebutuhan');

    XLSX.writeFile(workbook, `Perencanaan_Kebutuhan_Sparepart_${new Date().getFullYear()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Perencanaan Kebutuhan (Demand Forecast)</h1>
          <p className="text-sm text-slate-400 mt-1">
            Modul estimasi kebutuhan kuantitas suku cadang tahunan berdasarkan MTBF, stok fisik, dan perputaran unit.
          </p>
        </div>

        <button
          onClick={handleExportNeedsExcel}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ekspor Perencanaan Excel (.xlsx)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">TOTAL REKOMENDASI ORDER</span>
            <div className="text-3xl font-bold text-white mt-1">
              {totalOrderUnits.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">Unit</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">SKU MEMBUTUHKAN PASOKAN</span>
            <div className="text-3xl font-bold text-amber-400 mt-1">
              {itemsNeedingOrderCount} <span className="text-xs text-slate-400 font-normal">SKU Defisit</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Formula Explanation Banner */}
      <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-xs text-cyan-200 flex items-center gap-3">
        <Calculator className="w-5 h-5 text-cyan-400 shrink-0" />
        <div>
          <span className="font-bold">Formula Perhitungan Otomatis:</span> Kuantitas Rekomendasi Order = Estimasi Kebutuhan Tahunan - (Stok Baru + Stok Bekas Layak Pakai).
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">SKU & Sparepart</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Peralatan</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Stok Ada (Baru/Bekas)</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Kebutuhan Tahunan</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Rekomendasi Order</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Status Defisit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {needs.map(({ sparepart: sp, total_available_stock, annual_forecast_qty, order_needed_qty }) => (
                <tr key={sp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-cyan-400 font-bold">{sp.sku}</div>
                    <div className="text-white font-medium">{sp.name}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {sp.equipment_type_name}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="font-bold text-white">{total_available_stock} {sp.unit}</span>
                    <div className="text-[10px] text-slate-400">({sp.stok_aktual} baru / {sp.stok_bekas} bekas)</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-300 whitespace-nowrap">
                    {annual_forecast_qty} {sp.unit}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs inline-block ${
                        order_needed_qty > 0
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {order_needed_qty} {sp.unit}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {order_needed_qty > 0 ? (
                      <span className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold inline-flex items-center justify-center whitespace-nowrap shadow-sm">
                        PERLU PASOKAN
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold inline-flex items-center justify-center whitespace-nowrap shadow-sm">
                        STOK CUKUP
                      </span>
                    )}
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
