# Technical Specification: Schema Alignment & Multi-Compatibility Support

## 1. Overview & Objective
- **Problem Statement**: The application needs to strictly align with the user's 13-table Supabase PostgreSQL database schema (`jenis_peralatan`, `tipe_peralatan`, `lokasi`, `titik_lokasi`, `penempatan_peralatan`, `unit_kerja`, `personel`, `jadwal_shift`, `master_configs`, `unit_peralatan`, `spareparts`, `stock_mutations`, `sparepart_compatibility`). Specifically:
  1. `stock_mutations.mutation_type` must strictly use exact PostgreSQL values: `'Masuk'`, `'Pakai'`, `'Bekas'`, `'Rusak'`.
  2. Multi-equipment type compatibility (`sparepart_compatibility` junction table) must be fully supported in state management, seed data, catalog views, and edit modals.
  3. `mockSeedData.ts` and the 1-Click Supabase Seed tool must seed all 13 tables accurately.
- **Goal**: Full 100% data contract alignment between React state, local storage, mock seed data, Supabase client queries, and Supabase SQL DB schema.

## 2. User Stories & Capabilities
- **US-1**: As a technician, when I create or view a stock mutation, I see and record mutation types matching the database constraints (`Masuk`, `Pakai`, `Bekas`, `Rusak`) without data conversion errors.
- **US-2**: As an inventory manager, when editing a sparepart in the catalog, I can associate it with multiple compatible equipment types (`tipe_peralatan`) and mark a primary compatibility via `sparepart_compatibility`.
- **US-3**: As an administrator, when I click "1-Click Seed Supabase Database", all 13 tables (including `sparepart_compatibility`) are seeded seamlessly into Supabase without SQL constraint violations.

## 3. Architecture & Technical Design
- **Types (`src/types/index.ts`)**:
  - `MutationType = 'Masuk' | 'Pakai' | 'Bekas' | 'Rusak'`.
  - Update `Sparepart` and `StockMutation` models to use exact schema constraint fields.
  - Ensure `SparepartCompatibility` is fully typed (`id`, `sparepart_id`, `id_tipe`, `is_primary`, `created_at`).
- **Seed Data (`src/data/mockSeedData.ts`)**:
  - Update `INITIAL_MUTATIONS` to use `'Masuk'`, `'Pakai'`, `'Bekas'`, `'Rusak'`.
  - Add `INITIAL_SPAREPART_COMPATIBILITY` mock records for all sample spareparts.
- **Supabase Client (`src/lib/supabase.ts`)**:
  - Include `sparepart_compatibility` table in `seedSupabaseDatabase()`.
- **Context (`src/context/InventoryContext.tsx`)**:
  - Fetch `sparepart_compatibility` table from Supabase.
  - Provide CRUD operations for compatibility mappings.
  - Sync stock mutations with exact `'Masuk'`, `'Pakai'`, `'Bekas'`, `'Rusak'` values and update stock counts correctly (`Masuk` -> +stok_aktual, `Pakai` -> -stok_aktual & +stok_bekas, `Bekas` -> +stok_bekas, `Rusak` -> -stok_bekas).
- **UI Components**:
  - Update `CatalogPage.tsx`, `InputSparepartPage.tsx`, `HistoryPage.tsx`, `DashboardPage.tsx`, `ReportsPage.tsx`, `NeedsPage.tsx`, `AlertsPage.tsx`, and `ScannerPage.tsx` to handle the updated `MutationType` and compatibility badges.

## 4. Edge Cases & Error Handling
- Nullable fields in schema (`catatan`, `foto_url`, `ampere`, `varian`, `no_hp`, `jabatan`, `urutan`) handled gracefully with fallbacks.
- Supabase offline mode falls back smoothly to `localStorage` populated with updated `mockSeedData`.
- Duplicate SKU or unique constraint errors in `spareparts`, `jenis_peralatan`, `tipe_peralatan`, `lokasi`, `unit_kerja`, `personel` handled with user-friendly toast messages.

## 5. Non-Functional Requirements
- TypeScript strict mode compliance with 0 build errors (`npm run build`).
- Responsive UI across desktop and mobile PWA scanners.

## 6. Verification & Test Strategy
- **Build Verification**: `npm run build` exit code 0.
- **Knowledge Graph**: `graphify update .` sync.
- **Manual Verification**: Test catalog filtering, sparepart multi-compatibility assignment, stock mutation creation, and 1-Click seed tool.

## 7. Out of Scope
- Altering existing Supabase table definitions (we adapt the frontend application to fit the user's existing DB schema).
