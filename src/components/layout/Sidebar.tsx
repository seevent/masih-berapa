import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  History,
  QrCode,
  Printer,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const navItems = [
    { to: '/', label: 'Dashboard Manajemen', icon: LayoutDashboard },
    { to: '/catalog', label: 'Katalog Sparepart', icon: Boxes },
    { to: '/input-sparepart', label: 'Input Transaksi', icon: ArrowLeftRight },
    { to: '/history', label: 'History & Audit', icon: History },
    { to: '/scanner', label: 'Mobile QR Scanner', icon: QrCode },
    { to: '/print', label: 'Cetak Label Thermal', icon: Printer },
    { to: '/alerts', label: 'Predictive Alerts', icon: AlertTriangle },
    { to: '/needs', label: 'Perencanaan Kebutuhan', icon: TrendingUp },
    { to: '/reports', label: 'Analisis Rotasi Stok', icon: BarChart3 },
    { to: '/settings', label: 'Pengaturan Sistem', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-tight">
                Masih Berapa
              </h1>
              <p className="text-[11px] font-medium text-cyan-400 tracking-wider">SSES T2 SPAREPART</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 m-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Versi App</span>
            <span className="font-mono text-cyan-400 font-semibold">v1.0.0</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Ready for Desktop & Mobile PWA</p>
        </div>
      </aside>
    </>
  );
};
