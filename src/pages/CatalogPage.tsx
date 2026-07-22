import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Boxes,
  Edit,
  Trash2,
  X,
  MapPin,
  Clock,
  RotateCcw,
  Tag,
  Cpu,
  Layers,
  Building2,
  Check
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Sparepart } from '../types';

export const CatalogPage: React.FC = () => {
  const { spareparts, tipePeralatan, jenisPeralatan, sparepartCompatibility, addSparepart, updateSparepart, deleteSparepart } = useInventory();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('');
  const [selectedTipe, setSelectedTipe] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    id_jenis: '',
    unit: 'PCS',
    stok_aktual: 0,
    stok_bekas: 0,
    minimum_stok: 5,
    location: 'Gudang Utility Chiller T2',
    rack: 'RAK-A1-01',
    supplier_type: 'LOKAL',
    mtbf_days: 180,
    last_replaced_at: new Date().toISOString().split('T')[0]
  });

  const [selectedTipeIds, setSelectedTipeIds] = useState<string[]>([]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    const defaultJenis = jenisPeralatan[0];
    const defaultTipes = defaultJenis ? tipePeralatan.filter(t => t.id_jenis === defaultJenis.id) : [];
    
    setFormData({
      sku: 'SP-' + Math.floor(1000 + Math.random() * 9000),
      name: '',
      description: '',
      id_jenis: defaultJenis?.id || '',
      unit: 'PCS',
      stok_aktual: 0,
      stok_bekas: 0,
      minimum_stok: 5,
      location: '',
      rack: '',
      supplier_type: '',
      mtbf_days: 180,
      last_replaced_at: new Date().toISOString().split('T')[0]
    });
    setSelectedTipeIds(defaultTipes.map(t => t.id));
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sp: Sparepart) => {
    setEditingId(sp.id);
    const compatList = sparepartCompatibility.filter(c => c.sparepart_id === sp.id).map(c => c.id_tipe);
    const initialTipeIds = Array.from(new Set([sp.id_tipe, ...compatList])).filter(Boolean);

    setFormData({
      sku: sp.sku,
      name: sp.name,
      description: sp.description || '',
      id_jenis: sp.id_jenis || '',
      unit: sp.unit || 'PCS',
      stok_aktual: sp.stok_aktual,
      stok_bekas: sp.stok_bekas,
      minimum_stok: sp.minimum_stok,
      location: sp.location || sp.lokasi || 'Gudang Utama T2',
      rack: sp.rack || sp.location_rack || 'RAK-A1-01',
      supplier_type: sp.supplier_type || (sp as any).sumber || 'LOKAL',
      mtbf_days: sp.mtbf_days || 180,
      last_replaced_at: sp.last_replaced_at || new Date().toISOString().split('T')[0]
    });
    setSelectedTipeIds(initialTipeIds);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.id_jenis) return;

    const primaryTipeId = selectedTipeIds[0] || '';

    const payload = {
      ...formData,
      id_tipe: primaryTipeId,
      lokasi: formData.location,
      sumber: formData.supplier_type as any,
      location_rack: formData.rack
    };

    if (editingId) {
      await updateSparepart(editingId, payload);
    } else {
      await addSparepart(payload);
    }
    setIsModalOpen(false);
  };

  const toggleTipeSelection = (tipeId: string) => {
    setSelectedTipeIds(prev => 
      prev.includes(tipeId) ? prev.filter(id => id !== tipeId) : [...prev, tipeId]
    );
  };

  // Filter Tipe options based on selected Jenis
  const availableTipeFilter = selectedJenis
    ? tipePeralatan.filter(t => t.id_jenis === selectedJenis)
    : tipePeralatan;

  // Filter Logic
  const filteredSpareparts = spareparts.filter((sp) => {
    const matchesSearch =
      sp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sp.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sp.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesJenis = !selectedJenis || sp.id_jenis === selectedJenis;
    const matchesTipe = !selectedTipe || sp.id_tipe === selectedTipe;

    return matchesSearch && matchesJenis && matchesTipe;
  });

  // Modal available tipes based on selected id_jenis
  const modalAvailableTipes = formData.id_jenis
    ? tipePeralatan.filter(t => t.id_jenis === formData.id_jenis)
    : tipePeralatan;

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Katalog Inventaris Sparepart Master</h1>
          <p className="text-sm text-slate-400 mt-1">
            Daftar lengkap sparepart fisik, kuantitas stok baru vs bekas, dan penempatan lokasi rak.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Sparepart Baru</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari SKU, Nama Sparepart, atau Spesifikasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Filter Jenis Peralatan */}
          <div className="relative">
            <select
              value={selectedJenis}
              onChange={(e) => {
                const newJenis = e.target.value;
                setSelectedJenis(newJenis);
                // Reset selectedTipe if it no longer belongs to new Jenis
                if (newJenis && selectedTipe) {
                  const isValid = tipePeralatan.some(t => t.id === selectedTipe && t.id_jenis === newJenis);
                  if (!isValid) setSelectedTipe('');
                }
              }}
              className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-semibold"
            >
              <option value="">Semua Jenis Peralatan</option>
              {jenisPeralatan.map((jp) => (
                <option key={jp.id} value={jp.id}>
                  {jp.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tipe Peralatan */}
          <div className="relative">
            <select
              value={selectedTipe}
              onChange={(e) => setSelectedTipe(e.target.value)}
              className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="">Semua Tipe Peralatan</option>
              {availableTipeFilter.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sparepart Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSpareparts.map((sp) => {
          const isCritical = sp.stok_aktual < sp.minimum_stok;
          const tpObj = tipePeralatan.find((t) => t.id === sp.id_tipe);
          const jpObj = jenisPeralatan.find((j) => j.id === sp.id_jenis);
          const compatRecords = sparepartCompatibility.filter((c) => c.sparepart_id === sp.id);
          const compatTypeNames = compatRecords
            .map((c) => tipePeralatan.find((t) => t.id === c.id_tipe)?.nama)
            .filter(Boolean);

          return (
            <div
              key={sp.id}
              className="glass-panel glass-card-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                {/* SKU Badge & Sumber */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                    {sp.sku}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {sp.supplier_type || (sp as any).sumber || 'Lokal'}
                  </span>
                </div>

                {/* Name & Description */}
                <h3 className="text-base font-bold text-white line-clamp-1">{sp.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sp.description || 'Tanpa deskripsi'}</p>

                {/* Tipe Peralatan, Location & Rack */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                    <span className="text-slate-400 shrink-0">Jenis:</span>
                    <span className="font-medium text-cyan-300 line-clamp-1">
                      {jpObj?.nama || 'Umum'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <Cpu className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                    <span className="text-slate-400 shrink-0">Tipe Utama:</span>
                    <span className="font-medium text-white line-clamp-1">
                      {tpObj?.nama || sp.equipment_type_name || 'Semua Tipe'}
                    </span>
                  </div>

                  {compatTypeNames.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[10px] text-cyan-400 font-semibold w-full">Kompatibel Dengan:</span>
                      {compatTypeNames.map((name, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400">Gudang:</span>
                    <span className="font-semibold text-slate-200">{sp.location || sp.lokasi || 'Gudang Utama T2'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400">Kode Rak:</span>
                    <span className="font-mono font-semibold text-cyan-300">{sp.rack || sp.location_rack || 'RAK-A1'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400">MTBF Usia Pakai:</span>
                    <span className="font-semibold text-slate-200">{sp.mtbf_days || 180} Hari</span>
                  </div>
                </div>

                {/* Stock Badges */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Stok Baru</span>
                    <span className={`text-base font-bold ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {sp.stok_aktual} {sp.unit || 'PCS'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Min: {sp.minimum_stok}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      Stok Bekas
                    </span>
                    <span className="text-base font-bold text-amber-400">
                      {sp.stok_bekas} {sp.unit || 'PCS'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Rotable Reusable</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  Rak: {sp.rack || sp.location_rack || 'RAK-A1'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(sp)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSparepart(sp.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                    title="Hapus Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-xl w-full rounded-2xl border border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Edit Sparepart Master' : 'Tambah Sparepart Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kode SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Peralatan *</label>
                  <select
                    required
                    value={formData.id_jenis}
                    onChange={(e) => {
                      const newJenisId = e.target.value;
                      setFormData({ ...formData, id_jenis: newJenisId });
                      const newAvailableTipes = tipePeralatan.filter(t => t.id_jenis === newJenisId);
                      setSelectedTipeIds(newAvailableTipes.map(t => t.id));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                  >
                    <option value="">-- Pilih Jenis Peralatan --</option>
                    {jenisPeralatan.map((jp) => (
                      <option key={jp.id} value={jp.id}>
                        {jp.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checklist Tipe Peralatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipe Peralatan (Bisa pilih lebih dari satu)
                </label>
                <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                  {modalAvailableTipes.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">Pilih Jenis Peralatan terlebih dahulu</span>
                  ) : (
                    modalAvailableTipes.map((tp) => {
                      const isChecked = selectedTipeIds.includes(tp.id);
                      return (
                        <label
                          key={tp.id}
                          onClick={() => toggleTipeSelection(tp.id)}
                          className={`flex items-center gap-2 text-xs p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{tp.nama} {tp.varian ? `(${tp.varian})` : ''}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Sparepart *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: OCP/Control Panel Rapiscan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi / Spesifikasi</label>
                <textarea
                  rows={2}
                  placeholder="Spesifikasi teknis fisik, material, ukuran..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stok Baru</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stok_aktual}
                    onChange={(e) => setFormData({ ...formData, stok_aktual: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stok Bekas</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stok_bekas}
                    onChange={(e) => setFormData({ ...formData, stok_bekas: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-amber-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min. Stok</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimum_stok}
                    onChange={(e) => setFormData({ ...formData, minimum_stok: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Satuan Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gudang</label>
                  <input
                    type="text"
                    placeholder=""
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kode Rak</label>
                  <input
                    type="text"
                    placeholder="Contoh: RAK-A1-04"
                    value={formData.rack}
                    onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">MTBF (Hari Usia Pakai)</label>
                  <input
                    type="number"
                    value={formData.mtbf_days}
                    onChange={(e) => setFormData({ ...formData, mtbf_days: parseInt(e.target.value) || 180 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sumber</label>
                  <input
                    type="text"
                    placeholder="Contoh: Lokal PT Mahkota / Impor Germany"
                    value={formData.supplier_type}
                    onChange={(e) => setFormData({ ...formData, supplier_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambah Sparepart'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
