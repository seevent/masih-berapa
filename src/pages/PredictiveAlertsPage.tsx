import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Clock, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const PredictiveAlertsPage: React.FC = () => {
  const { getPredictiveAlerts } = useInventory();
  const alerts = getPredictiveAlerts();

  const criticalAlerts = alerts.filter((a) => a.urgency === 'CRITICAL');
  const warningAlerts = alerts.filter((a) => a.urgency === 'WARNING');
  const normalAlerts = alerts.filter((a) => a.urgency === 'NORMAL');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Predictive Maintenance Alerts</h1>
        <p className="text-sm text-slate-400 mt-1">
          Kalkulasi sisa usia pakai sparepart berdasarkan data Mean Time Between Failures (MTBF) dan status stok gudang.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 uppercase">Gantian Kritis (&lt; 15 Hari)</span>
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white">{criticalAlerts.length}</span>
            <span className="text-xs text-rose-400 ml-2 font-medium">SKU Perlu Order Immediately</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase">Peringatan Usia (&lt; 45 Hari)</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white">{warningAlerts.length}</span>
            <span className="text-xs text-amber-400 ml-2 font-medium">SKU Perlu Persiapan Restock</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase">Status Aman MTBF</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white">{normalAlerts.length}</span>
            <span className="text-xs text-emerald-400 ml-2 font-medium">SKU Masih Terjaga</span>
          </div>
        </div>
      </div>

      {/* Main Alerts List */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Daftar Peringatan Usia Pakai (MTBF Ranking)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Status & Sisa Usia</th>
                <th className="py-3.5 px-4">SKU & Nama Sparepart</th>
                <th className="py-3.5 px-4">Peralatan Machine</th>
                <th className="py-3.5 px-4">Terakhir Diganti</th>
                <th className="py-3.5 px-4 text-center">Stok Gudang</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {alerts.map(({ sparepart: sp, days_used, remaining_days, urgency, is_stock_empty }) => (
                <tr key={sp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {urgency === 'CRITICAL' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {remaining_days} Hari Sisa (Kritis)
                      </span>
                    ) : urgency === 'WARNING' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {remaining_days} Hari Sisa (Warning)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        <Clock className="w-3.5 h-3.5" />
                        {remaining_days} Hari Sisa (Aman)
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono text-cyan-400 font-bold">{sp.sku}</div>
                    <div className="text-white font-medium">{sp.name}</div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {sp.equipment_type_name}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    <div>{sp.last_replaced_at || 'Terjadwal'}</div>
                    <div className="text-[10px] text-slate-500">Terpakai: {days_used} hari dari MTBF {sp.mtbf_days} hari</div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className={`font-bold ${is_stock_empty ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {sp.stok_aktual} {sp.unit}
                    </span>
                    <div className="text-[10px] text-amber-400">({sp.stok_bekas} bekas)</div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to="/input-sparepart"
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 font-semibold"
                    >
                      <span>Restock</span>
                    </Link>
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
