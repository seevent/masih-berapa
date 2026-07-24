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
  AlertCircle,
  Boxes
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const SettingsPage: React.FC = () => {
  const {
    jenisPeralatan,
    tipePeralatan,
    lokasiList,
    titikLokasiList,
    unitPeralatanList,
    unitKerjaList,
    personelList,
    addJenisPeralatan,
    addTipePeralatan,
    addLokasi,
    addTitikLokasi,
    addUnitPeralatan,
    addPersonel,
    isSupabaseConnected
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'unit' | 'jenis' | 'tipe' | 'lokasi' | 'personel'>('unit');

  // Form States: Unit Peralatan
  const [unitSerial, setUnitSerial] = useState('');
  const [unitTipeId, setUnitTipeId] = useState('');
  const [unitStatus, setUnitStatus] = useState<'operasi' | 'standby' | 'gudang' | 'rusak'>('operasi');
  const [unitAmpere, setUnitAmpere] = useState('');
  const [unitCatatan, setUnitCatatan] = useState('');

  // Form States: Jenis & Tipe
  const [jenisNama, setJenisNama] = useState('');
  const [tampilKalibrasi, setTampilKalibrasi] = useState(false);

  const [tipeJenisId, setTipeJenisId] = useState('');
  const [tipeNama, setTipeNama] = useState('');
  const [tipeVarian, setTipeVarian] = useState('');

  // Form States: Lokasi & Titik
  const [lokasiNama, setLokasiNama] = useState('');
  const [titikLokasiId, setTitikLokasiId] = useState('');
  const [titikNomor, setTitikNomor] = useState('');

  // Form States: Personel
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
            Pengelolaan Master Unit Peralatan, Jenis/Tipe, Lokasi, & Personel Teknisi.
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
          onClick={() => setActiveTab('unit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'unit'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Unit Peralatan ({unitPeralatanList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('jenis')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'personel'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Personel ({personelList.length})</span>
        </button>
      </div>

      {/* Tab Content: Unit Peralatan */}
      {activeTab === 'unit' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white">Master Tabel: `unit_peralatan`</h3>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!unitTipeId) return;
              await addUnitPeralatan({
                id_tipe: unitTipeId,
                serial_number: unitSerial || undefined,
                status: unitStatus,
                ampere: unitAmpere || undefined,
                catatan: unitCatatan || undefined,
                milik: 'Injourney / AP2'
              });
              setUnitSerial('');
              setUnitAmpere('');
              setUnitCatatan('');
            }}
            className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs"
          >
            <select
              required
              value={unitTipeId}
              onChange={(e) => setUnitTipeId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
            >
              <option value="">-- Pilih Tipe Peralatan * --</option>
              {tipePeralatan.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.nama}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Serial Number (SN)"
              value={unitSerial}
              onChange={(e) => setUnitSerial(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />

            <select
              value={unitStatus}
              onChange={(e) => setUnitStatus(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
            >
              <option value="operasi">Operasi</option>
              <option value="standby">Standby</option>
              <option value="gudang">Gudang</option>
              <option value="rusak">Rusak</option>
            </select>

            <input
              type="text"
              placeholder="Ampere / Kapasitas"
              value={unitAmpere}
              onChange={(e) => setUnitAmpere(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />

            <button
              type="submit"
              className="py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Tambah Unit Asset
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Serial Number (SN)</th>
                  <th className="py-2.5 px-3">Tipe Peralatan</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Ampere</th>
                  <th className="py-2.5 px-3">Kepemilikan</th>
                  <th className="py-2.5 px-3">Catatan Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {unitPeralatanList.map((u) => {
                  const tp = tipePeralatan.find((t) => t.id === u.id_tipe);
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{u.serial_number || u.id.slice(0, 8)}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{tp?.nama || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === 'operasi' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          u.status === 'standby' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                          u.status === 'gudang' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono">{u.ampere || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{u.milik || 'Injourney / AP2'}</td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">{u.catatan || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs cursor-pointer"
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
              className="py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs cursor-pointer"
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <button type="submit" className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl cursor-pointer">
                Tambah Lokasi
              </button>
            </form>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!titikLokasiId || !titikNomor) return;
                await addTitikLokasi({ id_lokasi: titikLokasiId, nomor: titikNomor });
                setTitikNomor('');
              }}
              className="flex gap-2 text-xs"
            >
              <select
                required
                value={titikLokasiId}
                onChange={(e) => setTitikLokasiId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="">-- Pilih Lokasi --</option>
                {lokasiList.map((lok) => (
                  <option key={lok.id} value={lok.id}>
                    {lok.nama}
                  </option>
                ))}
              </select>

              <input
                type="text"
                required
                placeholder="Nomor Titik (contoh: 1)"
                value={titikNomor}
                onChange={(e) => setTitikNomor(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />

              <button type="submit" className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl cursor-pointer">
                Tambah Titik
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Lokasi</th>
                  <th className="py-2.5 px-3 w-1/3">Titik Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lokasiList.map((lok) => {
                  // Find all titik for this location
                  const titikRecords = titikLokasiList.filter(
                    (t) => t.id_lokasi === lok.id && t.nomor && t.nomor.trim() !== '-'
                  );
                  const titikFormatted = titikRecords.length > 0
                    ? titikRecords.map((t) => t.nomor).join(', ')
                    : '';

                  return (
                    <tr key={lok.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-white">{lok.nama}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-cyan-300">
                        {titikFormatted ? `[${titikFormatted}]` : '-'}
                      </td>
                    </tr>
                  );
                })}
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
            <button type="submit" className="sm:col-span-3 py-2 bg-cyan-600 text-white font-bold rounded-xl cursor-pointer">
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
