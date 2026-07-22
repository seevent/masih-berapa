# Development Tickets: SSES T2 Sparepart Management - "Masih Berapa"

## Task Dependency Hierarchy
```
[TICKET-1: Project Scaffold & Dependencies]
       │
       ▼
[TICKET-2: Supabase Client, Types & Sample Seed Data]
       │
       ▼
[TICKET-3: Layout, Navigation Sidebar & Toast Context]
       │
       ├──► [TICKET-4: Dashboard & Recharts Visualizations]
       ├──► [TICKET-5: Sparepart Master Catalog Module]
       ├──► [TICKET-6: Mutation Form & Stock Calculations]
       ├──► [TICKET-7: Audit Log History & Excel Export]
       ├──► [TICKET-8: Mobile Camera QR Scanner & Quick Actions]
       ├──► [TICKET-9: Thermal Label Generator & PDF Printer]
       ├──► [TICKET-10: Predictive Alerts (MTBF) & Annual Needs Planner]
       ├──► [TICKET-11: Inventory Analytics & Valuation Reports]
       └──► [TICKET-12: System Settings, Supabase Config & Seed Trigger]
```

---

### [TICKET-1]: Project Scaffold & Tech Stack Setup
- **Goal**: Initialize Vite 6 + React 19 + TypeScript app with Tailwind CSS v4 and all required dependencies.
- **Dependencies**: None
- **Dependencies List**: `@supabase/supabase-js`, `lucide-react`, `recharts`, `motion`, `html5-qrcode`, `qrcode.react`, `jspdf`, `html2canvas`, `xlsx`, `react-router-dom`.
- **Verification**: `npm run build` succeeds cleanly without errors.

---

### [TICKET-2]: Data Types & Supabase Database Layer
- **Goal**: Define TypeScript interfaces (`Sparepart`, `EquipmentType`, `StockMutation`, `PredictiveAlert`, `AnnualNeed`) and Supabase client service module with built-in fallback/seed data helper.
- **Dependencies**: TICKET-1
- **Verification**: Type-check `npx tsc --noEmit` runs clean.

---

### [TICKET-3]: App Layout, Sidebar & Toast Notification Context
- **Goal**: Build modern sleek dark-mode layout with responsive desktop sidebar, mobile drawer navigation, top stats header bar, and global toast notifications.
- **Dependencies**: TICKET-2
- **Verification**: Routing between all 10 pages renders without layout breaks.

---

### [TICKET-4]: Dashboard Component & Visual Analytics (`/`)
- **Goal**: Build Dashboard with KPI Stat Cards (Total SKU, Total Physical Stock, Critical Stock Count, Rotable Count), Recharts graphs (Distribution by Equipment, Inbound vs Outbound Trends), and Quick Access Tables.
- **Dependencies**: TICKET-3
- **Verification**: Recharts graphs render dynamically with dark-mode styling.

---

### [TICKET-5]: Sparepart Master Catalog (`/catalog`)
- **Goal**: Build catalog table with universal search, Equipment & Supplier filters, Rotable stock breakdown, and Modal for Adding/Editing Sparepart items.
- **Dependencies**: TICKET-3
- **Verification**: Search & filters update catalog table state instantly. Adding/editing parts updates Supabase / local state.

---

### [TICKET-6]: Stock Mutation Form (`/input-sparepart`)
- **Goal**: Build Mutation input page supporting 4 transaction types: INBOUND, OUTBOUND, ROTABLE_RETURN, and SCRAP with auto-updating stock numbers and mutation log insertion.
- **Dependencies**: TICKET-5
- **Verification**: Outbound mutates `stok_aktual`, Rotable Return increases `stok_bekas`, Scrap reduces stock and updates status.

---

### [TICKET-7]: Audit Log History (`/history`)
- **Goal**: Build history log page displaying chronological mutation records, filterable by date range and type, with one-click Excel download (`xlsx`).
- **Dependencies**: TICKET-6
- **Verification**: Excel file downloads properly with accurate transaction columns.

---

### [TICKET-8]: Mobile Camera QR Scanner & Verification (`/scanner`)
- **Goal**: Integrate `html5-qrcode` camera scanner. Scanning a SKU QR code displays part details, rack location, and quick action buttons (Outbound, Scrap, Rotable Return).
- **Dependencies**: TICKET-6
- **Verification**: Camera scanner UI mounts, processes code, and triggers quick mutation actions.

---

### [TICKET-9]: Thermal Label Generator & PDF Print (`/print`)
- **Goal**: Build QR Thermal label generator using `qrcode.react`, supporting size presets (50x30mm, 70x40mm, grid layout) and exporting printable PDF via `jspdf` and `html2canvas`.
- **Dependencies**: TICKET-5
- **Verification**: PDF generates and downloads with clean thermal label formatting.

---

### [TICKET-10]: Predictive Alerts (MTBF) & Demand Planning (`/alerts`, `/needs`)
- **Goal**: Implement MTBF sisa usia pakai calculations on `/alerts` and Annual Demand Replenishment Planning calculation on `/needs` with Excel export.
- **Dependencies**: TICKET-5
- **Verification**: MTBF remaining days formula operates accurately; `/needs` Excel export generates forecast order quantities.

---

### [TICKET-11]: Inventory Analytics & Cost Valuation (`/reports`)
- **Goal**: Build Reports page evaluating Fast Moving vs Slow Moving items, Total Inventory Valuation ($/Rp), and Rotable Recovery Cost Savings.
- **Dependencies**: TICKET-4
- **Verification**: Valuation calculations & movement categories reflect catalog state.

---

### [TICKET-12]: System Settings, Supabase Config & Database Seed (`/settings`)
- **Goal**: Build Settings page for Supabase URL/Anon Key configuration, Equipment Types master management, and a 1-click "Seed Database" button to populate Supabase with initial industrial sparepart data.
- **Dependencies**: TICKET-2
- **Verification**: Seed button populates sample spareparts, equipment types, and mutation history into Supabase.
