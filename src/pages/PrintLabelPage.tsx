import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Printer, Download, QrCode, Layers, MapPin, Boxes, Check, LayoutGrid, FileText } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export interface LabelPreset {
  id: string;
  name: string;
  category: 'thermal' | 'tom_jerry';
  widthMm: number;
  heightMm: number;
  description: string;
  gridCols?: number;
  gridRows?: number;
  countPerSheet?: number;
}

export const LABEL_PRESETS: LabelPreset[] = [
  {
    id: '50x30',
    name: 'Thermal 50x30mm',
    category: 'thermal',
    widthMm: 50,
    heightMm: 30,
    description: 'Stiker Thermal Standar Rak'
  },
  {
    id: '70x40',
    name: 'Thermal 70x40mm',
    category: 'thermal',
    widthMm: 70,
    heightMm: 40,
    description: 'Stiker Thermal Medium / Dus'
  },
  {
    id: 'tj-103',
    name: 'Tom & Jerry No. 103 (32x64mm)',
    category: 'tom_jerry',
    widthMm: 64,
    heightMm: 32,
    description: '12 label per lembar (3 kolom x 4 baris)',
    gridCols: 3,
    gridRows: 4,
    countPerSheet: 12
  },
  {
    id: 'tj-108',
    name: 'Tom & Jerry No. 108 (18x38mm)',
    category: 'tom_jerry',
    widthMm: 38,
    heightMm: 18,
    description: '40 label per lembar (5 kolom x 8 baris)',
    gridCols: 5,
    gridRows: 8,
    countPerSheet: 40
  },
  {
    id: 'tj-121',
    name: 'Tom & Jerry No. 121 (38x75mm)',
    category: 'tom_jerry',
    widthMm: 75,
    heightMm: 38,
    description: '10 label per lembar (2 kolom x 5 baris)',
    gridCols: 2,
    gridRows: 5,
    countPerSheet: 10
  },
  {
    id: 'tj-107',
    name: 'Tom & Jerry No. 107 (18x50mm)',
    category: 'tom_jerry',
    widthMm: 50,
    heightMm: 18,
    description: '30 label per lembar (5 kolom x 6 baris)',
    gridCols: 5,
    gridRows: 6,
    countPerSheet: 30
  }
];

