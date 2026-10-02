import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, CheckCircle2, HelpCircle, Wrench, PackageSearch, Info } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import {
  AGE_RATIO_KRITIS,
  AGE_RATIO_PERHATIAN,
  PLANNING_HORIZON_DAYS,
  PositionStatus,
  SERVICE_LEVEL
} from '../utils/reliability';
import { MtbfBadge } from '../components/predictive/MtbfBadge';

const STATUS_STYLE: Record<PositionStatus, { label: string; className: string; icon: React.ElementType }> = {
  LEWAT: { label: 'Lewat MTBF', className: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse', icon: ShieldAlert },
  KRITIS: { label: 'Kritis', className: 'bg-rose-500/15 text-rose-300 border-rose-500/30', icon: ShieldAlert },
  PERHATIAN: { label: 'Perhatian', className: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: AlertTriangle },
  NORMAL: { label: 'Normal', className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  BELUM_CUKUP_DATA: { label: 'Belum cukup data', className: 'bg-slate-800 text-slate-400 border-slate-700', icon: HelpCircle }
};

const pct = (n: number) => `${Math.round(n * 100)}%`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const formatNumber = (n: number, digits = 2) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: digits });

export const PredictiveAlertsPage: React.FC = () => {
  const { predictive, unitPeralatanList, tipePeralatan, penempatanList, lokasiList, titikLokasiList } = useInventory();
  const { positionAlerts, stockCoverage, mtbfBySparepart } = predictive;

  const countByStatus = (status: PositionStatus) => positionAlerts.filter((a) => a.status === status).length;
  const urgentPositions = countByStatus('KRITIS') + countByStatus('LEWAT');
  const orderCount = stockCoverage.filter((c) => c.needs_order).length;

  const describeUnit = (unitId: string) => {
    const unit = unitPeralatanList.find((u) => u.id === unitId);
    const tipe = unit ? tipePeralatan.find((t) => t.id === unit.id_tipe) : undefined;
    const pen = penempatanList.find((p) => p.is_active && p.id_unit === unitId);
    const lokasi = pen?.id_lokasi ? lokasiList.find((l) => l.id === pen.id_lokasi)?.nama : undefined;
    const titik = pen?.id_titik ? titikLokasiList.find((t) => t.id === pen.id_titik)?.nomor : undefined;
    return {
      name: unit ? `[${tipe?.nama || 'Unit'}] ${unit.serial_number || unit.id}` : `Unit ${unitId.slice(0, 8)}…`,
      place: [lokasi, titik && `Titik ${titik}`].filter(Boolean).join(' · ') || 'Lokasi belum tercatat'
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Predictive Maintenance Alerts</h1>
        <p className="text-sm text-slate-400 mt-1">
          MTBF dihitung otomatis dari riwayat transaksi Pakai per unit peralatan. Umur komponen dibandingkan dengan MTBF,
          dan kecukupan stok dihitung untuk {PLANNING_HORIZON_DAYS} hari ke depan dengan target layanan {pct(SERVICE_LEVEL)}.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 uppercase">Komponen Kritis / Lewat MTBF</span>
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white">{urgentPositions}</span>
            <span className="text-xs text-rose-400 ml-2 font-medium">posisi terpasang, umur ≥ {pct(AGE_RATIO_KRITIS)} MTBF</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase">Perhatian</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white">{countByStatus('PERHATIAN')}</span>
            <span className="text-xs text-amber-400 ml-2 font-medium">posisi, umur ≥ {pct(AGE_RATIO_PERHATIAN)} MTBF</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 uppercase">Perlu Dipesan</span>
            <PackageSearch className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white">{orderCount}</span>
            <span className="text-xs text-cyan-400 ml-2 font-medium">SKU, stok tersedia di bawah titik pesan</span>
          </div>
        </div>
      </div>

      {/* Section 1: installed positions */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            Umur Komponen Terpasang
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Satu baris per sparepart di satu unit yang beroperasi. Umur = hari sejak transaksi Pakai terakhir di unit itu.
            Status: Normal &lt; {pct(AGE_RATIO_PERHATIAN)}, Perhatian &lt; {pct(AGE_RATIO_KRITIS)}, Kritis ≤ 100%, Lewat &gt; 100% MTBF.
          </p>
        </div>

        {positionAlerts.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-400 space-y-1">
            <HelpCircle className="w-6 h-6 mx-auto text-slate-500" />
            <p className="font-semibold text-slate-300">Belum cukup data</p>
            <p>Belum ada transaksi Pakai yang mencatat unit peralatan. Umur komponen mulai dipantau setelah Pakai pertama dicatat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Sparepart</th>
                  <th className="py-3.5 px-4">Unit & Lokasi</th>
                  <th className="py-3.5 px-4">Terpasang Sejak</th>
                  <th className="py-3.5 px-4 text-center">Umur</th>
                  <th className="py-3.5 px-4 text-center">MTBF (data)</th>
                  <th className="py-3.5 px-4 text-center">Rasio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {positionAlerts.map(({ sparepart: sp, position, age_days, mtbf_days, ratio, status }) => {
                  const style = STATUS_STYLE[status];
                  const Icon = style.icon;
                  const unit = describeUnit(position.unit_id);
                  return (
                    <tr key={`${sp.id}-${position.unit_id}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold border ${style.className}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {style.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-cyan-400 font-bold">{sp.sku}</div>
                        <div className="text-white font-medium">{sp.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">{unit.name}</div>
                        <div className="text-[10px] text-slate-500">{unit.place}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        <div>{formatDate(position.last_installed_at)}</div>
                        <div className="text-[10px] text-slate-500">
                          {position.installs}× dipasang sejak {formatDate(position.first_installed_at)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-200 font-semibold whitespace-nowrap">
                        {Math.floor(age_days)} hari
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {mtbf_days === null ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <MtbfBadge estimate={mtbfBySparepart[sp.id]} compact />
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {ratio === null ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <div className="space-y-1">
                            <span className="font-bold text-white">{pct(ratio)}</span>
                            <div className="w-20 h-1.5 mx-auto rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full ${
                                  status === 'NORMAL' ? 'bg-emerald-500' : status === 'PERHATIAN' ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, ratio * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: stock coverage */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PackageSearch className="w-4 h-4 text-cyan-400" />
            Kecukupan Stok {PLANNING_HORIZON_DAYS} Hari @ SLA {pct(SERVICE_LEVEL)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Kebutuhan per hari (r) = total Pakai dalam jendela pengamatan ÷ panjang jendela (30–365 hari). Titik pesan = jumlah
            terkecil yang mencukupi kebutuhan {PLANNING_HORIZON_DAYS} hari dengan peluang {pct(SERVICE_LEVEL)} (distribusi Poisson),
            sehingga stok minimum = titik pesan − 1 (dihitung otomatis, tidak diisi manual). Stok tersedia = baru + bekas, karena Pakai bisa mengambil keduanya.
          </p>
        </div>

        <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            Horizon {PLANNING_HORIZON_DAYS} hari dipakai sementara karena data lead time pemesanan belum ada.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Sparepart</th>
                <th className="py-3.5 px-4 text-center">Pakai / Jendela</th>
                <th className="py-3.5 px-4 text-center">Perkiraan {PLANNING_HORIZON_DAYS} Hari</th>
                <th className="py-3.5 px-4 text-center">Titik Pesan</th>
                <th className="py-3.5 px-4 text-center">Stok Tersedia</th>
                <th className="py-3.5 px-4 text-center">Usulan Pesan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {stockCoverage.map((c) => {
                const sp = c.sparepart;
                const hasData = c.reorder_point_sla !== null;
                return (
                  <tr key={sp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {c.needs_order ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          PESAN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Cukup
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-cyan-400 font-bold">{sp.sku}</div>
                      <div className="text-white font-medium">{sp.name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {hasData ? (
                        <>
                          <div className="text-slate-200 font-semibold">
                            {c.demand.usage_qty} {sp.unit} / {Math.round(c.demand.window_days)} hari
                          </div>
                          <div className="text-[10px] text-slate-500">r = {formatNumber(c.demand.rate_per_day, 3)} per hari</div>
                        </>
                      ) : (
                        <span className="text-slate-500">Belum cukup data</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 whitespace-nowrap">
                      {hasData ? `${formatNumber(c.lambda)} ${sp.unit}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="font-bold text-white">{c.reorder_level} {sp.unit}</div>
                      <div className="text-[10px] text-slate-500">
                        {hasData ? `SLA 98% · stok minimum ${sp.minimum_stok}` : 'belum ada pemakaian: pesan saat habis'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`font-bold ${c.needs_order ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {c.stok_tersedia} {sp.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {c.order_qty > 0 ? (
                        <span className="px-3 py-1.5 rounded-lg font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          {c.order_qty} {sp.unit}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
