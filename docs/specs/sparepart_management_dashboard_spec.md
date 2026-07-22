# Specification: Dashboard Manajemen Sparepart (Physical Quantity & Stock Health Focus)

## 1. Problem Statement & Executive Summary
Pengguna meminta untuk menghapus seluruh elemen bernilai finansial, harga, modal, penghematan, dan valuasi rupiah. Dashboard Manajemen Sparepart kini berfokus murni pada **Analisis Kuantitas Fisik & Kesehatan Stok Sparepart**:
- Rotasi Fisik & Volume Konsumsi Sparepart (Klasifikasi ABC berbasis Frekuensi/Volume Pemakaian).
- Volume Pergerakan Masuk (Inflow) vs Pemakaian (Outflow) Fisik (Unit).
- Manajemen Peringatan Reorder Point, Safety Stock Buffer, dan Lead Time Pemasok.
- Distribusi & Perputaran Fisik menurut Kategori Peralatan & Lokasi Rak.

## 2. User Stories
- **Sebagai Petugas Logistik / Gudang**, saya ingin memantau stok fisik aktual (Baru vs Bekas Rotable) dan mengidentifikasi barang mana yang kritis menyentuh batas Minimum Stock.
- **Sebagai Manager Sparepart**, saya ingin melihat klasifikasi Fast-Moving, Medium-Moving, dan Slow/Dead Stock berdasarkan **volume frekuensi pemakaian (unit)** tanpa perhitungan mata uang.
- **Sebagai Technical Planner**, saya ingin melihat rekomendasi kuantitas pemesanan ulang (unit reorder) serta lead time pemasok untuk mencegah stockout unit peralatan.

## 3. Architecture, Interfaces & Data Models

### 3.1 Data Model (Physical Sparepart Management Metrics)
```typescript
export interface SparepartPhysicalMetrics {
  totalSKU: number;                    // Total variasi SKU sparepart
  totalPhysicalStock: number;          // Total unit fisik (stok_aktual + stok_bekas)
  totalNewStock: number;               // Total unit stok baru
  totalUsedStock: number;              // Total unit stok bekas (rotable)
  criticalReorderSKU: number;          // Jumlah SKU <= Minimum Stock
  warningReorderSKU: number;           // Jumlah SKU <= Safety Stock (1.5x Min Stock)
  abcPhysicalClassification: {
    categoryA: { count: number; totalVolume: number; percentage: number }; // Fast Moving (Top 80% volume)
    categoryB: { count: number; totalVolume: number; percentage: number }; // Medium Moving (Next 15% volume)
    categoryC: { count: number; totalVolume: number; percentage: number }; // Slow / Dead Stock (Bottom 5%)
  };
  monthlyPhysicalTrend: Array<{
    month: string;
    inflowUnit: number;                // Barang masuk (Unit)
    outflowUnit: number;               // Barang keluar/pakai (Unit)
    netStockChange: number;            // Selisih bersih (Unit)
  }>;
  categoryPhysicalBreakdown: Array<{
    categoryName: string;
    itemCount: number;
    totalNewStock: number;
    totalUsedStock: number;
    rotationRatio: number;
  }>;
  reorderPriorityList: Array<{
    id: string;
    sku: string;
    name: string;
    categoryName: string;
    stokAktual: number;
    stokBekas: number;
    minimumStok: number;
    safetyStok: number;
    suggestedReorderQty: number;
    supplierType: 'LOKAL' | 'IMPOR';
    estimatedLeadTimeDays: number;
    urgency: 'CRITICAL' | 'WARNING' | 'HEALTHY';
    locationRack: string;
  }>;
}
```

### 3.2 UI Component Architecture
1. **Header & Control Bar**:
   - Filter Kategori Sparepart (Elektrik, Mekanik, Pneumatik, Rotable, Consumable, Semua)
   - Filter Lokasi Rak Gudang (Rak A, B, C, D, E, Semua)
   - Filter Periode Waktu (3 Bulan, 6 Bulan, 1 Tahun)
   - Action Buttons: `Ekspor Excel (Kuantitas)`, `Ekspor PDF Report`

2. **KPI Physical Stock Cards**:
   - **Total Active SKU & Physical Stock** (Spesifikasi Unit Baru vs Bekas Rotable)
   - **Status Reorder & Safety Alerts** (SKU Kritis vs Warning)
   - **Rata-rata Tingkat Rotasi Fisik** (Turnover Unit / Tahun)
   - **Fast-Moving SKU Ratio** (% SKU dalam kategori A)

3. **Charts & Analytics Panel (Visualisasi Tanpa Mata Uang)**:
   - **Donut Chart & Matrix ABC Volume Pemakaian**: Klasifikasi Fast Moving, Medium Moving, & Slow/Dead Stock berdasarkan kuantitas fisik yang dipakai.
   - **Bar Chart Tren Volume Inflow vs Outflow**: Jumlah unit masuk vs unit terpakai per bulan.
   - **Bar Chart Distribusi Unit Fisik per Kategori Sparepart**.

4. **Tabel Prioritas Reorder & Safety Stock**:
   - Tabel aksi prioritas order kuantitas fisik (`suggestedReorderQty` Unit), Lead Time Pemasok, Kategori, & Lokasi Rak.

## 4. Verification & Test Strategy
- **Unit & Integration Verification**: Memory computation test, filtering test, physical volume aggregation.
- **Build Verification**: `npm run build` dengan Vite + TypeScript compiler check.
