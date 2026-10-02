# SSES T2 Sparepart Management ("Masih Berapa") 🛠️📦

A mobile-friendly web application for managing equipment, spareparts, inventory mutations, rotable assets, predictive maintenance, and annual demand planning for SSES T2.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06b6d4?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-v6-646cff?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Supported-3ecf8e?logo=supabase)

---

## 📌 Features & Key Modules

- 📊 **Dashboard & Visual Analytics**: Live KPI cards, 6-month stock trend reconstructed from real mutations, inventory level distribution, new vs. used stock ratio, top moving parts and recent transactions.
- 📦 **Sparepart Catalog**: Searchable and multi-filterable catalog with Grid / List view, automatic `SP-001` SKU numbering and multi-tipe compatibility (`sparepart_compatibility`).
- 🔄 **Transaction Mutations**: Instant logging for `Masuk` (Penerimaan), `Pakai` (Pemakaian Work Order), `Bekas` (Pengembalian Rotable), and `Rusak` (Afkir). Stock is never edited directly: it is always the sum of `stock_mutations`, and every transaction is validated against the latest stock in the database. Includes **6 Dynamic Source Options** (`IAS`, `SUP API`, `SISA PEKERJAAN`, `MANDIRI`, `DARI UNIT LAIN`, `VENDOR`) on incoming transactions.
- 📜 **Audit History Log & Management**: Full CRUD support to edit or delete mutation records with automatic real-time stock recalculation, search filters, and 1-click Excel (`.xlsx`) export.
- 📷 **Mobile QR Code Scanner**: Built-in camera barcode/QR scanner (`html5-qrcode`) for fast SKU lookups and on-the-spot inventory updates.
- 🏷️ **QR Label Generator**: Thermal labels (50x30mm & 70x40mm) and Tom & Jerry sticker sheets at true size, with QR code, `SKU`, `Nama Sparepart`, `Sumber`, `Tipe Peralatan`, and PDF download (`jspdf` & `html2canvas-pro`).
- ⚠️ **Predictive Maintenance Alerts**: MTBF lifespan tracking (`remaining_days = mtbf_days - (current_date - last_replaced_at)`), where `last_replaced_at` is automatically the latest `Pakai` transaction.
- 📈 **Annual Demand Planner**: `order_needed_qty = annual_forecast - (stok_aktual + stok_bekas)`, where the forecast is the real `Pakai` usage of the last 12 months (or `365 / MTBF × installed compatible units` when there is no history yet), with Excel export.
- ⚙️ **Master Data**: Add forms for `unit_peralatan`, `jenis_peralatan`, `tipe_peralatan`, `lokasi`, `titik_lokasi` and `personel`, read directly from Supabase.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion (Animations)
- **Icons & Visuals**: Lucide React, Recharts
- **Database & Cloud**: Supabase Client (`@supabase/supabase-js`), configured via `.env`
- **Scanner & QR**: `html5-qrcode`, `qrcode.react`
- **Document Export**: `xlsx` (Excel), `jspdf` & `html2canvas-pro` (PDF)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/seevent/masih-berapa.git
   cd masih-berapa
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   Then copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Type-check & build for production** (the build fails on TypeScript errors):
   ```bash
   npm run typecheck
   npm run build
   ```

---

## 📂 Project Structure

```
masih-berapa/
├── docs/                   # Technical specs & development tickets
├── src/
│   ├── components/         # Reusable UI & Modal components
│   ├── context/            # InventoryContext & Global State Manager
│   ├── lib/                # Supabase client (paginated fetch) & analytics helpers
│   ├── pages/              # Main Application Page Views
│   ├── types/              # TypeScript Interfaces & Database Schemas
│   ├── utils/              # Stock, compatibility & shift helpers
│   ├── App.tsx             # Main Router & Layout
│   └── main.tsx            # Application Entry Point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🗄️ Database Schema & Supabase

The app reads and writes a Supabase PostgreSQL database (see `docs/schema_relational_supabase.sql`):
`jenis_peralatan`, `tipe_peralatan`, `lokasi`, `titik_lokasi`, `unit_peralatan`, `penempatan_peralatan`, `unit_kerja`, `personel`, `jadwal_shift`, `master_configs`, `spareparts`, `stock_mutations`, `sparepart_compatibility`.

- `spareparts` stores no stock columns. Stock is derived from `stock_mutations`, where every row moves `qty` from `stok_asal` to `stok_tujuan` (buckets `baru` / `bekas` / `rusak`, `NULL` = outside the warehouse):

  | Type | From | To |
  |---|---|---|
  | `Masuk` | outside | baru |
  | `Pakai` | baru | outside |
  | `Bekas` | outside | bekas |
  | `Rusak` | baru or bekas | rusak |
  | `Serah Terima` (terima) | outside | baru, bekas or rusak |
  | `Serah Terima` (serahkan) | baru, bekas or rusak | outside |

  The same rules are used by the app (`src/utils/stock.ts`) and the `current_stock` view (`docs/migrations/2026-10-02_aliran_stok.sql`). Usable stock is baru + bekas; the annual forecast counts only `Pakai`.
- Deleting a sparepart also deletes its mutation history (`ON DELETE CASCADE`); the UI asks for confirmation.
- Credentials come only from `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). `VITE_PUBLIC_APP_URL` sets the URL encoded in printed QR labels.
- ⚠️ The app has no login. RLS policies give the anon key full access to `spareparts`, `stock_mutations` and `sparepart_compatibility`, so anyone with the deployed URL can change stock data.
