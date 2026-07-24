# SSES T2 Sparepart Management ("Masih Berapa") 🛠️📦

A modern, high-performance Progressive Web Application (PWA) for managing equipment, spareparts, inventory mutations, rotable assets, predictive maintenance, and annual demand planning for SSES T2.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06b6d4?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-v6-646cff?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Supported-3ecf8e?logo=supabase)

---

## 📌 Features & Key Modules

- 📊 **Dashboard & Visual Analytics**: Live KPI cards, equipment status distribution, rotable stock asset ratio via Recharts, dedicated Qty column in recent transactions, and on-duty shift personnel summary (`PS` / `M`).
- 📦 **Sparepart Catalog**: Searchable and multi-filterable catalog with **Grid Card vs. Compact List Table View Switcher** for maximum user flexibility.
- 🔄 **Transaction Mutations**: Instant logging for `Masuk` (Penerimaan), `Pakai` (Pemakaian Work Order), `Bekas` (Pengembalian Rotable), and `Rusak` (Afkir). Includes **6 Dynamic Source Options** (`IAS`, `SUP API`, `SISA PEKERJAAN`, `MANDIRI`, `DARI UNIT LAIN`, `VENDOR`) on incoming transactions.
- 📜 **Audit History Log & Management**: Full CRUD support to edit or delete mutation records with automatic real-time stock recalculation, search filters, and 1-click Excel (`.xlsx`) export.
- 📷 **Mobile QR Code Scanner**: Built-in camera barcode/QR scanner (`html5-qrcode`) for fast SKU lookups and on-the-spot inventory updates.
- 🏷️ **Thermal QR Label Generator**: Printable compact 2D Thermal QR labels (50x30mm & 70x40mm presets) with large QR display, key metadata (`SSES T2`, `SKU`, `Nama Sparepart`, `Sumber`, `Tipe Peralatan`), and PDF download support (`jspdf` & `html2canvas`).
- ⚠️ **Predictive Maintenance Alerts**: Automated MTBF (Mean Time Between Failures) lifespan tracking (`remaining_days = mtbf_days - (current_date - last_replaced_at)`).
- 📈 **Annual Demand Planner**: Automated order forecasting (`order_needed_qty = annual_forecast - (stok_aktual + stok_bekas)`) with Excel export.
- ⚙️ **Master Data & Supabase Integration**: Complete UI master editors for `jenis_peralatan`, `tipe_peralatan`, `lokasi`, `titik_lokasi`, `unit_peralatan`, `penempatan_peralatan`, `unit_kerja`, and `personel`. Includes full Supabase client support + 1-Click database seeder.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion (Animations)
- **Icons & Visuals**: Lucide React, Recharts
- **Database & Cloud**: Supabase Client (`@supabase/supabase-js`), LocalStorage Fallback, 1-Click DB Seeder
- **Scanner & QR**: `html5-qrcode`, `qrcode.react`
- **Document Export**: `xlsx` (Excel), `jspdf` & `html2canvas` (PDF)

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

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Build for Production:**
   ```bash
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
│   ├── data/               # Mock seed data matching Supabase schema
│   ├── lib/                # Supabase client & local storage fallback
│   ├── pages/              # Main Application Page Views
│   ├── types/              # TypeScript Interfaces & Database Schemas
│   ├── App.tsx             # Main Router & Layout
│   └── main.tsx            # Application Entry Point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🗄️ Database Schema & Supabase

The app is built to seamlessly sync with a Supabase PostgreSQL database comprising 12 core tables:
`jenis_peralatan`, `tipe_peralatan`, `lokasi`, `titik_lokasi`, `unit_peralatan`, `penempatan_peralatan`, `unit_kerja`, `personel`, `jadwal_shift`, `master_configs`, `spareparts`, `stock_mutations`.

You can configure your Supabase URL & Anon Key dynamically inside the **Settings (`/settings`)** page, or test immediately using the built-in Local Storage Fallback & 1-Click Database Seeder!

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
