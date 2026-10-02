import React from 'react';
import { TrendingUp, FileSpreadsheet, Calculator, Package, ShieldAlert } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useInventory } from '../context/InventoryContext';

export const PredictiveNeedsPage: React.FC = () => {
  const { predictive } = useInventory();
  const needs = predictive.annualNeeds;

  // Spareparts use different units (PCS, UNIT, ...): total per unit instead of one mixed sum
  const orderTotalsByUnit = new Map<string, number>();
  needs.forEach((n) => {
    if (n.order_needed_qty <= 0) return;
    const unit = n.sparepart.unit || 'PCS';
    orderTotalsByUnit.set(unit, (orderTotalsByUnit.get(unit) || 0) + n.order_needed_qty);
  });
  const orderTotals = Array.from(orderTotalsByUnit.entries());
  const itemsNeedingOrderCount = needs.filter((n) => n.order_needed_qty > 0).length;

  const handleExportNeedsExcel = () => {
    const exportData = needs.map((n) => ({
      SKU: n.sparepart.sku,
      'Nama Sparepart': n.sparepart.name,
      Peralatan: n.sparepart.equipment_type_name,
      'Stok Baru (Unit)': n.stok_baru,
      'Stok Bekas (Unit)': n.sparepart.stok_bekas,
      'Total Pakai dalam Jendela (Unit)': n.demand.usage_qty,
      'Jendela Pengamatan (Hari)': Math.round(n.demand.window_days),
      'Estimasi Kebutuhan Tahunan (Unit)': n.annual_forecast_qty ?? 'Belum cukup data',
      'Kuantitas Rekomendasi Order (Unit)': n.order_needed_qty,
      'Status Defisit':
        n.annual_forecast_qty === null ? 'BELUM CUKUP DATA' : n.order_needed_qty > 0 ? 'PERLU PASOKAN' : 'STOK CUKUP'
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
            Estimasi kebutuhan sparepart setahun dari pemakaian riil (transaksi Pakai) dan stok baru di gudang.
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
              {orderTotals.length === 0 ? (
                <>0 <span className="text-xs text-slate-400 font-normal">Unit</span></>
              ) : (
                orderTotals.map(([unit, qty], idx) => (
                  <span key={unit}>
                    {idx > 0 && <span className="text-slate-600 font-normal"> + </span>}
                    {qty.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">{unit}</span>
                  </span>
                ))
              )}
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
          <span className="font-bold">Formula Perhitungan Otomatis:</span> Kebutuhan Tahunan = kebutuhan per hari × 365 (dibulatkan ke atas),
          {' '}dengan kebutuhan per hari = total Pakai dalam jendela pengamatan ÷ panjang jendela (hari sejak transaksi pertama, 30–365 hari).
          {' '}Rekomendasi Order = Kebutuhan Tahunan − Stok Baru (Pakai hanya mengambil stok baru).
          {' '}Sparepart tanpa transaksi Pakai berstatus &quot;belum cukup data&quot;.
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
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Stok Baru</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Kebutuhan Tahunan</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Rekomendasi Order</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Status Defisit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {needs.map(({ sparepart: sp, stok_baru, demand, annual_forecast_qty, order_needed_qty }) => (
                <tr key={sp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-cyan-400 font-bold">{sp.sku}</div>
                    <div className="text-white font-medium">{sp.name}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {sp.equipment_type_name}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="font-bold text-white">{stok_baru} {sp.unit}</span>
                    <div className="text-[10px] text-slate-400">(bekas {sp.stok_bekas}, tidak dihitung)</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-300 whitespace-nowrap">
                    {annual_forecast_qty === null ? (
                      <span className="text-slate-500 font-normal">Belum cukup data</span>
                    ) : (
                      <>
                        {annual_forecast_qty} {sp.unit}
                        <div className="text-[10px] font-normal text-slate-500">
                          dari {demand.usage_qty} Pakai / {Math.round(demand.window_days)} hari
                        </div>
                      </>
                    )}
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
                    {annual_forecast_qty === null ? (
                      <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-semibold inline-flex items-center justify-center whitespace-nowrap">
                        BELUM CUKUP DATA
                      </span>
                    ) : order_needed_qty > 0 ? (
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
