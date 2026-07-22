# Technical Specification: SSES T2 Sparepart Management - "Masih Berapa" (v1.0.0)

## 1. Overview & Objectives
**System Name**: SSES T2 Sparepart Management ("Masih Berapa")  
**Target Platform**: Progressive Web App (PWA) / Desktop & Mobile Web  
**Primary Tech Stack**: React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Lucide React + Recharts + Motion + Supabase Client (`@supabase/supabase-js`) + `html5-qrcode` + `qrcode.react` + `jspdf` + `html2canvas` + `xlsx`.

### Core Goals
1. **Digital Inventory & QR Code Tracking**: Enable quick inventory lookup and stock updates via mobile camera scanning.
2. **Rotable Asset Management**: Support distinct tracking for new stock (`stok_aktual`) vs reusable refurbished stock (`stok_bekas`).
3. **Predictive Maintenance & Demand Planning**: Calculate MTBF remaining lifespan days (`/alerts`) and generate annual demand replenishment forecasts (`/needs`).
4. **Thermal Label Generation**: Produce PDF printouts formatted for thermal sticker printers (50x30mm, 70x40mm, grid layout).
5. **Direct Supabase Integration**: Connect to Supabase PostgreSQL database for persistent cloud storage.

---

## 2. Architecture & Data Model

### 2.1 Database Schema (Supabase PostgreSQL)

```sql
-- Equipment Types & Categories
CREATE TABLE IF NOT EXISTS equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sparepart Master Catalog
CREATE TABLE IF NOT EXISTS spareparts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  equipment_type_id UUID REFERENCES equipment_types(id),
  unit TEXT NOT NULL DEFAULT 'PCS',
  stok_aktual INT NOT NULL DEFAULT 0,
  stok_bekas INT NOT NULL DEFAULT 0,
  minimum_stok INT NOT NULL DEFAULT 5,
  location_rack TEXT NOT NULL,
  supplier_type TEXT CHECK (supplier_type IN ('LOKAL', 'IMPOR')),
  mtbf_days INT DEFAULT 365,
  last_replaced_at DATE DEFAULT CURRENT_DATE,
  unit_price NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Mutations & Log History
CREATE TABLE IF NOT EXISTS stock_mutations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sparepart_id UUID REFERENCES spareparts(id) ON DELETE CASCADE,
  mutation_type TEXT CHECK (mutation_type IN ('INBOUND', 'OUTBOUND', 'ROTABLE_RETURN', 'SCRAP')),
  qty INT NOT NULL,
  operator_name TEXT NOT NULL,
  reference_no TEXT, -- PO Number or Work Order ID
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Application State & Context Architecture
- **Supabase Context**: Manages client configuration, connection status, and database fallback/re-connect handlers.
- **Notification Context**: Global toast notification system for mutation alerts, scanner results, and error handling.
- **Router Layout**: React Router DOM v7 with a sleek dark-mode sidebar, header stats bar, responsive mobile drawer, and page routes.

---

## 3. Detailed Route & Feature Modules

| Route | Component / Module | Description & Key Functions |
| :--- | :--- | :--- |
| `/` | `DashboardPage` | KPI Stat cards, Recharts visualizations (Stock Distribution by Equipment, Inbound vs Outbound Trends), Critical Stock & Predictive Alerts shortcuts. |
| `/catalog` | `CatalogPage` | SKU master list with universal search, filters by Equipment Type & Supplier, Rotable stock indicators, modal for adding/editing spareparts. |
| `/input-sparepart` | `MutationPage` | Form for Inbound, Outbound, Rotable Return, and Scrap operations with instant stock recalculation & log entry. |
| `/history` | `HistoryPage` | Chronological mutation log with filter by date range & mutation type, plus Excel export via `xlsx`. |
| `/scanner` | `ScannerPage` | Integrated camera QR scanner (`html5-qrcode`) with real-time SKU lookup and quick mutation actions (Check out / Report Scrap / Rotable Return). |
| `/print` | `PrintLabelPage` | QR thermal label generator (`qrcode.react`), layout customizable to 50x30mm, 70x40mm, and grid layout, exported to PDF via `jspdf` & `html2canvas`. |
| `/alerts` | `PredictiveAlertsPage` | MTBF lifespan calculation: `remaining_days = mtbf_days - (current_date - last_replaced_at)`. Displays urgent replacement warnings. |
| `/needs` | `PredictiveNeedsPage` | Annual demand planner: `order_qty = forecast_annual_need - (stok_aktual + stok_bekas)`. Exportable to Excel `.xlsx`. |
| `/reports` | `ReportsPage` | Evaluates fast-moving vs slow-moving parts, total inventory valuation, and rotable recovery cost savings. |
| `/settings` | `SettingsPage` | Supabase URL & Anon Key config, Database Seed button (inject sample data into Supabase), Equipment Types master editor. |

---

## 4. Verification & Testing Boundaries

1. **Build & Type Cleanliness**: Clean compilation via `tsc` and Vite build without TypeScript errors.
2. **Database Integration**: Verification of Supabase connection & schema auto-initialization/seeding.
3. **QR Code Pipeline**: Verification of QR Code generation (`/print`) and camera scanning (`/scanner`).
4. **Export Cleanliness**: Excel `.xlsx` downloads from History and Predictive Needs pages, and PDF label output from Print page.
