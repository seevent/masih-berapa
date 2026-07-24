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
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  setMobileOpen,
  isCollapsed,
  setIsCollapsed
}) => {
  const navItems = [
    { to: '/', label: 'Dashboard Manajemen', icon: LayoutDashboard },
    { to: '/catalog', label: 'Katalog Sparepart', icon: Boxes },
    { to: '/input-sparepart', label: 'Input Transaksi', icon: ArrowLeftRight },
    { to: '/history', label: 'History & Audit', icon: History },
    { to: '/scanner', label: 'Mobile QR Scanner', icon: QrCode },
    { to: '/print', label: 'Cetak Label', icon: Printer },
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
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-all duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full'
        } ${isCollapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        {/* Brand Header */}
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between min-h-[64px]">
          {!isCollapsed ? (
            /* Expanded Header (Desktop) */
            <div className="hidden md:flex items-center justify-between w-full">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30 shrink-0">
                  <Boxes className="w-6 h-6 text-white" />
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-base font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-tight whitespace-nowrap">
                    Masih Berapa
                  </h1>
                  <p className="text-[10px] font-semibold text-cyan-400 tracking-wider whitespace-nowrap">SSES T2 SPAREPART</p>
                </div>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/50 cursor-pointer shrink-0"
                title="Kecilkan Menu (Minimize Sidebar)"
              >
                <ChevronLeft className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          ) : (
            /* Collapsed Header (Desktop) - Logo Icon Always Prominent & Uncut */
            <div className="hidden md:flex items-center justify-between w-full px-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30 shrink-0" title="Masih Berapa - SSES T2">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/50 cursor-pointer shrink-0"
                title="Perluas Menu (Expand Sidebar)"
              >
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          )}

          {/* Mobile Brand Header */}
          <div className="flex md:hidden items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30 shrink-0">
                <Boxes className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Masih Berapa</h1>
                <p className="text-[11px] text-cyan-400">SSES T2 SPAREPART</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                    isCollapsed ? 'md:justify-center md:px-0' : ''
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="hidden md:inline whitespace-nowrap">{item.label}</span>}
                <span className="md:hidden whitespace-nowrap">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800/80 m-3 rounded-xl bg-slate-950/60 border border-slate-800">
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Versi App</span>
                <span className="font-mono text-cyan-400 font-semibold">v1.0.0</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Ready for Desktop & Mobile PWA</p>
            </>
          ) : (
            <div className="text-center font-mono text-[10px] text-cyan-400 font-bold" title="Versi App v1.0.0">
              v1.0
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
