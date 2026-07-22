# Implementation Tickets: Dashboard Manajemen Sparepart (Non-Finansial & Physical Focus)

## Ticket 1: Physical Sparepart Analytics Engine Refactoring
- **Goal**: Perbarui `src/lib/sparepartAnalytics.ts` untuk menghapus seluruh formula bernilai Rupiah/harga (`unit_price`, `totalValuation`, `estimatedCost`). Ubah kalkulasi ABC Analysis menjadi berbasis **Volume Pemakaian Fisik (Unit)**. Ubah tren bulanan menjadi **Volume Unit Inflow vs Outflow**.
- **Files**: `src/lib/sparepartAnalytics.ts`
- **Verification**: Verify computation logic without any currency attributes.

## Ticket 2: Non-Financial Dashboard Components Update
- **Goal**: Perbarui seluruh komponen dashboard (`SparepartMetricsCards.tsx`, `ABCAnalysisChart.tsx`, `FinancialTrendChart.tsx` -> `PhysicalMovementChart.tsx`, `ReorderPriorityTable.tsx`) untuk menampilkan kuantitas unit, rotasi fisik, status stok, dan lead time tanpa elemen harga/anggaran/Rupiah.
- **Files**:
  - `src/components/dashboard/SparepartMetricsCards.tsx`
  - `src/components/dashboard/ABCAnalysisChart.tsx`
  - `src/components/dashboard/PhysicalMovementChart.tsx`
  - `src/components/dashboard/ReorderPriorityTable.tsx`
  - `src/pages/DashboardPage.tsx`
- **Verification**: UI rendering check, interactive filters test.

## Ticket 3: Export Report Clean-up & Build Verification
- **Goal**: Bersihkan fungsi ekspor PDF & Excel pada `DashboardPage.tsx` dari kolom bernilai harga/valuasi. Jalankan `npm run build` untuk memastikan build produksi bersih dari type error.
- **Files**: `src/pages/DashboardPage.tsx`
- **Verification**: `npm run build` zero-error verification.
