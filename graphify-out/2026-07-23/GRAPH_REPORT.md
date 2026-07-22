# Graph Report - masih-berapa  (2026-07-23)

## Corpus Check
- 48 files · ~24,294 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 282 nodes · 426 edges · 26 communities (17 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e8ef05e7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- InventoryContext.tsx
- compilerOptions
- App.tsx
- devDependencies
- Task Dependency Hierarchy
- SettingsPage.tsx
- Technical Specification: SSES T2 Sparepart Management - "Masih Berapa" (v1.0.0)
- Technical Specification: SSES T2 Sparepart Management - "Masih Berapa" (v1.0.0)
- Specification: Dashboard Manajemen Sparepart (Financial & Inventory Health Focus)
- graphify.md
- idea-orchestrator.md
- code-review.md
- graphify.md
- idea-orchestrator.md
- implement.md
- to-spec.md
- to-ticket.md
- Project Handoff Document: SSES T2 Sparepart Management ("Masih Berapa")
- Implementation Tickets: Dashboard Manajemen Sparepart
- handoff.md
- mockSeedData.ts
- to-spec.md
- to-ticket.md
- NotificationContext.tsx

## God Nodes (most connected - your core abstractions)
1. `useInventory()` - 25 edges
2. `compilerOptions` - 18 edges
3. `InventoryContextType` - 17 edges
4. `Task Dependency Hierarchy` - 13 edges
5. `DashboardPage()` - 10 edges
6. `Sparepart` - 8 edges
7. `Project Handoff Document: SSES T2 Sparepart Management ("Masih Berapa")` - 8 edges
8. `Technical Specification: Schema Alignment & Multi-Compatibility Support` - 8 edges
9. `SSES T2 Sparepart Management ("Masih Berapa") 🛠️📦` - 7 edges
10. `MutationType` - 6 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --references--> `jspdf`  [EXTRACTED]
  src/pages/DashboardPage.tsx → package.json
- `PrintLabelPage()` --references--> `jspdf`  [EXTRACTED]
  src/pages/PrintLabelPage.tsx → package.json
- `DashboardPage()` --references--> `xlsx`  [EXTRACTED]
  src/pages/DashboardPage.tsx → package.json
- `HistoryPage()` --references--> `xlsx`  [EXTRACTED]
  src/pages/HistoryPage.tsx → package.json
- `PredictiveNeedsPage()` --references--> `xlsx`  [EXTRACTED]
  src/pages/PredictiveNeedsPage.tsx → package.json

## Import Cycles
- None detected.

## Communities (26 total, 9 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, clsx, core-js, html2canvas, html5-qrcode, jspdf, lucide-react, motion (+21 more)

### Community 1 - "InventoryContext.tsx"
Cohesion: 0.16
Nodes (20): ABCAnalysisChart(), ABCAnalysisChartProps, PhysicalMovementChart(), PhysicalMovementChartProps, ReorderPriorityTable(), ReorderPriorityTableProps, SparepartMetricsCards(), SparepartMetricsCardsProps (+12 more)

### Community 2 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+15 more)

### Community 3 - "App.tsx"
Cohesion: 0.13
Nodes (18): xlsx, AppLayout(), HeaderStats(), HeaderStatsProps, Sidebar(), SidebarProps, useInventory(), CatalogPage() (+10 more)

### Community 4 - "devDependencies"
Cohesion: 0.07
Nodes (29): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @tailwindcss/vite, @types/node, @types/react (+21 more)

### Community 5 - "Task Dependency Hierarchy"
Cohesion: 0.13
Nodes (14): Development Tickets: SSES T2 Sparepart Management - "Masih Berapa", Task Dependency Hierarchy, [TICKET-10]: Predictive Alerts (MTBF) & Demand Planning (`/alerts`, `/needs`), [TICKET-11]: Inventory Analytics & Cost Valuation (`/reports`), [TICKET-12]: System Settings, Supabase Config & Database Seed (`/settings`), [TICKET-1]: Project Scaffold & Tech Stack Setup, [TICKET-2]: Data Types & Supabase Database Layer, [TICKET-3]: App Layout, Sidebar & Toast Notification Context (+6 more)

### Community 6 - "SettingsPage.tsx"
Cohesion: 0.21
Nodes (16): INITIAL_JADWAL_SHIFT, INITIAL_JENIS_PERALATAN, INITIAL_LOKASI, INITIAL_MASTER_CONFIGS, INITIAL_MUTATIONS, INITIAL_PENEMPATAN_PERALATAN, INITIAL_PERSONEL, INITIAL_SPAREPART_COMPATIBILITY (+8 more)

### Community 7 - "Technical Specification: SSES T2 Sparepart Management - "Masih Berapa" (v1.0.0)"
Cohesion: 0.20
Nodes (9): 🗄️ Database Schema & Supabase, 📌 Features & Key Modules, 🚀 Getting Started, Installation, 📄 License, Prerequisites, 📂 Project Structure, SSES T2 Sparepart Management ("Masih Berapa") 🛠️📦 (+1 more)

### Community 8 - "Technical Specification: SSES T2 Sparepart Management - "Masih Berapa" (v1.0.0)"
Cohesion: 0.22
Nodes (8): 1. Overview & Objectives, 2.1 Database Schema (Supabase PostgreSQL), 2.2 Application State & Context Architecture, 2. Architecture & Data Model, 3. Detailed Route & Feature Modules, 4. Verification & Testing Boundaries, Core Goals, Technical Specification: SSES T2 Sparepart Management - "Masih Berapa" (v1.0.0)

### Community 9 - "Specification: Dashboard Manajemen Sparepart (Financial & Inventory Health Focus)"
Cohesion: 0.22
Nodes (8): 1. Executive Summary, 2. Technical Stack & Architecture, 3. Completed Modules & Features, 4. Key Project Files Summary, 5. Empirical Verification Status, 6. Actionable Next Steps (Backlog for Next Session), 7. How to Resume Work, Project Handoff Document: SSES T2 Sparepart Management ("Masih Berapa")

### Community 10 - "graphify.md"
Cohesion: 0.22
Nodes (8): 1. Overview & Objective, 2. User Stories & Capabilities, 3. Architecture & Technical Design, 4. Edge Cases & Error Handling, 5. Non-Functional Requirements, 6. Verification & Test Strategy, 7. Out of Scope, Technical Specification: Schema Alignment & Multi-Compatibility Support

### Community 11 - "idea-orchestrator.md"
Cohesion: 0.25
Nodes (7): 1. Problem Statement & Executive Summary, 2. User Stories, 3.1 Data Model (Physical Sparepart Management Metrics), 3.2 UI Component Architecture, 3. Architecture, Interfaces & Data Models, 4. Verification & Test Strategy, Specification: Dashboard Manajemen Sparepart (Physical Quantity & Stock Health Focus)

### Community 12 - "code-review.md"
Cohesion: 0.29
Nodes (6): Dependency Map, [TICKET-1]: Data Models, Seed Data & Supabase 13-Table Client Alignment, [TICKET-2]: Inventory Context & State Management Update, [TICKET-3]: UI Components & Forms Alignment, [TICKET-4]: Build & Knowledge Graph Empirical Verification, Ticket Decomposition: Schema Alignment & Multi-Compatibility Support

### Community 13 - "graphify.md"
Cohesion: 0.40
Nodes (4): Implementation Tickets: Dashboard Manajemen Sparepart (Non-Finansial & Physical Focus), Ticket 1: Physical Sparepart Analytics Engine Refactoring, Ticket 2: Non-Financial Dashboard Components Update, Ticket 3: Export Report Clean-up & Build Verification

### Community 22 - "mockSeedData.ts"
Cohesion: 0.20
Nodes (21): InventoryContext, InventoryContextType, OnDutyPersonel, AnnualNeed, JadwalShift, JenisPeralatan, Lokasi, MasterConfig (+13 more)

### Community 25 - "NotificationContext.tsx"
Cohesion: 0.25
Nodes (7): InventoryProvider(), NotificationContext, NotificationContextType, NotificationProvider(), ToastMessage, ToastType, useNotification()

## Knowledge Gaps
- **121 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+116 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `App.tsx`, `devDependencies`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **Why does `xlsx` connect `App.tsx` to `dependencies`, `InventoryContext.tsx`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `DashboardPage()` connect `InventoryContext.tsx` to `dependencies`, `App.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _121 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1310344827586207 - nodes in this community are weakly interconnected._