# Masih Berapa

**Manajemen sparepart SSES T2** — catat setiap barang masuk (baru, bekas, atau rusak), dipakai, atau diserahterimakan, dan lihat stoknya *saat itu juga*. Barang diidentifikasi dengan label QR yang dipindai dari kamera HP.

Produksi: **https://masih-berapa.vercel.app** · Repo: `seevent/masih-berapa`

## Fitur

| Modul | Rute | Fungsi |
|---|---|---|
| Dashboard | `/` | total stok dan tren 6 bulan, SKU di bawah minimum, rasio baru vs bekas, level inventaris, top moving (pemakaian), transaksi terbaru |
| Katalog | `/catalog` | CRUD sparepart (tampilan list bawaan, bisa grid), satuan bawaan `UNIT`, stok minimum otomatis, SKU otomatis `SP-001`, tipe peralatan lewat daftar kompatibel (banyak tipe, tanpa "tipe utama") |
| Input Transaksi | `/input-sparepart` | catat **Masuk, Pakai, Serah Terima**; satu transaksi bisa berisi **banyak sparepart**, tiap baris dengan kondisi baru / bekas / rusak; Pakai wajib satu unit; petugas = personel berdinas (atau tulis manual bila jadwal kosong) |
| History & Audit | `/history` | riwayat dengan aliran stok, edit, hapus, ekspor Excel |
| Scanner QR | `/scanner` | pindai QR berkali-kali: tiap scan menambah sparepart ke daftar (scan ulang = jumlah +1), lalu simpan sekaligus |
| Cetak Label | `/print` | label thermal 50×30 / 70×40 mm dan lembar stiker Tom & Jerry, keluaran PDF |
| Peringatan | `/alerts` | umur komponen terpasang per unit vs **MTBF otomatis** dari data; kecukupan stok 30 hari @ SLA 98% (titik pesan Poisson) |
| Kebutuhan | `/needs` | kebutuhan tahunan dari pemakaian riil dan rekomendasi order, ekspor Excel |
| Laporan | `/reports` | klasifikasi fast / medium / slow moving dari pemakaian (`Pakai`) 12 bulan terakhir |

## Cara kerja stok

Aplikasi **tidak menyimpan saldo**. Stok dihitung dari seluruh riwayat transaksi, jadi selalu bisa diaudit. Ada tiga kantong stok: **baru**, **bekas** (layak pakai kembali), dan **rusak**. Setiap transaksi memindahkan jumlah dari satu kantong ke kantong lain:

| Transaksi | Berkurang dari | Bertambah ke |
|---|---|---|
| Masuk | luar gudang | baru / bekas / rusak (dipilih per baris) |
| Pakai | baru **atau** bekas (dipilih per baris) | keluar gudang (dipasang ke unit) |
| Serah Terima (serahkan) | baru / bekas / rusak | keluar gudang |
| Serah Terima (terima) | luar gudang | baru / bekas / rusak |

Stok di kantong mana pun tidak boleh minus; transaksi yang membuatnya minus ditolak seluruhnya (semua baris atau tidak sama sekali). "Stok tersedia" = baru + bekas. Tipe lama **Bekas** dan **Rusak** sudah dihapus dari form (2 Okt 2026) tetapi baris lama tetap dihitung.

## Predictive maintenance

MTBF **tidak diisi manual**. Setiap `Pakai` mencatat unit peralatan; pemasangan kedua dan seterusnya di unit yang sama dihitung sebagai penggantian. MTBF per sparepart = total hari terpasang di semua unit ÷ jumlah penggantian. Sebelum ada penggantian, statusnya "Belum cukup data". Rincian: [docs/specs/predictive-maintenance.md](docs/specs/predictive-maintenance.md).

## Teknologi

React 19 · TypeScript 5.9 (strict) · Vite 6 · Tailwind CSS 4 · React Router 7 · Supabase (`@supabase/supabase-js`) · Recharts · `html5-qrcode` + `qrcode.react` · `xlsx` · `jspdf` + `html2canvas-pro` · `lucide-react`

Tanpa backend: browser berbicara langsung ke Supabase. Hosting di Vercel.

## Memulai

Prasyarat: **Node.js 18 atau lebih baru** dan akses ke project Supabase.

```bash
git clone https://github.com/seevent/masih-berapa.git
cd masih-berapa
npm install
cp .env.example .env      # lalu isi nilainya (lihat tabel di bawah)
npm run dev               # http://localhost:5173
```

### Variabel lingkungan

