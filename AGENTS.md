# AGENTS.md — panduan untuk agen AI

Aplikasi **Masih Berapa**: manajemen sparepart SSES T2. React 19 + TypeScript + Vite + Tailwind 4, langsung ke Supabase (tanpa backend). Bahasa UI dan dokumen: **Indonesia**.

Baca dulu sesuai kebutuhan: [README.md](README.md) · [docs/PRD.md](docs/PRD.md) (apa dan mengapa) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (bagaimana) · [docs/DATABASE.md](docs/DATABASE.md) (skema, RLS, migrasi).

## Perintah

```bash
npm ci                 # pasang dependensi (node_modules TIDAK di git)
cp .env.example .env   # isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173
npm run typecheck      # tsc --noEmit
npm run build          # tsc --noEmit && vite build  (harus bersih, tanpa peringatan)
npm test               # vitest run (fungsi murni di src/utils)
```

Vite **tidak** memeriksa tipe saat `dev`; galat tipe baru muncul di `typecheck`/`build`. Selalu jalankan keduanya sebelum menyatakan selesai.

## Peta kode

- `src/context/InventoryContext.tsx` — satu-satunya tempat membaca/menulis Supabase untuk data aplikasi; semua halaman memakai `useInventory()`.
- `src/utils/stock.ts` — **aturan stok** (fungsi murni). `reliability.ts` (MTBF otomatis, status umur, titik pesan; ada tesnya), `compatibility.ts` (lokasi/titik/unit yang kompatibel, tipe yang wajib unit), `place.ts` (lokasi/titik/unit daftar atau manual ↔ kolom `stock_mutations`), `shiftUtils.ts` (shift PS/M).
- `src/lib/supabase.ts` — klien + `fetchAllRows` (paginasi).
- `src/pages/*` — satu file per rute; `src/components/mutation/TransactionForm.tsx` = form nota untuk Input Transaksi dan Scanner; `StockFlowFields.tsx` (`KondisiPicker`), `EquipmentUnitSelect.tsx`, `EquipmentPlacePicker.tsx` (lokasi → titik → unit), `PetugasSelect.tsx` dipakai bersama.
- `docs/migrations/` — migrasi SQL yang sudah/akan diterapkan.

## Aturan yang mudah salah