export const PrintLabelPage: React.FC = () => {
  const { spareparts, mutations } = useInventory();
  const [selectedPartId, setSelectedPartId] = useState<string>(spareparts[0]?.id || '');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('50x30');
  const [printMode, setPrintMode] = useState<'single' | 'sheet'>('single');
  const [isGenerating, setIsGenerating] = useState(false);

  const printContainerRef = useRef<HTMLDivElement>(null);
  const selectedPart = spareparts.find((p) => p.id === selectedPartId) || spareparts[0];
  const activePreset = LABEL_PRESETS.find((p) => p.id === selectedPresetId) || LABEL_PRESETS[0];
  const latestSumber = mutations.find((m) => m.sparepart_id === selectedPart?.id && m.sumber)?.sumber || 'VENDOR';

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

      if (printMode === 'single') {
        const pdf = new jsPDF({
          orientation: activePreset.widthMm >= activePreset.heightMm ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [activePreset.widthMm, activePreset.heightMm]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, activePreset.widthMm, activePreset.heightMm);
        pdf.save(`Label_${activePreset.id}_${selectedPart?.sku || 'QR'}.pdf`);
      } else {
        // Sheet Grid Mode (A4 Sheet layout)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        pdf.save(`Label_Lembar_${activePreset.id}_${selectedPart?.sku || 'QR'}.pdf`);
      }
    } catch (err) {
      console.error('Failed generating label PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper render single label item
  const renderSingleStickerContent = (isCompact: boolean = false) => (
    <div
      className="bg-white text-slate-950 rounded shadow-md border-2 border-slate-400 select-none overflow-hidden flex flex-col justify-between"
      style={{
        width: '100%',
        height: '100%',
        padding: isCompact ? '4px 6px' : '8px 10px',
      }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b-2 border-slate-950 pb-0.5">
        <span className="font-mono text-[9px] font-black bg-black text-white px-1 rounded tracking-wide">
          SSES T2
        </span>
        <span className="font-mono font-black text-xs text-black tracking-tight">
          {selectedPart.sku}
        </span>
      </div>

      {/* Main Content: QR Code + Text */}
      <div className="flex items-center gap-2 my-auto py-0.5">
        {/* QR Code */}
        <div className="shrink-0 bg-white border border-slate-900 rounded p-0.5 flex items-center justify-center">
          <QRCodeSVG
            value={`https://masih-berapa.vercel.app/?sku=${selectedPart.sku}`}
            size={isCompact ? 45 : 75}
            level="H"
          />
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
          <div>
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none">
              Sparepart
            </div>
            <div className="font-black text-xs text-black leading-tight line-clamp-2">
              {selectedPart.name}
            </div>
          </div>

          <div className="border-t border-slate-300 pt-0.5 space-y-0.5 text-[9px]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Tipe:</span>
              <span className="font-bold text-black truncate max-w-[90px] text-right">
                {selectedPart.equipment_type_name || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Sumber:</span>
              <span className="font-bold text-black uppercase bg-slate-100 px-1 py-0.2 rounded border border-slate-300 text-[8.5px]">
                {latestSumber}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Cetak Label Sparepart</h1>
        <p className="text-sm text-slate-400 mt-1">
          Generator label stiker thermal & kertas label Tom & Jerry berbagai ukuran untuk tempelan rak gudang dan kemasan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          {/* Sparepart Picker */}
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

          {/* Mode Cetak (Single vs Lembar Grid) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mode Output Cetak
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrintMode('single')}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  printMode === 'single'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Single Label</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('sheet')}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  printMode === 'sheet'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lembar Grid</span>
              </button>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Pilih Template Kertas / Label
            </label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {/* Category 1: Thermal Direct */}
              <div>
                <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block mb-1.5">
                  🏷️ Printer Thermal Direct
                </span>
                <div className="space-y-2">
                  {LABEL_PRESETS.filter((p) => p.category === 'thermal').map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                        selectedPresetId === preset.id
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="text-white font-bold">{preset.name}</div>
                        <div className="text-[10px] opacity-70">{preset.description}</div>
                      </div>
                      {selectedPresetId === preset.id && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 2: Tom & Jerry */}
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block mb-1.5">
                  📦 Kertas Stiker Tom & Jerry
                </span>
                <div className="space-y-2">
                  {LABEL_PRESETS.filter((p) => p.category === 'tom_jerry').map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                        selectedPresetId === preset.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="text-white font-bold">{preset.name}</div>
                        <div className="text-[10px] opacity-70">{preset.description}</div>
                      </div>
                      {selectedPresetId === preset.id && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating || !selectedPart}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Memproses PDF...' : `Unduh PDF (${printMode === 'sheet' ? 'Lembar Grid' : 'Single Label'})`}</span>
          </button>
        </div>

        {/* Live Preview Panel */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[350px] overflow-hidden">
          <div className="flex items-center justify-between w-full mb-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Preview Layout: {activePreset.name} ({printMode === 'sheet' ? 'Mode Lembar Grid' : 'Mode Single Label'})
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
              {activePreset.widthMm}mm x {activePreset.heightMm}mm
            </span>
          </div>

          {selectedPart ? (
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-2xl flex items-center justify-center max-w-full overflow-auto">
              <div
                ref={printContainerRef}
                className="bg-white text-slate-950 rounded shadow-md border-2 border-slate-300 select-none overflow-hidden"
                style={
                  printMode === 'sheet'
                    ? {
                        width: '595px', // A4 width proportion
                        height: '842px', // A4 height proportion
                        padding: '16px',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${activePreset.gridCols || 3}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${activePreset.gridRows || 4}, minmax(0, 1fr))`,
                        gap: '8px'
                      }
                    : {
                        width: `${Math.min(activePreset.widthMm * 5, 340)}px`,
                        height: `${Math.min(activePreset.heightMm * 5, 200)}px`,
                      }
                }
              >
                {printMode === 'single' ? (
                  renderSingleStickerContent(activePreset.heightMm <= 20)
                ) : (
                  Array.from({ length: activePreset.countPerSheet || 12 }).map((_, idx) => (
                    <div key={idx} className="w-full h-full overflow-hidden">
                      {renderSingleStickerContent(true)}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Pilih sparepart untuk melihat preview label.</p>
          )}

          <p className="text-[11px] text-slate-400 mt-4 text-center">
            * Layout Tom & Jerry disesuaikan dengan standar lembar cetak stiker printer USB/Inkjet/Laser & Printer Thermal.
          </p>
        </div>
      </div>
    </div>
  );
};
