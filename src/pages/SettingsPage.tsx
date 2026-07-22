import React, { useState } from 'react';
import {
  Settings,
  Database,
  Plus,
  Layers,
  MapPin,
  Users,
  Cpu,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

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
    isSupabaseConnected
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'jenis' | 'tipe' | 'lokasi' | 'personel'>('jenis');

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Pengaturan Master System</h1>
          <p className="text-sm text-slate-400 mt-1">
            Pengelolaan Master Jenis/Tipe Peralatan, Lokasi, & Personel Teknisi.
          </p>
        </div>

        {/* Status Koneksi Supabase via .env */}
        <div className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${
          isSupabaseConnected
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-900/80 border-slate-700 text-slate-400'
        }`}>
          {isSupabaseConnected ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Database: Terkoneksi via .env</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Database: Local Storage Mode (VITE_SUPABASE_URL di .env kosong)</span>
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
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