| Variabel | Wajib | Keterangan |
|---|---|---|
| `VITE_SUPABASE_URL` | ya | URL project Supabase |
| `VITE_SUPABASE_ANON_KEY` | ya | anon / publishable key |
| `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` | ya, untuk menyimpan transaksi | Cloud name dan nama *unsigned upload preset* Cloudinary untuk foto evidence. Tanpa keduanya form menolak mengunggah foto, dan foto wajib untuk setiap transaksi baru |
| `VITE_PUBLIC_APP_URL` | tidak | URL yang dienkode di QR label; bawaan `https://masih-berapa.vercel.app`. Atur **sebelum** mencetak label bila domain berbeda |

Tanpa dua variabel pertama aplikasi tetap terbuka tetapi menampilkan "Database tidak terhubung". Di Vercel, isi variabel untuk lingkungan **Production dan Preview**.

### Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run typecheck` | periksa tipe (`tsc --noEmit`) |
| `npm run build` | periksa tipe lalu build ke `dist/` (galat tipe menggagalkan build) |
| `npm run preview` | jalankan hasil build secara lokal |
| `npm test` | tes otomatis (`vitest`) untuk fungsi murni |

`node_modules/` dan `dist/` tidak disimpan di git; jalankan `npm install` setelah mengambil kode.

## Struktur proyek

```
masih-berapa/
├── src/
│   ├── pages/        # satu file per rute
│   ├── components/   # layout/, mutation/ (field Rusak & Serah Terima, pilihan unit), predictive/
│   ├── context/      # InventoryContext (semua data + aksi), NotificationContext (toast)
│   ├── utils/        # stock.ts (aturan stok), reliability.ts (MTBF, titik pesan) + tes, compatibility.ts, shiftUtils.ts
│   ├── lib/          # klien Supabase
│   └── types/        # tipe domain
├── docs/             # dokumentasi (lihat di bawah) + migrations/ + skema SQL
├── AGENTS.md         # panduan untuk agen AI
├── vercel.json       # rewrite SPA
└── .env.example
```

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [docs/PRD.md](docs/PRD.md) | produk: masalah, tujuan, pengguna, kebutuhan, aturan bisnis, roadmap |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | arsitektur: komponen, aliran data, mesin stok, build/deploy, keputusan desain |
| [docs/DATABASE.md](docs/DATABASE.md) | skema Supabase, model stok, RLS, migrasi, risiko |
| [AGENTS.md](AGENTS.md) | aturan kerja untuk agen AI di repo ini |
| [HANDOFF.md](HANDOFF.md) | catatan serah terima sesi (snapshot Juli 2026, sebagian sudah usang) |
| [docs/specs/predictive-maintenance.md](docs/specs/predictive-maintenance.md) | spesifikasi aktif: predictive maintenance v2, MTBF otomatis (disetujui, sudah diimplementasikan) |
| `docs/specs/` lainnya, `docs/tickets/` | spesifikasi dan tiket lama (**historis**, sudah tidak sesuai produk saat ini) |
| `graphify-out/` | knowledge graph kode (`graphify update .` untuk memperbarui) |

## Database

Supabase PostgreSQL yang **dipakai bersama aplikasi SSES T2 lain**. Tabel yang ditulis aplikasi ini: `spareparts`, `stock_mutations`, `sparepart_compatibility`. Master peralatan/lokasi/personel (bersama) hanya dibaca. Perubahan skema harus lewat migrasi di `docs/migrations/` dan persetujuan pemilik database. Lihat [docs/DATABASE.md](docs/DATABASE.md).

## Batasan yang diketahui

- **Belum ada login.** Semua permintaan berjalan sebagai `anon`, sehingga siapa pun yang membuka aplikasi dapat mengubah data stok.
- Data pribadi personel (NIK, no. HP) terbaca publik oleh kebijakan database saat ini.
- Validasi stok minus dilakukan di aplikasi dan tidak atomik terhadap pencatatan yang bersamaan.
- Bukan PWA (tidak bisa di-install dan tidak bisa offline).
- Tes otomatis baru mencakup perhitungan predictive maintenance (`src/utils/reliability.ts`).
- Aplikasi **hanya membaca** data master (peralatan, lokasi, personel, shift); menu Pengaturan sudah dihapus. Database menolak penulisan sebagian tabel master tanpa login.
- Margin lembar Tom & Jerry (3 mm, jarak 2 mm) belum dicocokkan dengan lembar fisik.

Daftar lengkap dan rencana penanganannya: [PRD.md bagian 12](docs/PRD.md#12-status-dan-roadmap) dan [ARCHITECTURE.md bagian 12](docs/ARCHITECTURE.md#12-utang-teknis-dan-batasan).

## Alur kontribusi

Kerjakan di branch, buka Pull Request, dan biarkan pemilik me-merge. Vercel membuat link preview per PR (memakai database produksi yang sama). Jalankan `npm run typecheck`, `npm test`, dan `npm run build` sebelum membuka PR. Panduan lebih rinci untuk agen AI ada di [AGENTS.md](AGENTS.md).

## Lisensi

Belum ditetapkan.
