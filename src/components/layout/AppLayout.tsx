import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { HeaderStats } from './HeaderStats';
import { useInventory } from '../../context/InventoryContext';
import { AlertTriangle, Database, ArrowRight } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSupabaseConnected, isLoading } = useInventory();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-72 flex flex-col min-w-0">
        <HeaderStats setMobileOpen={setMobileOpen} />

        {/* Warning Banner if Supabase Disconnected */}
        {!isLoading && !isSupabaseConnected && (
          <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/90 border-b border-rose-500/30 px-4 py-3 text-xs text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white">Mode 100% Supabase PostgreSQL Aktif:</span> Kredensial Supabase URL & Anon Key belum terhubung.
              </div>
            </div>
            <Link
              to="/settings"
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all self-end sm:self-auto shrink-0"
            >
              <span>Atur Supabase & Seed Database</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