### Stok
1. **Jangan pernah menyimpan atau menulis stok.** Tabel `spareparts` tidak punya kolom stok. Stok = hasil seluruh `stock_mutations`. `stok_aktual`/`stok_bekas`/`stok_rusak` di kode adalah hasil hitung.
2. Setiap mutasi memindahkan qty `stok_asal → stok_tujuan` (`baru`/`bekas`/`rusak`, `null` = luar gudang). Tabelnya ada di [docs/DATABASE.md bagian 3](docs/DATABASE.md#3-model-stok-paling-penting). Form hanya punya **tiga tipe**: `Masuk` (ke baru/bekas/rusak), `Pakai` (dari baru/bekas), `Serah Terima` (dua arah, tiga kondisi). `Bekas` dan `Rusak` adalah tipe lama: jangan ditulis lagi, tetapi tetap dihitung bila ada.
3. Aturan stok ada di **dua tempat yang harus identik**: `src/utils/stock.ts` dan view SQL `current_stock`. Mengubah salah satunya **wajib** mengubah yang lain + migrasi + dokumen, lalu cocokkan dengan vektor uji (hasil 4 / 5 / 2) di DATABASE.md 3.3.
4. Tulis mutasi lewat `addMutations` (nota banyak baris, satu `INSERT`: semua atau tidak sama sekali)/`updateMutation`/`deleteMutation` saja. Ketiganya membaca ulang mutasi dari database dan menolak hasil yang membuat kantong stok minus. Jangan menambah jalur tulis yang melewati validasi itu.
5. Kebutuhan tahunan hanya menghitung `Pakai`; `Serah Terima` dan `Rusak` bukan pemakaian.
6. `isLowStock(usableStock(sp), minimum)` (stok tersedia = **baru + bekas** `<= minimum`) adalah satu-satunya definisi stok rendah; kecukupan stok dan rekomendasi order juga memakai baru + bekas. **`minimum_stok` dihitung otomatis** dari pemakaian (`autoMinimumStock` di `reliability.ts`, = titik pesan SLA − 1; 0 bila belum ada `Pakai`) dan diisi `InventoryContext` saat memuat data; jangan menambah isian atau tulisan manual untuk kolom `spareparts.minimum_stok`. Titik pesan memakai `max(SLA, minimum + 1)` agar selalu selaras dengannya.
7. **`Pakai` wajib `unit_id`** (form, `addMutations`, `updateMutation`, trigger database). MTBF dihitung dari `Pakai` per (sparepart, unit); jangan menambah isian MTBF manual dan jangan membaca/menulis `spareparts.mtbf_days`/`last_replaced_at` (kolom usang). Ubah rumus hanya bersama spesifikasi `docs/specs/predictive-maintenance.md` dan tesnya.

### Database (produksi, dipakai bersama aplikasi lain)
8. **Database live adalah acuan**, bukan file SQL di repo. Periksa skema sebenarnya sebelum menulis query atau mengubah tipe.
9. **Jangan mengubah, menghapus, atau menulis** `jadwal_pm`, `laporan_operasional`, `laporan_checklist`, atau `master_configs` (milik aplikasi lain).
10. **Perubahan skema = migrasi** mengikuti [DATABASE.md bagian 8](docs/DATABASE.md#8-prosedur-mengubah-database): file di `docs/migrations/`, uji dalam transaksi yang dibatalkan, **terapkan hanya setelah pemilik menyetujui**, terapkan **sebelum** deploy kode yang membutuhkannya, lalu perbarui dokumen.
11. Jangan menjalankan `docs/schema_relational_supabase_v2.sql` (usang). `docs/schema_relational_supabase.sql` hanya acuan baca.
12. RLS: tanpa login, aplikasi berjalan sebagai `anon`. Penulisan ke `jenis_peralatan`, `tipe_peralatan`, `lokasi`, `titik_lokasi`, `penempatan_peralatan`, `unit_kerja`, `personel` **ditolak** (butuh login). Aplikasi ini **hanya membaca tabel master**: menu Pengaturan dihapus pada 2 Okt 2026, jadi jangan menambahkan penulisan ke tabel master tanpa login. Jangan menganggap sebuah penulisan "pasti berhasil" tanpa memeriksa policy-nya.
13. PostgREST membatasi 1.000 baris per permintaan: pakai `fetchAllRows` untuk tabel yang bisa lebih besar.
14. Jangan menaruh service-role key atau rahasia lain di `VITE_*` atau di repo.

### Frontend
15. Id baru dibuat di klien dengan `crypto.randomUUID()`.
16. Payload ke Supabase hanya boleh berisi **kolom yang ada di tabel**. Kolom turunan (`equipment_type_name`, `id_jenis`, `stok_*`, `sparepart_name`, `operator_name`) tidak boleh ikut dikirim.
17. Setiap aksi tulis menampilkan toast (`useNotification`) dan mengembalikan `boolean`; tutup modal/pindah halaman hanya bila `true`.
18. Teks UI berbahasa Indonesia; ikuti gaya yang ada (kelas Tailwind gelap, `glass-panel`, ikon `lucide-react`).
19. Cetak label: PDF memakai `html2canvas-pro` (bukan `html2canvas`, gagal pada warna `oklch()` Tailwind v4); pustaka PDF dimuat dinamis. Ukuran label dalam **mm**, tampilan skala sebenarnya.
20. Callback kamera (`html5-qrcode`) didaftarkan sekali; baca state lewat `ref` agar tidak basi.
21. Jangan menambah dependensi tanpa alasan. Sudah terpasang tetapi tidak dipakai: `motion`, `clsx`, `tailwind-merge`, `core-js`.
22. Hubungan sparepart ↔ tipe peralatan **hanya** lewat `sparepart_compatibility` (`Sparepart.tipe_ids`, `jenis_ids`, `equipment_type_name`). Jangan membaca atau menulis kolom usang `spareparts.id_tipe`, `mtbf_days`, `last_replaced_at`, `minimum_stok`.

## Cara memverifikasi perubahan

1. `npm run typecheck`, `npm test`, lalu `npm run build` — bersih.
2. Untuk perubahan UI/alur: jalankan `npm run dev` dan uji di browser (Playwright/Chromium tersedia di lingkungan cloud). **Cegat semua permintaan tulis** ke `/rest/v1/` (selain GET) dan jawab palsu supaya data produksi tidak berubah; periksa isi payload yang dicegat.
3. Untuk perubahan database: uji dalam blok `DO $$ ... RAISE EXCEPTION ... $$` yang dibatalkan, juga sebagai `SET LOCAL ROLE anon`; setelah itu pastikan jumlah baris dan skema tidak berubah.
4. Untuk perubahan aturan stok: cocokkan `utils/stock.ts` dengan view menggunakan vektor uji.
5. Tes otomatis (`vitest`) ada untuk `reliability.ts`, `stock.ts`, `compatibility.ts`, `shiftUtils.ts` di `src/utils/`. Tambahkan tes untuk fungsi murni lain di `src/utils/` saat mengubahnya. Untuk menguji tampilan dengan data, jawab `GET stock_mutations` dengan data simulasi di browser (jangan menulis data uji ke produksi).

## Alur kerja Git

Alur yang dipakai selama ini: kerjakan di **branch** (`fix/...`, `feat/...`, `docs/...`), buka **PR**, pemilik yang me-merge ke `main`. Vercel membuat link preview per PR; **preview memakai database produksi yang sama**.

- Jangan commit, push, atau merge tanpa diminta pemilik. Jangan force-push atau menulis ulang riwayat.
- Pesan commit berbahasa Indonesia, ringkas: apa yang berubah dan mengapa.
- `node_modules/`, `dist/`, `.env` tidak boleh masuk git.

## Knowledge graph (graphify)

Repo punya graph di `graphify-out/` (`GRAPH_REPORT.md`, `graph.json`, `graph.html`). Aturan di `.agents/rules/graphify.md`:

- Untuk pertanyaan kode/arsitektur, jalankan dulu `graphify query "<pertanyaan>"`, `graphify path "A" "B"`, atau `graphify explain "X"` sebelum membaca banyak file. Baca `GRAPH_REPORT.md` hanya untuk tinjauan luas.
- Setelah mengubah file kode, jalankan `graphify update .` (hanya AST, tanpa biaya API). Pasang dengan `pip install "graphifyy[sql]==0.9.17"` (versi yang sama dengan cache di repo; ekstra `[sql]` agar file `.sql` ikut terbaca).
- Keterbatasan: fungsi panah yang bersarang di dalam komponen/provider (mis. `addMutations` di `InventoryProvider`) **bukan simpul tersendiri**; cari lewat `InventoryProvider`/`InventoryContext.tsx`. Dokumen `.md` masuk per judul/bagian, tanpa relasi semantik (itu butuh langkah LLM: `graphify extract` dengan API key).
- Nama komunitas di `GRAPH_REPORT.md` berasal dari simpul pusatnya (tanpa LLM) dan bisa bergeser setelah `update`. Untuk nama deskriptif, atur API key (mis. `GEMINI_API_KEY`) lalu jalankan `graphify label .`.
- Graph juga memuat dokumen `.md` dan folder `.agents/` (banyak simpul tidak terkait kode aplikasi). Jangan menarik kesimpulan arsitektur dari simpul `.agents/`.

## Dokumen yang harus diperbarui bila ...

| Bila Anda mengubah | Perbarui |
|---|---|
| rumus predictive maintenance | `src/utils/reliability.ts` + tes, `docs/specs/predictive-maintenance.md`, PRD.md 7.4–7.5, ARCHITECTURE.md 6.3–6.4 |
| aturan stok, tipe transaksi | `src/utils/stock.ts`, view `current_stock` + migrasi, DATABASE.md bagian 3, PRD.md bagian 7, ARCHITECTURE.md bagian 5 |
| skema/RLS | migrasi, `docs/schema_relational_supabase.sql`, DATABASE.md |
| rute/halaman/fitur | README.md, PRD.md bagian 6, ARCHITECTURE.md bagian 3 |
| variabel lingkungan, perintah, deploy | README.md, ARCHITECTURE.md bagian 8, `.env.example` |
| kode mati dibersihkan / dependensi | ARCHITECTURE.md bagian 12 |

## Konvensi proses yang sudah ada di `.agents/`

Folder `.agents/` berisi aturan untuk agen lain (Antigravity/Gemini), mis. `rules/idea-orchestrator.md`: untuk **ide fitur mentah**, lewati dulu tahap tanya-jawab (`grill-me`), spesifikasi (`to-spec`), dan tiket (`to-ticket`) sebelum menulis kode. Hormati alur itu bila pemilik menyodorkan ide fitur baru; untuk perbaikan bug dan permintaan yang jelas, langsung kerjakan. `docs/specs/` dan `docs/tickets/` adalah hasil alur lama dan **sudah usang** terhadap produk saat ini, **kecuali** `docs/specs/predictive-maintenance.md` (spesifikasi aktif).
