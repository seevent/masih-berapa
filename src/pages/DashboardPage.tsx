import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  getFilteredSpareparts,
  calculateABCAnalysisPhysical,
  calculateCategoryPhysicalBreakdown,
  calculateMonthlyPhysicalTrend,
  getReorderPriorityListPhysical
} from '../lib/sparepartAnalytics';
import { SparepartMetricsCards } from '../components/dashboard/SparepartMetricsCards';
import { ABCAnalysisChart } from '../components/dashboard/ABCAnalysisChart';
import { PhysicalMovementChart } from '../components/dashboard/PhysicalMovementChart';
import { ReorderPriorityTable } from '../components/dashboard/ReorderPriorityTable';
import {
  FileSpreadsheet,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export const DashboardPage: React.FC = () => {
  const { spareparts, mutations, jenisPeralatan } = useInventory();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(12); // months
  const [selectedRack, setSelectedRack] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Filtered spareparts
  const filteredSpareparts = useMemo(() => {
    return getFilteredSpareparts(spareparts, {
      categoryFilter: selectedCategory,
      periodMonths: selectedPeriod,
      locationRackFilter: selectedRack
    });
  }, [spareparts, selectedCategory, selectedPeriod, selectedRack]);

  // Analytics Computations (Non-Financial Physical Quantities)
  const abcAnalysisData = useMemo(
    () => calculateABCAnalysisPhysical(filteredSpareparts, mutations),
    [filteredSpareparts, mutations]
  );

  const categoryBreakdownData = useMemo(
    () => calculateCategoryPhysicalBreakdown(filteredSpareparts, mutations),
    [filteredSpareparts, mutations]
  );

  const physicalTrendData = useMemo(
    () => calculateMonthlyPhysicalTrend(filteredSpareparts, mutations),
    [filteredSpareparts, mutations]
  );

  const reorderPriorityItems = useMemo(
    () => getReorderPriorityListPhysical(filteredSpareparts),
    [filteredSpareparts]
  );

  const totalNewStock = useMemo(
    () => filteredSpareparts.reduce((sum, item) => sum + item.stok_aktual, 0),
    [filteredSpareparts]
  );

  const totalUsedStock = useMemo(
    () => filteredSpareparts.reduce((sum, item) => sum + item.stok_bekas, 0),
    [filteredSpareparts]
  );

  // Unique Location Racks
  const availableRacks = useMemo(() => {
    const racks = Array.from(new Set(spareparts.map((p) => p.location_rack))).filter(Boolean);
    return racks;
  }, [spareparts]);

  // Export to Excel handler (Physical quantity focus)
  const handleExportExcel = () => {
    const dataToExport = filteredSpareparts.map((p) => {
      const abc = abcAnalysisData.items.find((i) => i.sparepart.id === p.id);
      return {
        'SKU': p.sku,
        'Nama Sparepart': p.name,
        'Kategori Peralatan': p.equipment_type_name || 'Umum',
        'Stok Baru (Unit)': p.stok_aktual,
        'Stok Bekas Rotable (Unit)': p.stok_bekas,
        'Total Stok Fisik (Unit)': p.stok_aktual + p.stok_bekas,
        'Minimum Stok (Unit)': p.minimum_stok,
        'Safety Stock (Unit)': Math.ceil(p.minimum_stok * 1.5),
        'Klasifikasi ABC (Rotasi Volume)': abc ? abc.categoryLabel : 'N/A',
        'Lokasi Rak': p.location_rack,
        'Tipe Supplier': p.supplier_type
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Analisis Sparepart');
    
    XLSX.writeFile(workbook, `Laporan_Analisis_Sparepart_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export to PDF handler
  const handleExportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById('dashboard-content');
    if (!element) {
      setIsExporting(false);
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#0f172a'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Dashboard_Analisis_Sparepart_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="dashboard-content" className="space-y-6 pb-12">
      {/* Top Header & Quick Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Physical Inventory Analytics
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight mt-2">
            Dashboard
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Monitoring kuantitas fisik, rotasi frekuensi pemakaian (Pareto ABC), dan prioritas reorder safety stock.
          </p>
        </div>

        {/* Action Buttons (Export PDF & Excel) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Data Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-semibold text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>{isExporting ? 'Generating PDF...' : 'Ekspor PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Control Filter Toolbar */}
      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-300 uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          <span>Filter Kontrol Stok:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto">
          {/* Kategori Equipment Filter */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex-1 sm:flex-none">
            <span className="text-slate-400 font-semibold">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">Semua Kategori</option>
              {jenisPeralatan.map((j) => (
                <option key={j.id} value={j.nama} className="bg-slate-900 text-white">
                  {j.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Lokasi Rak Filter */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex-1 sm:flex-none">
            <span className="text-slate-400 font-semibold">Lokasi & Rak:</span>
            <select
              value={selectedRack}
              onChange={(e) => setSelectedRack(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">Semua Rak</option>
              {availableRacks.map((rack) => (
                <option key={rack} value={rack} className="bg-slate-900 text-white">
                  {rack}
                </option>
              ))}
            </select>
          </div>

          {/* Periode Waktu Filter */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex-1 sm:flex-none">
            <span className="text-slate-400 font-semibold">Periode:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value={3} className="bg-slate-900 text-white">3 Bulan Terakhir</option>
              <option value={6} className="bg-slate-900 text-white">6 Bulan Terakhir</option>
              <option value={12} className="bg-slate-900 text-white">1 Tahun (YTD)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(selectedCategory !== 'ALL' || selectedRack !== 'ALL' || selectedPeriod !== 12) && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedRack('ALL');
                setSelectedPeriod(12);
              }}
              className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Physical Stock Summary Cards */}
      <SparepartMetricsCards
        totalSKU={filteredSpareparts.length}
        totalNewStock={totalNewStock}
        totalUsedStock={totalUsedStock}
        reorderItems={reorderPriorityItems}
        avgTurnoverRatio={3.8}
      />

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ABC Pareto Analysis (Physical Volume) */}
        <ABCAnalysisChart abcData={abcAnalysisData} />

        {/* Physical Unit Movement Trend & Category Distribution */}
        <PhysicalMovementChart
          physicalTrend={physicalTrendData}
          categoryBreakdown={categoryBreakdownData}
        />
      </div>

      {/* Reorder Point & Safety Stock Priority Table */}
      <ReorderPriorityTable reorderItems={reorderPriorityItems} />
    </div>
  );
};
