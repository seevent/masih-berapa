# Ticket Decomposition: Schema Alignment & Multi-Compatibility Support

## Dependency Map
- **TICKET-1**: Data Models, Seed Data & Supabase 13-Table Client Alignment
  └── **TICKET-2**: Inventory Context & State Management Update
      └── **TICKET-3**: UI Components & Forms Alignment
          └── **TICKET-4**: Build & Knowledge Graph Empirical Verification

---

### [TICKET-1]: Data Models, Seed Data & Supabase 13-Table Client Alignment
- **Target Files**: `src/types/index.ts`, `src/data/mockSeedData.ts`, `src/lib/supabase.ts`
- **Objective**: Align TypeScript interfaces, sample seed data, and Supabase client seeding logic with exact PostgreSQL schema definitions.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `MutationType` in `src/types/index.ts` defined as `'Masuk' | 'Pakai' | 'Bekas' | 'Rusak'`.
  - [ ] `SparepartCompatibility` interface and `INITIAL_SPAREPART_COMPATIBILITY` array defined and exported.
  - [ ] All 13 tables initialized in `mockSeedData.ts`.
  - [ ] `seedSupabaseDatabase()` in `src/lib/supabase.ts` seeds `sparepart_compatibility` alongside the other 12 tables.
- **Verification**: Code review & TypeScript typecheck.

---

### [TICKET-2]: Inventory Context & State Management Update
- **Target Files**: `src/context/InventoryContext.tsx`
- **Objective**: Extend `InventoryContext` to handle `sparepart_compatibility` table state, CRUD operations, and exact mutation type stock calculations.
- **Dependencies**: TICKET-1
- **Acceptance Criteria**:
  - [ ] `sparepartCompatibility` state loaded from Supabase / localStorage fallback.
  - [ ] `addMutation` calculates stock changes correctly (`Masuk` adds `stok_aktual`, `Pakai` subtracts `stok_aktual` and adds `stok_bekas`, `Bekas` adds `stok_bekas`, `Rusak` subtracts `stok_bekas`).
  - [ ] Compatibility helper functions (`getCompatibleTypesForSparepart`, `setSparepartCompatibility`) added to context.
- **Verification**: `npm run build` & context state inspection.

---

### [TICKET-3]: UI Components & Forms Alignment
- **Target Files**: `src/pages/InputSparepartPage.tsx`, `src/pages/CatalogPage.tsx`, `src/pages/HistoryPage.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/ReportsPage.tsx`, `src/pages/NeedsPage.tsx`, `src/pages/AlertsPage.tsx`, `src/pages/ScannerPage.tsx`, `src/pages/SettingsPage.tsx`
- **Objective**: Update UI pages, dropdowns, badge styles, and catalog modals to support multi-compatibility selection and exact mutation types (`Masuk`, `Pakai`, `Bekas`, `Rusak`).
- **Dependencies**: TICKET-2
- **Acceptance Criteria**:
  - [ ] Input Mutation page displays options `Masuk`, `Pakai`, `Bekas`, `Rusak` with clear Indonesian labels and color badges.
  - [ ] History page filters & tables display exact mutation types.
  - [ ] Catalog modal allows adding/editing multi-compatibility equipment types (`sparepart_compatibility`).
  - [ ] Scanner & Print pages work with updated mutation types.
- **Verification**: UI rendering & interactions.

---

### [TICKET-4]: Build & Knowledge Graph Empirical Verification
- **Target Files**: All modified code & `graphify-out`
- **Objective**: Run production bundle build, verify exit code 0, update Knowledge Graph.
- **Dependencies**: TICKET-3
- **Acceptance Criteria**:
  - [ ] `npm run build` exits with code 0.
  - [ ] `graphify update .` successfully updates knowledge graph.
- **Verification**: CLI command execution.
