import React, { useState } from 'react';
import {
  Settings,
  Database,
  Plus,
  Sparkles,
  Link2,
  Key,
  Layers,
  MapPin,
  Users,
  Cpu,
  UserCheck
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { getStoredSupabaseConfig, saveSupabaseConfig, seedSupabaseDatabase } from '../lib/supabase';
import { useNotification } from '../context/NotificationContext';

export const SettingsPage: React.FC = () => {
  const {
    jenisPeralatan,
    tipePeralatan,
    lokasiList,
    titikLokasiList,
    unitKerjaList,
    personelList,
    addJenisPeralatan,
    addTipePeralatan,
    addLokasi,
    addTitikLokasi,
    addPersonel,
    isSupabaseConnected,
    refreshData
  } = useInventory();

  const { showToast } = useNotification();
  const storedConfig = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(storedConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(storedConfig.anonKey);
  const [isSeeding, setIsSeeding] = useState(false);

  const [activeTab, setActiveTab] = useState<'supabase' | 'jenis' | 'tipe' | 'lokasi' | 'personel'>('supabase');

  // Form States
  const [jenisNama, setJenisNama] = useState('');
  const [tampilKalibrasi, setTampilKalibrasi] = useState(false);

  const [tipeJenisId, setTipeJenisId] = useState('');
  const [tipeNama, setTipeNama] = useState('');
  const [tipeVarian, setTipeVarian] = useState('');

  const [lokasiNama, setLokasiNama] = useState('');
  const [titikLokasiId, setTitikLokasiId] = useState('');
  const [titikNomor, setTitikNomor] = useState('');

  const [personelNik, setPersonelNik] = useState('');
  const [personelNama, setPersonelNama] = useState('');
  const [personelHp, setPersonelHp] = useState('');
  const [personelUnitId, setPersonelUnitId] = useState('');
  const [personelJabatan, setPersonelJabatan] = useState('');

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    showToast('Konfigurasi Disimpan', 'Konfigurasi Supabase diperbarui. Memuat ulang koneksi...', 'success');
    refreshData();
  };

  const handleRunSeed = async () => {
    setIsSeeding(true);
    const result = await seedSupabaseDatabase();
    setIsSeeding(false);
    showToast(
      result.success ? 'Seed Database Berhasil' : 'Seed Gagal',
      result.message,
      result.success ? 'success' : 'error'
    );
    if (result.success) {
      refreshData();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Pengaturan Master System & Database</h1>
        <p className="text-sm text-slate-400 mt-1">
          Konektivitas Supabase, 1-Click Database Seed, Master Jenis/Tipe Peralatan, Lokasi, & Personel.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'supabase'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Koneksi Supabase & Seed</span>
        </button>

        <button
          onClick={() => setActiveTab('jenis')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'jenis'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Jenis Peralatan ({jenisPeralatan.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tipe')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tipe'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Tipe Peralatan ({tipePeralatan.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lokasi')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'lokasi'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Lokasi & Titik ({lokasiList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('personel')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'personel'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Personel ({personelList.length})</span>
        </button>
      </div>

      {/* Tab Content: Supabase & Seed */}
      {activeTab === 'supabase' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Koneksi Database Supabase Cloud</h3>
                <p className="text-xs text-slate-400">Sesuaikan dengan schema database PostgreSQL Anda</p>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                isSupabaseConnected
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
              }`}
            >
              {isSupabaseConnected ? 'Terkoneksi Supabase Direct' : 'Local Storage Mode'}
            </div>
          </div>

          <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-slate-400" />
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://yourproject.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleRunSeed}
                disabled={isSeeding}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{isSeeding ? 'Menginjeksi Seed...' : '1-Click Injeksi Sampel Data ke Supabase'}</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/25"
              >
                Simpan Konfigurasi Supabase
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content: Jenis Peralatan */}
      {activeTab === 'jenis' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white">Master Tabel: `jenis_peralatan`</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!jenisNama) return;
              await addJenisPeralatan({ nama: jenisNama, tampil_di_kalibrasi: tampilKalibrasi });
              setJenisNama('');
            }}
            className="flex flex-col sm:flex-row gap-3 text-xs"
          >
            <input
              type="text"
              required
              placeholder="Nama Jenis Peralatan (contoh: HVAC Presisi)"
              value={jenisNama}
              onChange={(e) => setJenisNama(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={tampilKalibrasi}
                onChange={(e) => setTampilKalibrasi(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500"
              />
              <span>Tampil di Kalibrasi</span>
            </label>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs"
            >
              Tambah Jenis
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Nama Jenis Peralatan</th>
                  <th className="py-2.5 px-3">Tampil di Kalibrasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {jenisPeralatan.map((jp) => (
                  <tr key={jp.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{jp.nama}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {jp.tampil_di_kalibrasi ? 'Ya' : 'Tidak'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Tipe Peralatan */}
      {activeTab === 'tipe' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white">Master Tabel: `tipe_peralatan`</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!tipeNama || !tipeJenisId) return;
              await addTipePeralatan({ id_jenis: tipeJenisId, nama: tipeNama, varian: tipeVarian });
              setTipeNama('');
              setTipeVarian('');
            }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
          >
            <select
              required
              value={tipeJenisId}
              onChange={(e) => setTipeJenisId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="">-- Pilih Jenis --</option>
              {jenisPeralatan.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nama}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Nama Tipe (contoh: Chiller 500TR)"
              value={tipeNama}
              onChange={(e) => setTipeNama(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
            <input
              type="text"
              placeholder="Varian (contoh: R-134a)"
              value={tipeVarian}
              onChange={(e) => setTipeVarian(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
            <button
              type="submit"
              className="py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs"
            >
              Tambah Tipe
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Nama Tipe Peralatan</th>
                  <th className="py-2.5 px-3">Induk Jenis</th>
                  <th className="py-2.5 px-3">Varian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tipePeralatan.map((tp) => {
                  const jp = jenisPeralatan.find((j) => j.id === tp.id_jenis);
                  return (
                    <tr key={tp.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-white">{tp.nama}</td>
                      <td className="py-2.5 px-3 text-cyan-400 font-medium">{jp?.nama || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{tp.varian || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Lokasi & Titik Lokasi */}
      {activeTab === 'lokasi' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white">Master Tabel: `lokasi` & `titik_lokasi`</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!lokasiNama) return;
              await addLokasi({ nama: lokasiNama });
              setLokasiNama('');
            }}
            className="flex gap-2 text-xs"
          >
            <input
              type="text"
              required
              placeholder="Nama Lokasi Baru (contoh: Terminal 2F)"
              value={lokasiNama}
              onChange={(e) => setLokasiNama(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
            <button type="submit" className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl">
              Tambah Lokasi
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Nama Lokasi Area</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lokasiList.map((lok) => (
                  <tr key={lok.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{lok.nama}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Personel */}
      {activeTab === 'personel' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white">Master Tabel: `personel` & `unit_kerja`</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!personelNik || !personelNama) return;
              await addPersonel({
                nik: personelNik,
                nama: personelNama,
                no_hp: personelHp,
                unit_id: personelUnitId || undefined,
                jabatan: personelJabatan
              });
              setPersonelNik('');
              setPersonelNama('');
              setPersonelHp('');
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
          >
            <input
              type="text"
              required
              placeholder="NIK Personel"
              value={personelNik}
              onChange={(e) => setPersonelNik(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
            <input
              type="text"
              required
              placeholder="Nama Lengkap"
              value={personelNama}
              onChange={(e) => setPersonelNama(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
            <input
              type="text"
              placeholder="No. HP / WA"
              value={personelHp}
              onChange={(e) => setPersonelHp(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
            <button type="submit" className="sm:col-span-3 py-2 bg-cyan-600 text-white font-bold rounded-xl">
              Tambah Personel Teknisi
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">NIK</th>
                  <th className="py-2.5 px-3">Nama</th>
                  <th className="py-2.5 px-3">Jabatan</th>
                  <th className="py-2.5 px-3">No. HP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {personelList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{p.nik}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{p.nama}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.jabatan || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{p.no_hp || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
