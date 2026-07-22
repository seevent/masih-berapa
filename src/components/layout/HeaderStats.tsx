import React from 'react';
import { Menu, Database, ShieldAlert, Package, RefreshCw, AlertTriangle } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Link } from 'react-router-dom';

interface HeaderStatsProps {
  setMobileOpen: (open: boolean) => void;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({ setMobileOpen }) => {
  const { spareparts, isSupabaseConnected, getPredictiveAlerts, refreshData, isLoading } = useInventory();

  const totalSKU = spareparts.length;
  const criticalCount = getPredictiveAlerts().filter((a) => a.urgency === 'CRITICAL').length;
  const totalPhysicalStock = spareparts.reduce((acc, p) => acc + p.stok_aktual + p.stok_bekas, 0);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 border border-slate-700"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline-block">
            Sistem Inventaris Sparepart
          </span>
          <h2 className="text-base font-bold text-white leading-tight">
            SSES T2
          </h2>
        </div>
      </div>

      {/* Quick Metrics Header */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hidden lg:flex items-center gap-3 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-800">
          <Package className="w-4 h-4 text-cyan-400" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px]">TOTAL FISIK</span>
            <span className="font-bold text-white">{totalPhysicalStock.toLocaleString('id-ID')} Unit</span>
          </div>
        </div>

        {criticalCount > 0 && (
          <div className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 rounded-xl text-rose-300 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold">{criticalCount} SKU Kritis</span>
          </div>
        )}

        {/* Database Status Indicator (Full Supabase PostgreSQL) */}
        <Link
          to="/settings"
          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border transition-all ${
            isSupabaseConnected
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60'
              : 'bg-rose-950/60 border-rose-500/30 text-rose-300 hover:bg-rose-900/60 animate-pulse'
          }`}
          title={
            isSupabaseConnected
              ? 'Terhubung 100% ke Supabase PostgreSQL Database'
              : 'Supabase Belum Terhubung! Klik untuk mengkonfigurasi URL & Anon Key di Pengaturan'
          }
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium">
            {isSupabaseConnected ? 'Supabase Direct' : 'Supabase Disconnected'}
          </span>
        </Link>

        <button
          onClick={() => refreshData()}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 disabled:opacity-50"
          title="Refresh Data Supabase"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
