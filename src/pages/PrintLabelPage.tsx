import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Printer, Download, QrCode, Layers, MapPin, Boxes, Check } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const PrintLabelPage: React.FC = () => {
  const { spareparts } = useInventory();
  const [selectedPartId, setSelectedPartId] = useState<string>(spareparts[0]?.id || '');
  const [labelSize, setLabelSize] = useState<'50x30' | '70x40' | 'grid'>('50x30');
  const [isGenerating, setIsGenerating] = useState(false);

  const printContainerRef = useRef<HTMLDivElement>(null);
  const selectedPart = spareparts.find((p) => p.id === selectedPartId) || spareparts[0];

  const handleDownloadPDF = async () => {
    if (!printContainerRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(printContainerRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: labelSize === '70x40' ? [70, 40] : [50, 30]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, labelSize === '70x40' ? 70 : 50, labelSize === '70x40' ? 40 : 30);
      pdf.save(`Label_Thermal_${selectedPart?.sku || 'QR'}.pdf`);
    } catch (err) {
      console.error('Failed generating label PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Cetak Label QR Code Thermal</h1>
        <p className="text-sm text-slate-400 mt-1">
          Generator label stiker thermal 2D QR Code untuk tempelan rak gudang dan kemasan sparepart.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Pilih Item Sparepart
            </label>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
            >
              {spareparts.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  [{sp.sku}] {sp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Preset Ukuran Stiker Thermal
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setLabelSize('50x30')}
                className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                  labelSize === '50x30'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-white font-bold">50mm x 30mm</div>
                  <div className="text-[10px] opacity-70">Stiker Thermal Standar Rak</div>
                </div>
                {labelSize === '50x30' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                type="button"
                onClick={() => setLabelSize('70x40')}
                className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                  labelSize === '70x40'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-white font-bold">70mm x 40mm</div>
                  <div className="text-[10px] opacity-70">Stiker Thermal Medium / Kotak Kertas</div>
                </div>
                {labelSize === '70x40' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating || !selectedPart}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Memproses PDF...' : 'Unduh Dokumen PDF Thermal'}</span>
          </button>
        </div>

        {/* Live Label Preview Panel */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[350px]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Live Thermal Label Layout Preview ({labelSize === '70x40' ? '70x40mm' : '50x30mm'})
          </span>

          {selectedPart ? (
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-2xl flex items-center justify-center">
              {/* Printable White Thermal Sticker Surface */}
              <div
                ref={printContainerRef}
                className="bg-white text-slate-950 p-3 rounded shadow-md border border-slate-300 flex items-center gap-3 select-none"
                style={{
                  width: labelSize === '70x40' ? '350px' : '300px',
                  height: labelSize === '70x40' ? '200px' : '170px'
                }}
              >
                {/* QR Code Graphic */}
                <div className="bg-white p-1 rounded border border-slate-200 shrink-0">
                  <QRCodeSVG value={selectedPart.sku} size={labelSize === '70x40' ? 110 : 85} level="H" />
                </div>

                {/* Text Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                  <div>
                    <span className="font-mono text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded">
                      SSES T2
                    </span>
                    <div className="font-mono font-extrabold text-xs text-black mt-1 leading-tight tracking-tight">
                      {selectedPart.sku}
                    </div>
                    <div className="font-bold text-[11px] text-slate-900 line-clamp-2 leading-tight mt-0.5">
                      {selectedPart.name}
                    </div>
                  </div>

                  <div className="border-t border-slate-300 pt-1 text-[9px] text-slate-800 space-y-0.5 font-semibold">
                    <div className="flex items-center justify-between">
                      <span>Lokasi Rak:</span>
                      <span className="font-mono font-bold text-black">{selectedPart.location_rack}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mesin:</span>
                      <span className="truncate max-w-[110px]">{selectedPart.equipment_type_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Pilih sparepart untuk melihat preview label.</p>
          )}

          <p className="text-[11px] text-slate-400 mt-4 text-center">
            * Layout disesuaikan dengan standar printer thermal Bluetooth/USB (Zebra, Xprinter, Honeywell).
          </p>
        </div>
      </div>
    </div>
  );
};
