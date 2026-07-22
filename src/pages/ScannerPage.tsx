import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Search, CheckCircle2, ArrowUpRight, RotateCcw, Trash2, MapPin, X, AlertCircle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Sparepart, MutationType } from '../types';

export const ScannerPage: React.FC = () => {
  const { spareparts, addMutation } = useInventory();
  const [scannedSku, setScannedSku] = useState<string>('');
  const [manualSkuInput, setManualSkuInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  
  // Found Part state
  const [foundPart, setFoundPart] = useState<Sparepart | null>(null);

  // Quick Action Form state
  const [actionType, setActionType] = useState<MutationType>('Pakai');
  const [actionQty, setActionQty] = useState(1);
  const [operatorName, setOperatorName] = useState('Teknisi Scanner');
  const [referenceNo, setReferenceNo] = useState('WO-SCAN-01');
  const [isProcessing, setIsProcessing] = useState(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Search part by SKU
  const handleLookupSku = (skuToFind: string) => {
    const cleanSku = skuToFind.trim();
    if (!cleanSku) return;

    const matched = spareparts.find(
      (sp) => sp.sku.toLowerCase() === cleanSku.toLowerCase() || sp.id === cleanSku
    );

    if (matched) {
      setFoundPart(matched);
      setScannedSku(cleanSku);
    } else {
      setFoundPart(null);
    }
  };

  useEffect(() => {
    if (activeTab !== 'camera') return;

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

    return () => {
      scanner.clear().catch((e) => console.error(e));
    };
  }, [activeTab]);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundPart) return;

    setIsProcessing(true);
    await addMutation({
      sparepart_id: foundPart.id,
      mutation_type: actionType,
      qty: actionQty,
      operator_name: operatorName,
      reference_no: referenceNo,
      notes: `Quick action via QR Camera Scanner (${actionType})`
    });
    setIsProcessing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Mobile QR Scanner & Verifikasi</h1>
        <p className="text-sm text-slate-400 mt-1">
          Scan QR Code stiker sparepart langsung menggunakan kamera HP / Tablet untuk verifikasi & update stok cepat.
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
          <span>Input Manual Kode SKU</span>
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
            Ketikkan Kode SKU atau ID Sparepart:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: SP-SKF-6205ZZ"
              value={manualSkuInput}
              onChange={(e) => setManualSkuInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
            />
            <button
              onClick={() => handleLookupSku(manualSkuInput)}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
            >
              Cari SKU
            </button>
          </div>
        </div>
      )}

      {/* Scanned Result Card & Quick Action Form */}
      {foundPart ? (
        <div className="glass-panel p-6 rounded-2xl border-2 border-cyan-500/40 space-y-6 bg-cyan-950/20">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                VERIFIKASI TERKONEKSI: {foundPart.sku}
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
              <span className="font-bold text-emerald-400 text-sm block">{foundPart.stok_aktual} {foundPart.unit}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Stok Bekas</span>
              <span className="font-bold text-amber-400 text-sm block">{foundPart.stok_bekas} {foundPart.unit}</span>
            </div>
          </div>

          {/* Quick Action Form */}
          <form onSubmit={handleQuickSubmit} className="pt-4 border-t border-slate-800/80 space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Update Stok Instan via Scan:
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActionType('Pakai')}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  actionType === 'Pakai'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Pakai (WO)</span>
              </button>
              <button
                type="button"
                onClick={() => setActionType('Bekas')}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  actionType === 'Bekas'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retur Bekas</span>
              </button>
              <button
                type="button"
                onClick={() => setActionType('Rusak')}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  actionType === 'Rusak'
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Scrap Rusak</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Jumlah (Qty)</label>
                <input
                  type="number"
                  min="1"
                  value={actionQty}
                  onChange={(e) => setActionQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">No. Work Order</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              Proses Transaksi Scan
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
