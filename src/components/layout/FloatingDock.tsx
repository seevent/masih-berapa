import React from 'react';
import { NavLink } from 'react-router-dom';
import { QrCode, ArrowLeftRight, Boxes, Printer } from 'lucide-react';

export const FloatingDock: React.FC = () => {
  return (
    <div className="floating-dock hidden sm:flex items-center gap-2 transition-all duration-300">
      <NavLink
        to="/scanner"
        className={({ isActive }) =>
          `flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
            isActive
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`
        }
      >
        <QrCode className="w-4 h-4" />
        <span>Scan QR</span>
      </NavLink>

      <div className="w-px h-5 bg-slate-800" />

      <NavLink
        to="/input-sparepart"
        className={({ isActive }) =>
          `flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
            isActive
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`
        }
      >
        <ArrowLeftRight className="w-4 h-4" />
        <span>Transaksi Mutasi</span>
      </NavLink>

      <div className="w-px h-5 bg-slate-800" />

      <NavLink
        to="/catalog"
        className={({ isActive }) =>
          `flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
            isActive
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`
        }
      >
        <Boxes className="w-4 h-4" />
        <span>Katalog</span>
      </NavLink>

      <div className="w-px h-5 bg-slate-800" />

      <NavLink
        to="/print"
        className={({ isActive }) =>
          `flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
            isActive
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`
        }
      >
        <Printer className="w-4 h-4" />
        <span>Cetak Label</span>
      </NavLink>
    </div>
  );
};
