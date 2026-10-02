import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QrCode, Search, X, AlertCircle, PackagePlus } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { TransactionForm } from '../components/mutation/TransactionForm';

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

/** Same QR seen again by the camera within this time is ignored (scan it again later to add +1). */
const CAMERA_REPEAT_MS = 3000;

export const ScannerPage: React.FC = () => {
  const { spareparts } = useInventory();

  const [searchParams] = useSearchParams();
  const [scannedSku, setScannedSku] = useState<string>('');
  const [manualSkuInput, setManualSkuInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');

  // Last scanned part (id, so stock figures stay live) and the event that adds it to the list
  const [foundPartId, setFoundPartId] = useState<string | null>(null);
  const foundPart = foundPartId ? spareparts.find((sp) => sp.id === foundPartId) || null : null;
  const [incomingPart, setIncomingPart] = useState<{ id: string; nonce: number } | null>(null);
  const nonceRef = useRef(0);

  // Lookup SKU in master catalog. Kept in a ref because the camera callback is registered
  // once and would otherwise keep a stale (possibly still empty) sparepart list.
  const sparepartsRef = useRef(spareparts);
  sparepartsRef.current = spareparts;

  // The camera reports the same QR many times per second while it stays in view:
  // the same code within this window counts as one scan.
  const lastCameraScanRef = useRef<{ code: string; at: number } | null>(null);

  const handleLookupSku = (skuToFind: string, fromCamera = false) => {
    const cleanSku = extractSkuFromInput(skuToFind);
    if (!cleanSku) return;
    if (fromCamera) {
      const now = Date.now();
      const last = lastCameraScanRef.current;
      if (last && last.code === cleanSku && now - last.at < CAMERA_REPEAT_MS) return;
      lastCameraScanRef.current = { code: cleanSku, at: now };
    }

    const matched = sparepartsRef.current.find(
      (sp) => sp.sku.toLowerCase() === cleanSku.toLowerCase() || sp.id === cleanSku
    );
    setScannedSku(cleanSku);
    setFoundPartId(matched ? matched.id : null);
    if (matched) {
      nonceRef.current += 1;
      setIncomingPart({ id: matched.id, nonce: nonceRef.current });
    }
  };

  const handleLookupRef = useRef(handleLookupSku);
  handleLookupRef.current = handleLookupSku;

  // Read ?sku= parameter from URL automatically
  useEffect(() => {
    const urlSku = searchParams.get('sku') || searchParams.get('scan');
    if (urlSku && spareparts.length > 0) {
      handleLookupRef.current(urlSku);
    }
    // Runs when the URL changes or the catalog first loads, not after every refresh
    // (otherwise each save would add the URL part to the list again)
  }, [searchParams, spareparts.length > 0]);

  // QR Camera Scanner initialization
  useEffect(() => {
    if (activeTab !== 'camera') return;

    let cancelled = false;
    let scannerInstance: any = null;
    import('html5-qrcode')
      .then(({ Html5QrcodeScanner }) => {
        // The tab may have been switched / page left while the module was loading
        if (cancelled || !document.getElementById('reader')) return;

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
            handleLookupRef.current(decodedText, true);
          },
          () => {
            // ignore per-frame "no QR found" errors
          }
        );

        scannerInstance = scanner;
      })
      .catch(console.error);

    return () => {
      cancelled = true;
      if (scannerInstance) {
        scannerInstance.clear().catch((e: any) => console.error(e));
      }
    };
  }, [activeTab]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Mobile QR Scanner & Input Transaksi</h1>
        <p className="text-sm text-slate-400 mt-1">
          Scan QR sparepart satu per satu: setiap scan menambah sparepart ke daftar (scan ulang = jumlah +1), lalu simpan
          sekaligus.
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

      {activeTab === 'camera' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
          <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl bg-slate-950 border border-slate-800" />
          <p className="text-xs text-slate-400 mt-4">Arahkan kamera ke QR Code stiker label sparepart.</p>
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <label className="block text-xs font-semibold text-slate-300">Ketikkan Kode SKU atau tempelkan URL QR Code:</label>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupSku(manualSkuInput);
              setManualSkuInput('');
            }}
          >
            <input
              type="text"
              placeholder="Contoh: SP-003 atau https://masih-berapa.vercel.app/?sku=SP-003"
              value={manualSkuInput}
              onChange={(e) => setManualSkuInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-600"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shrink-0"
            >
              Tambahkan
            </button>
          </form>
        </div>
      )}

      {/* Last scan */}
      {foundPart ? (
        <div className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <PackagePlus className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <div className="text-cyan-300 font-bold">Ditambahkan ke daftar: {foundPart.sku}</div>
              <div className="text-white font-semibold text-sm">{foundPart.name}</div>
              <div className="text-slate-400 mt-1">
                Stok baru {foundPart.stok_aktual} · bekas {foundPart.stok_bekas} · rusak {foundPart.stok_rusak} {foundPart.unit} ·
                Rak {foundPart.rack || foundPart.lokasi || '-'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setFoundPartId(null);
              setScannedSku('');
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        scannedSku && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Sparepart dengan Kode SKU "{scannedSku}" tidak ditemukan dalam Master Catalog.</span>
          </div>
        )
      )}

      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <TransactionForm
          defaultType="Pakai"
          incomingPart={incomingPart}
          showPartFilters={false}
          onSaved={() => {
            setFoundPartId(null);
            setScannedSku('');
          }}
        />
      </div>
    </div>
  );
};
