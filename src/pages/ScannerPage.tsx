import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Search,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Trash2,
  MapPin,
  X,
  AlertCircle,
  Building2,
  UserCheck,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Sparepart, MutationType, SupplierType } from '../types';
import { getActiveDutyPersonel } from '../utils/shiftUtils';

/**
 * Extracts SKU code from raw input string or URL (e.g. https://domain.com/?sku=SP-12345)
 */
export const extractSkuFromInput = (inputStr: string): string => {
  const trimmed = inputStr.trim();
  if (!trimmed) return '';
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const skuParam = url.searchParams.get('sku') || url.searchParams.get('scan');
      if (skuParam) return skuParam.trim();
    }
  } catch (e) {
    // fallback if not a valid URL
  }
  return trimmed;
};

export const ScannerPage: React.FC = () => {
  const {
    spareparts,
    lokasiList,
    titikLokasiList,
    unitPeralatanList,
    tipePeralatan,
    unitKerjaList,
    personelList,
    jadwalShiftList,
    sparepartCompatibility,
    addMutation
  } = useInventory();

  const [searchParams] = useSearchParams();
  const [scannedSku, setScannedSku] = useState<string>('');
  const [manualSkuInput, setManualSkuInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  
  // Found Part state
  const [foundPart, setFoundPart] = useState<Sparepart | null>(null);

  // 1. Transaction Type State
  const [mutationType, setMutationType] = useState<MutationType>('Pakai');

  // 2. Personel State
  const [selectedPersonelId, setSelectedPersonelId] = useState('');

  // 3. Conditional Location & Equipment Unit State (Only for 'Pakai' & 'Bekas')
  const [selectedLokasiId, setSelectedLokasiId] = useState('');
  const [selectedTitikId, setSelectedTitikId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  // 4. Quantity, Sumber & Notes
  const [sumber, setSumber] = useState<SupplierType>('IAS');
  const [qty, setQty] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scannerRef = useRef<any>(null);

  // --- Calculate Shift Time & Filter Active Duty Personel ---
  const {
    personelOptions,
    isFallback,
    shiftInfo
  } = getActiveDutyPersonel(personelList, jadwalShiftList, unitKerjaList);

  const { activeShiftLabel, operationalDate } = shiftInfo;

  // Default select first available personnel
  useEffect(() => {
    if (personelOptions.length > 0 && !selectedPersonelId) {
      setSelectedPersonelId(personelOptions[0].id);
    }
  }, [personelOptions, selectedPersonelId]);

  // Lookup SKU in master catalog
  const handleLookupSku = (skuToFind: string) => {
    const cleanSku = extractSkuFromInput(skuToFind);
    if (!cleanSku) return;

    const matched = spareparts.find(
      (sp) => sp.sku.toLowerCase() === cleanSku.toLowerCase() || sp.id === cleanSku
    );

    if (matched) {
      setFoundPart(matched);
      setScannedSku(cleanSku);
    } else {
      setFoundPart(null);
      setScannedSku(cleanSku);
    }
  };

  // Read ?sku= parameter from URL automatically
  useEffect(() => {
    const urlSku = searchParams.get('sku') || searchParams.get('scan');
    if (urlSku && spareparts.length > 0) {
      handleLookupSku(urlSku);
    }
  }, [searchParams, spareparts]);

  // QR Camera Scanner initialization
  useEffect(() => {
    if (activeTab !== 'camera') return;

    let scannerInstance: any = null;
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      const scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scanner.render(
        (decodedText) => {
          handleLookupSku(decodedText);
        },
        (error) => {
          // ignore scan errors
        }
      );

      scannerRef.current = scanner;
      scannerInstance = scanner;
    }).catch(console.error);

    return () => {
      if (scannerInstance) {
        scannerInstance.clear().catch((e: any) => console.error(e));
      }
    };
  }, [activeTab]);

  // --- Compatible Locations & Equipment Units for Found Sparepart ---
  const compatTypeIds = foundPart
    ? Array.from(
        new Set([
          foundPart.id_tipe,
          ...sparepartCompatibility
            .filter((c) => c.sparepart_id === foundPart.id)
            .map((c) => c.id_tipe)
        ])
      )
    : [];

  const compatibleUnits = foundPart
    ? unitPeralatanList.filter((u) => compatTypeIds.includes(u.id_tipe))
    : [];

  const compatibleLokasiList = Array.from(new Set(compatibleUnits.map((u) => u.id)))
    .map((unitId) => {
      const u = unitPeralatanList.find((x) => x.id === unitId);
      const t = titikLokasiList.find((titik) => titik.id === u?.id);
      return lokasiList.find((lok) => lok.id === t?.id_lokasi);
    })
    .filter(Boolean) as typeof lokasiList;

  const availableTitikList = selectedLokasiId
    ? titikLokasiList.filter((t) => t.id_lokasi === selectedLokasiId)
    : titikLokasiList;

  const availableUnitsForLocation = compatibleUnits.filter((u) => {
    if (!selectedLokasiId) return true;
    const t = titikLokasiList.find((titik) => titik.id === u.id);
    if (!t) return true;
    if (selectedTitikId) return t.id === selectedTitikId;
    return t.id_lokasi === selectedLokasiId;
  });

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundPart) return;

    setIsSubmitting(true);
    const success = await addMutation({
      sparepart_id: foundPart.id,
      mutation_type: mutationType,
      sumber: mutationType === 'Masuk' ? sumber : undefined,
      unit_id: (mutationType === 'Pakai' || mutationType === 'Bekas') ? (selectedUnitId || undefined) : undefined,
      personel_id: selectedPersonelId || undefined,
      qty: qty,
      notes: notes || `Transaksi via Scan Barcode/QR (${mutationType})`
    });

    setIsSubmitting(false);

    if (success) {
      setNotes('');
      setQty(1);
    }
  };

  const mutationTypes: { type: MutationType; label: string; icon: any; color: string; desc: string }[] = [
    {
      type: 'Pakai',
      label: 'Pakai Baru',
      icon: ArrowUpRight,
      color: 'from-blue-600 to-indigo-600 border-blue-500',
      desc: 'Pengeluaran stok baru untuk pemasangan'
    },
    {
      type: 'Masuk',
      label: 'Stok Masuk',
      icon: ArrowDownLeft,
      color: 'from-emerald-600 to-teal-600 border-emerald-500',
      desc: 'Penerimaan pasokan sparepart baru'
    },
    {
      type: 'Bekas',
      label: 'Retur Bekas',
      icon: RotateCcw,
      color: 'from-amber-600 to-orange-600 border-amber-500',
      desc: 'Pengembalian sparepart copotan layak pakai'
    },
    {
      type: 'Rusak',
      label: 'Scrap Rusak',
      icon: Trash2,
      color: 'from-rose-600 to-red-600 border-rose-500',
      desc: 'Pencatatan sparepart afkir/rusak'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Mobile QR Scanner & Input Transaksi</h1>
        <p className="text-sm text-slate-400 mt-1">
          Scan QR Code stiker sparepart langsung menggunakan kamera HP / Tablet untuk verifikasi & input transaksi instan.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border border-slate-800 bg-slate-900/80 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'camera'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Kamera QR Scanner</span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'manual'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Input Manual Kode SKU / URL</span>
        </button>
      </div>

      {/* Scanner Container */}
      {activeTab === 'camera' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
          <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl bg-slate-950 border border-slate-800" />
          <p className="text-xs text-slate-400 mt-4">
            Arahkan kamera ke QR Code stiker label thermal sparepart.
          </p>
        </div>
      )}

      {/* Manual Input Container */}
      {activeTab === 'manual' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <label className="block text-xs font-semibold text-slate-300">
            Ketikkan Kode SKU atau tempelkan URL QR Code:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: SP-SKF-6205ZZ atau https://masih-berapa.vercel.app/?sku=SP-SKF-6205ZZ"
              value={manualSkuInput}
              onChange={(e) => setManualSkuInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-600"
            />
            <button
              onClick={() => handleLookupSku(manualSkuInput)}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shrink-0"
            >
              Cari SKU
            </button>
          </div>
        </div>
      )}

      {/* Scanned Result Card & Full Transaction Form */}
      {foundPart ? (
        <div className="glass-panel p-6 rounded-2xl border-2 border-cyan-500/40 space-y-6 bg-cyan-950/20">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                TERSCAN: {foundPart.sku}
              </span>
              <h2 className="text-xl font-bold text-white mt-2">{foundPart.name}</h2>
              <p className="text-xs text-slate-300 mt-1">{foundPart.description}</p>
            </div>
            <button
              onClick={() => setFoundPart(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Peralatan</span>
              <span className="font-semibold text-white truncate block">{foundPart.equipment_type_name}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Lokasi Rak</span>
              <span className="font-mono font-bold text-cyan-300 block">{foundPart.location_rack}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Stok Baru</span>
              <span className="font-bold text-emerald-400 text-sm block">{foundPart.stok_aktual} {foundPart.unit || 'PCS'}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Stok Bekas</span>
              <span className="font-bold text-amber-400 text-sm block">{foundPart.stok_bekas} {foundPart.unit || 'PCS'}</span>
            </div>
          </div>

          {/* Full Transaction Form */}
          <form onSubmit={handleSubmitTransaction} className="pt-4 border-t border-slate-800/80 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                1. Jenis Transaksi Mutasi
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {mutationTypes.map((m) => {
                  const Icon = m.icon;
                  const isSelected = mutationType === m.type;
                  return (
                    <button
                      type="button"
                      key={m.type}
                      onClick={() => setMutationType(m.type)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? `bg-gradient-to-br ${m.color} text-white shadow-lg shadow-cyan-500/10`
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <div className="font-bold text-xs text-white">{m.label}</div>
                      <div className="text-[10px] opacity-70 mt-1 line-clamp-2">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Dynamic Location & Compatible Equipment Dropdowns (Only for Pakai & Bekas) */}
            {(mutationType === 'Pakai' || mutationType === 'Bekas') && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    <span>2. Penempatan Lokasi & Peralatan Kompatibel</span>
                  </label>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Trans: {mutationType}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Select Lokasi */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Lokasi Area</label>
                    <select
                      value={selectedLokasiId}
                      onChange={(e) => {
                        setSelectedLokasiId(e.target.value);
                        setSelectedTitikId('');
                        setSelectedUnitId('');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white cursor-pointer"
                    >
                      <option value="">-- Semua Lokasi / Pilih Lokasi --</option>

                      {compatibleLokasiList.length > 0 && (
                        <optgroup label="✨ Lokasi Kompatibel">
                          {compatibleLokasiList.map((lok) => (
                            <option key={lok.id} value={lok.id}>
                              {lok.nama}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      <optgroup label="📍 Semua Lokasi Lain">
                        {lokasiList.map((lok) => (
                          <option key={lok.id} value={lok.id}>
                            {lok.nama}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Select Titik Lokasi */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Titik Lokasi</label>
                    <select
                      value={selectedTitikId}
                      onChange={(e) => {
                        setSelectedTitikId(e.target.value);
                        setSelectedUnitId('');
                      }}
                      disabled={!selectedLokasiId}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white cursor-pointer disabled:opacity-50"
                    >
                      <option value="">-- Semua Titik --</option>
                      {availableTitikList.map((t) => (
                        <option key={t.id} value={t.id}>
                          Titik {t.nomor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Unit Peralatan */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Unit Peralatan Kompatibel</label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white cursor-pointer"
                    >
                      <option value="">-- Tanpa Unit Spesifik --</option>
                      {availableUnitsForLocation.map((u) => {
                        const tp = tipePeralatan.find((t) => t.id === u.id_tipe);
                        return (
                          <option key={u.id} value={u.id}>
                            [{tp?.nama || 'Unit'}] {u.serial_number || u.id} ({u.status})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Personel Operator Berdinas */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Personel Berdinas</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {operationalDate}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeShiftLabel}</span>
                  </span>
                </div>
              </div>

              {isFallback && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Jadwal shift untuk tanggal ini ({operationalDate}) belum diisi. Menampilkan semua personel sebagai pilihan.</span>
                </div>
              )}

              <div>
                <select
                  required
                  value={selectedPersonelId}
                  onChange={(e) => setSelectedPersonelId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 cursor-pointer font-bold"
                >
                  {personelOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.formattedName} {!isFallback && p.isDutyActive ? ' ✨ (Dinas Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Quantity, Sumber & Catatan */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mutationType === 'Masuk' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sumber Asal Barang *
                    </label>
                    <select
                      value={sumber}
                      onChange={(e) => setSumber(e.target.value as SupplierType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="IAS">IAS</option>
                      <option value="SUP API">SUP API</option>
                      <option value="SISA PEKERJAAN">SISA PEKERJAAN</option>
                      <option value="MANDIRI">MANDIRI</option>
                      <option value="DARI UNIT LAIN">DARI UNIT LAIN</option>
                      <option value="VENDOR">VENDOR</option>
                    </select>
                  </div>
                )}

                <div className={mutationType === 'Masuk' ? '' : 'sm:col-span-2'}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jumlah Mutasi (Qty Unit)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-base focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  Catatan Transaksi
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail alasan transaksi, kondisi sparepart, atau lokasi unit..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses Transaksi...' : `Simpan Transaksi Mutasi (${mutationType})`}
            </button>
          </form>
        </div>
      ) : (
        scannedSku && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Sparepart dengan Kode SKU "{scannedSku}" tidak ditemukan dalam Master Catalog.</span>
          </div>
        )
      )}
    </div>
  );
};
