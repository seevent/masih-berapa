# PRD — Masih Berapa

**Product Requirements Document** · Aplikasi manajemen sparepart SSES T2
Versi dokumen 1.0 · 2 Oktober 2026 · Status produk: v1.0.0 (produksi di Vercel)

> **Cara membaca dokumen ini.** Tidak ada PRD sebelumnya. Dokumen ini **disusun ulang dari kode, database live, dan keputusan selama pengembangan**. Bagian bertanda **[Asumsi]** adalah kesimpulan yang belum dikonfirmasi pemilik produk. Bagian bertanda **[Usulan]** adalah rekomendasi, bukan komitmen. Spesifikasi lama di `docs/specs/` dan `docs/tickets/` bersifat historis dan sudah tidak sesuai dengan produk saat ini.
>
> Dokumen terkait: [ARCHITECTURE.md](ARCHITECTURE.md) · [DATABASE.md](DATABASE.md) · [../AGENTS.md](../AGENTS.md)

## Daftar isi

1. [Ringkasan](#1-ringkasan)
2. [Latar belakang dan masalah](#2-latar-belakang-dan-masalah)
3. [Tujuan dan non-tujuan](#3-tujuan-dan-non-tujuan)
4. [Pengguna](#4-pengguna)
5. [Ruang lingkup](#5-ruang-lingkup)
6. [Kebutuhan fungsional](#6-kebutuhan-fungsional)
7. [Aturan bisnis](#7-aturan-bisnis)
8. [Kebutuhan non-fungsional](#8-kebutuhan-non-fungsional)
9. [Data dan integrasi](#9-data-dan-integrasi)
10. [Metrik keberhasilan](#10-metrik-keberhasilan)
11. [Asumsi, risiko, ketergantungan](#11-asumsi-risiko-ketergantungan)
12. [Status dan roadmap](#12-status-dan-roadmap)
13. [Pertanyaan terbuka](#13-pertanyaan-terbuka)

---

## 1. Ringkasan

**Masih Berapa** menjawab pertanyaan yang sering muncul di gudang sparepart: *"barang ini masih berapa?"*. Aplikasi web ini mencatat setiap pergerakan sparepart (masuk, dipakai, dikembalikan bekas, rusak, serah terima), menghitung stok baru, bekas, dan rusak secara otomatis dari riwayat itu, dan memberi peringatan sebelum stok atau umur pakai suatu komponen habis. Barang diidentifikasi dengan **label QR** yang dipindai dari kamera HP.

Aplikasi dipakai oleh unit **SSES T2** untuk suku cadang peralatan di Terminal 2 **[Asumsi: lingkungan bandara; database memakai pemilik bawaan "Injourney / AP2"]**. Aplikasi berbagi database dengan aplikasi SSES T2 lain (jadwal PM, laporan operasional, checklist).

## 2. Latar belakang dan masalah

**[Asumsi]** disimpulkan dari fitur yang dibangun:

| Masalah | Akibat |
|---|---|
| Stok sparepart dicatat manual / terpisah dari pemakaian | selisih antara catatan dan barang fisik; sulit mengaudit siapa memakai apa |
| Barang copotan yang masih layak (rotable) tidak terlacak | barang bagus dibeli ulang atau hilang |
| Barang rusak dan barang yang diserahkan ke pihak lain tidak tercatat | stok tampil lebih tinggi dari kenyataan |
| Kebutuhan pengadaan ditebak | stok habis saat dibutuhkan, atau menumpuk |
| Mencari barang dan rak memakan waktu | perbaikan tertunda |

## 3. Tujuan dan non-tujuan

### Tujuan
1. **Stok akurat dan dapat diaudit**: saldo selalu hasil dari riwayat transaksi, tidak bisa diubah tanpa jejak.
2. **Pencatatan cepat di lapangan**: scan QR dari HP, isi jumlah, selesai.
3. **Melacak tiga kondisi barang**: baru, bekas (rotable), dan rusak.
4. **Antisipasi kebutuhan**: peringatan umur komponen terpasang (MTBF otomatis dari data), kecukupan stok, dan rekomendasi pengadaan tahunan.
5. **Akuntabilitas**: setiap transaksi mencatat petugas yang sedang berdinas dan, bila relevan, unit peralatan yang diperbaiki.

### Non-tujuan (v1)
- **Tidak mengelola harga, biaya, atau anggaran** (aplikasi sengaja non-finansial).
- Tidak mengelola proses pengadaan (permintaan pembelian, persetujuan, penerimaan PO). Tipe `PurchaseRequisition` ada di kode tetapi belum dipakai.
- Tidak menggantikan aplikasi SSES T2 lain (jadwal PM, laporan operasional).
- Tidak mendukung penggunaan offline.
- Tidak mengelola banyak gudang sebagai entitas terpisah (gudang dan rak hanya teks pada sparepart).

## 4. Pengguna

Aplikasi belum punya login, jadi peran di bawah **belum dibedakan oleh sistem** **[Asumsi]**.

| Peran | Kebutuhan utama | Fitur yang dipakai |
|---|---|---|
| **Teknisi / petugas shift** | mengambil dan mengembalikan sparepart dengan cepat di lapangan, dari HP | Scanner, Input Transaksi |
| **Petugas gudang** | mencatat barang masuk, merapikan katalog, mencetak label | Katalog, Input Transaksi, Cetak Label |
| **Koordinator / supervisor** | melihat kondisi stok, memeriksa riwayat, merencanakan pengadaan | Dashboard, History, Peringatan, Kebutuhan, Laporan |

Konteks pemakaian: bekerja dua shift (PS 08.00–20.00 dan M 20.00–08.00), sebagian besar dari HP/tablet di area kerja.

## 5. Ruang lingkup

**Dalam lingkup (sudah ada):** katalog sparepart; pencatatan lima tipe transaksi; riwayat, edit, hapus, dan ekspor; scan QR; cetak label; dashboard; peringatan prediktif (MTBF otomatis); perencanaan kebutuhan; laporan rotasi.

**Di luar lingkup v1:** harga/anggaran, proses pengadaan, banyak gudang, offline, notifikasi push, **pengelolaan data master dari aplikasi ini** (menu Pengaturan dihapus pada 2 Oktober 2026; data master hanya dibaca), login/peran (direncanakan, lihat [bagian 12](#12-status-dan-roadmap)).

## 6. Kebutuhan fungsional

Status: ✅ selesai · ⚠ sebagian · ❌ belum.

### F-01 Katalog sparepart — ✅
Pengguna mengelola master sparepart.
- Daftar dalam tampilan **list (bawaan)** atau grid; pencarian (SKU, nama, deskripsi); filter jenis dan tipe peralatan.
- Tambah/ubah: SKU otomatis berurutan (`SP-001`, `SP-002`, …) dan tidak bisa diedit; nama, deskripsi, satuan (bawaan `UNIT`), gudang, rak; **stok minimum tidak diisi**: dihitung otomatis dari pemakaian ([7.4](#74-peringatan-prediktif-mtbf-otomatis), BR-15); pilih **satu atau lebih tipe peralatan kompatibel**. Tidak ada lagi "tipe utama" (dihapus 2 Okt 2026): daftar kompatibel adalah satu-satunya hubungan sparepart ↔ tipe. Jenis dan tipe yang tampil di katalog, filter, label, dan laporan diturunkan dari daftar itu; pilihan jenis di form hanya mempersempit daftar tipe.
- Stok awal (baru/bekas) saat mendaftarkan sparepart dicatat otomatis sebagai transaksi. **Stok tidak dapat diedit langsung** setelah itu.
- Hapus sparepart meminta konfirmasi dan menyebut jumlah riwayat mutasi yang ikut terhapus.
- MTBF **tidak diisi manual**: kartu dan form menampilkan MTBF hasil hitung ([7.4](#74-peringatan-prediktif-mtbf-otomatis)) beserta jumlah penggantian dan tingkat keyakinannya, atau "Belum cukup data".
- **Kriteria:** mendaftarkan sparepart dengan stok awal 3 baru dan 2 bekas menghasilkan dua transaksi (`Masuk` 3, `Bekas` 2) dan katalog menampilkan 3 / 2.

### F-02 Pencatatan transaksi — ✅
Lima tipe transaksi; detail aturan di [bagian 7](#7-aturan-bisnis).

| Tipe | Kegunaan | Isian khusus |
|---|---|---|
| Masuk | menerima barang baru | sumber: IASS, SUP API, SISA PEKERJAAN, MANDIRI, DARI UNIT LAIN, VENDOR |
| Pakai | memasang barang baru ke peralatan | lokasi, titik (filter), **unit peralatan wajib**: unit kompatibel di atas, unit lain di grup terpisah |
| Bekas | mengembalikan barang copotan layak pakai | lokasi, titik, unit (opsional) |
| Rusak | memindahkan barang yang tidak layak pakai ke stok rusak | **asal: stok baru atau stok bekas**; lokasi/unit (opsional) |
| Serah Terima | menyerahkan atau menerima barang ke/dari pihak lain | **arah** (serahkan/terima), **kondisi** (baru/bekas/rusak), **pihak** (wajib), unit pihak |

- Setiap transaksi wajib punya petugas; pilihan petugas = personel yang berdinas pada shift saat ini (bila jadwal kosong, semua personel + peringatan), diurutkan **API dulu, lalu IAS**, di dalam unit menurut nomor urut.
- Ada kolom catatan.
- **Kriteria:** transaksi yang membuat stok kantong mana pun minus **ditolak** dengan pesan jelas dan tidak tersimpan.
- **Kriteria:** `Pakai` tanpa unit tidak bisa dikirim dari form dan ditolak oleh aplikasi (BR-13).

### F-03 Riwayat dan audit — ✅
- Tabel semua transaksi (waktu, tipe + aliran stok, SKU/nama, sumber, tipe peralatan, qty, petugas, lokasi, catatan).
- Pencarian dan filter tipe; **ekspor Excel**.
- Edit (tipe, sumber, jumlah, petugas, **unit peralatan**, catatan, dan field Rusak/Serah Terima) dan hapus dengan konfirmasi. Mengubah tipe menjadi `Pakai` wajib memilih unit.
- **Kriteria:** edit atau hapus yang membuat stok minus **ditolak**; baris `Serah Terima` tanpa arah (ditulis aplikasi lain) ditandai dan tidak mengubah stok.

### F-04 Scanner QR — ✅
- Pindai QR dengan kamera, atau ketik SKU / tempel URL.
- Membuka URL dari label (`...?sku=SP-001`) otomatis menuju Scanner dengan sparepart terisi.
- Menampilkan detail dan stok (baru, bekas, rusak), lalu form transaksi lengkap yang sama dengan F-02.
- **Kriteria:** SKU yang tidak ada menampilkan pesan "tidak ditemukan", bukan galat.

### F-05 Cetak label — ✅ (⚠ ukuran lembar)
- Label thermal 50×30 mm dan 70×40 mm (satu label per PDF).
- Lembar stiker Tom & Jerry No. 103, 108, 121, 107 (grid penuh per lembar).
- Isi label: QR, SKU, nama, tipe peralatan, sumber terakhir; keluaran **PDF** berukuran asli.
- ⚠ Margin dan jarak lembar Tom & Jerry masih asumsi; perlu dicocokkan dengan lembar fisik.

### F-06 Dashboard — ✅
KPI total stok tersedia (dengan tren 6 bulan), jumlah SKU di bawah minimum, rasio stok baru vs bekas; grafik level inventaris; top moving parts (5 sparepart dengan pemakaian `Pakai` terbanyak, dasar yang sama dengan F-09); transaksi terbaru.

### F-07 Peringatan prediktif — ✅ (v2, Oktober 2026)
Dua bagian ([7.4](#74-peringatan-prediktif-mtbf-otomatis)), spesifikasi: [specs/predictive-maintenance.md](specs/predictive-maintenance.md).
- **Umur komponen terpasang**: satu baris per sparepart × unit yang beroperasi; terpasang sejak, umur, MTBF otomatis, rasio umur/MTBF, status NORMAL / PERHATIAN / KRITIS / LEWAT / BELUM CUKUP DATA.
- **Kecukupan stok 30 hari @ SLA 98%** per sparepart: kebutuhan per hari, perkiraan 30 hari, titik pesan, stok baru, status PESAN dan jumlah usulan; tautan ke Input Transaksi.
- Header menampilkan jumlah "perlu tindakan" = posisi KRITIS + LEWAT + sparepart PESAN.
- **Kriteria:** tanpa transaksi `Pakai`, semua MTBF dan kebutuhan berstatus "Belum cukup data" dan stok minimum = 0, sehingga PESAN hanya bila stok baru habis.

### F-08 Perencanaan kebutuhan — ✅
Estimasi kebutuhan tahunan dari pemakaian riil, stok baru, dan rekomendasi order per sparepart ([7.5](#75-kebutuhan-tahunan)); ekspor Excel; tanpa pemakaian ditampilkan "Belum cukup data" (tidak ada lagi estimasi dari MTBF manual).

### F-09 Laporan rotasi — ✅
Klasifikasi *fast / medium / slow moving* dari **pemakaian** ([7.5](#75-kebutuhan-tahunan)), total stok bekas, total stok fisik.
- **Fast**: rata-rata ≥ 1 buah `Pakai` per bulan. **Medium**: ada pemakaian, kurang dari itu. **Slow**: tidak ada pemakaian. **Belum cukup data**: tidak ada pemakaian dan sparepart baru dikenal < 30 hari.
- Dasar hitung: qty `Pakai` dalam jendela 12 bulan terakhir (atau sejak transaksi pertama bila lebih singkat, minimal 30 hari), sama dengan kebutuhan tahunan. Transaksi lain (Masuk, Bekas, Rusak, Serah Terima, termasuk stok awal) **tidak** dihitung.
- Kartu menampilkan jumlah Fast, rincian Medium/Slow, dan berapa Slow yang masih menyimpan stok.
- *Perubahan 2 Okt 2026:* sebelumnya dihitung dari jumlah transaksi apa pun sepanjang masa (≥ 2 = Fast), sehingga sparepart yang baru didaftarkan dengan stok baru + bekas langsung tampil Fast.

### F-10 Data master (Pengaturan) — ❌ dihapus
Menu **Pengaturan Sistem** (halaman `/settings`) **dihapus pada 2 Oktober 2026** atas permintaan pemilik (alasan tidak dicatat). Catatan teknis: sebelum dihapus, sebagian form di dalamnya tidak dapat berfungsi tanpa login karena kebijakan database ([DATABASE.md bagian 6](DATABASE.md#6-keamanan-rls-dan-hak-akses)).
- Aplikasi sekarang **hanya membaca** data master (peralatan, tipe, lokasi, titik, penempatan, personel, jadwal shift) untuk filter, pilihan lokasi/unit, dan petugas berdinas.
- Indikator status koneksi database tetap ada di header; bila terputus, banner di bagian atas halaman menjelaskan cara memperbaikinya.
- Alamat `/settings` lama dan alamat yang tidak dikenal diarahkan ke Dashboard.

### F-11 Login dan peran — ❌
Belum ada. Prasyarat untuk mengamankan data, dan untuk mengembalikan pengelolaan data master di aplikasi ini bila kelak dibutuhkan ([bagian 12](#12-status-dan-roadmap)).

## 7. Aturan bisnis

### 7.1 Stok diturunkan dari transaksi
Tidak ada saldo tersimpan. Stok = hasil seluruh transaksi (BR-1). Tiga kantong: **baru**, **bekas**, **rusak**; "stok tersedia" = baru + bekas.

### 7.2 Aliran stok per tipe transaksi

| Tipe | Berkurang dari | Bertambah ke |
|---|---|---|
| Masuk | luar gudang | baru |
| Pakai | baru | keluar gudang |
| Bekas | luar gudang | bekas |
| Rusak | baru **atau** bekas | rusak |
| Serah Terima, serahkan | baru / bekas / rusak | keluar gudang |
| Serah Terima, terima | luar gudang | baru / bekas / rusak |

- **BR-2** Stok di kantong mana pun tidak boleh minus.
- **BR-3** Jumlah transaksi bilangan bulat > 0.
- **BR-4** `sumber` hanya berlaku untuk `Masuk`.
- **BR-5** `Serah Terima` wajib mencatat pihak lain.
- **BR-6** Aturan ini harus identik di aplikasi dan di database (`current_stock`); lihat [DATABASE.md 3.3](DATABASE.md#33-dua-implementasi-yang-harus-selalu-sama).

### 7.3 Shift dan petugas
- **BR-7** Dua shift: PS (08.00–20.00) dan M (20.00–08.00). Pukul 00.00–07.59 termasuk shift malam yang dimulai kemarin.
- **BR-8** Hanya personel terjadwal pada shift aktif dan berstatus hadir yang dianggap berdinas. Izin, sakit, cuti, alpa, off, dan libur tidak.

### 7.4 Peringatan prediktif (MTBF otomatis)
Rumus lengkap dan contoh angka: [specs/predictive-maintenance.md bagian 4](specs/predictive-maintenance.md#4-rumus).
- **Posisi terpasang** = (sparepart, unit). Pemasangan = `Pakai` dengan unit; pemasangan kedua dan seterusnya di posisi yang sama = **penggantian**.
- **MTBF** per sparepart = total paparan semua posisi ÷ total penggantian. Paparan posisi = (akhir − pemasangan pertama) × qty pemasangan pertama; akhir = hari ini, atau tanggal unit berubah status bila unit kini `gudang`/`rusak`. Tanpa penggantian → "Belum cukup data". Keyakinan: 1–2 penggantian rendah, 3–9 sedang, ≥ 10 tinggi.
- **Status umur** posisi = umur (hari sejak `Pakai` terakhir di posisi itu) ÷ MTBF: NORMAL < 70%, PERHATIAN 70–90%, KRITIS 90–100%, LEWAT > 100%. Hanya unit yang tidak berstatus `gudang`/`rusak` yang ditampilkan.
- **Kecukupan stok**: kebutuhan per hari `r` = qty `Pakai` dalam jendela ÷ jendela (hari sejak transaksi pertama sparepart, 30–365 hari); `λ = r × 30` (horizon 30 hari pengganti lead time yang belum ada datanya); titik pesan SLA = angka terkecil `s` dengan `P(Poisson(λ) ≤ s) ≥ 98%`.
- **BR-14** Titik pesan = `max(titik pesan SLA, stok minimum + 1)`; **PESAN** bila stok baru < titik pesan, usulan = titik pesan − stok baru. Dengan "+1", aturan ini selalu memesan bila stok rendah menurut BR-10.
- **BR-15** Stok minimum **otomatis** = titik pesan SLA − 1 (karena stok rendah = stok baru ≤ minimum); tanpa pemakaian = 0 (rendah hanya bila habis). Contoh: 6 `Pakai` dalam 180 hari → titik pesan 3 → minimum 2. Kolom `spareparts.minimum_stok` tidak dibaca dan tidak ditulis lagi; hasil hitung menggantikan nilainya di seluruh aplikasi (katalog, dashboard, peringatan). Hanya **stok baru** yang dihitung karena `Pakai` mengambil stok baru.

### 7.5 Kebutuhan tahunan
- Kebutuhan tahunan = `ceil(r × 365)` dengan `r` seperti di 7.4. Tanpa pemakaian: "Belum cukup data" dan tidak ada rekomendasi.
- Rekomendasi order = `kebutuhan − stok baru`, minimal 0 (stok bekas tidak dihitung, sama dengan 7.4). Total rekomendasi di kartu dijumlahkan **per satuan** (mis. `7 PCS + 2 UNIT`), tidak dicampur.
- Pembulatan ke atas mengabaikan galat desimal (`29/365 × 365` tidak menjadi 30).
- **Klasifikasi rotasi** (F-09) memakai `r` yang sama: Fast bila `qty Pakai × 30 ≥ jendela` (rata-rata ≥ 1 per bulan).
- **BR-9** `Serah Terima` dan `Rusak` **tidak** dihitung sebagai pemakaian.

### 7.6 Lain-lain
- **BR-10** Stok rendah = stok baru ≤ stok minimum (satu definisi di seluruh aplikasi); stok minimum dihitung otomatis (BR-15).
- **BR-11** SKU otomatis berformat `SP-NNN`, berurutan dari angka terbesar yang ada.
- **BR-12** Menghapus sparepart menghapus riwayat mutasinya; pengguna harus mengonfirmasi.
- **BR-13** `Pakai` wajib mencatat unit peralatan (dasar perhitungan MTBF per unit). Untuk `Bekas` dan `Rusak` unit tetap opsional. Diberlakukan di aplikasi **dan** di database (trigger `stock_mutations_pakai_wajib_unit`, diterapkan 2 Okt 2026), sehingga penulis lain juga ditolak bila mengirim `Pakai` tanpa `unit_id`.

## 8. Kebutuhan non-fungsional

| Area | Kebutuhan | Status |
|---|---|---|
| Perangkat | responsif untuk HP, tablet, desktop; kamera HP untuk scan | ✅ |
| Kinerja | halaman dimuat per rute (lazy-load); data dimuat sekali lalu dihitung di browser | ✅ untuk data saat ini (0 mutasi, 4 sparepart); **belum diuji dengan data besar** |
| Ketersediaan | mengikuti Vercel dan Supabase; tidak ada mode offline | — |
| Keamanan | hanya pengguna berwenang yang boleh mengubah stok | ❌ belum (tanpa login; lihat 11) |
| Privasi | data pribadi personel (NIK, no. HP) tidak boleh terbuka publik | ❌ saat ini terbuka |
| Auditabilitas | setiap transaksi mencatat siapa, kapan, apa | ⚠ **edit dan hapus transaksi, serta hapus sparepart, menimpa/menghapus data tanpa menyimpan jejak perubahan** |
| Bahasa | antarmuka berbahasa Indonesia | ✅ |
| Kompatibilitas | browser modern; kamera butuh HTTPS | ✅ |
| Kualitas kode | tipe TypeScript ketat, build gagal bila ada galat tipe; tes otomatis | ✅; tes otomatis ⚠ baru `utils/reliability.ts` |

## 9. Data dan integrasi

- **Database:** Supabase PostgreSQL bersama aplikasi SSES T2 lain. Master peralatan, lokasi, dan personel adalah data bersama; aplikasi ini hanya menambahkan tabel sparepart, mutasi, dan kompatibilitas. Detail: [DATABASE.md](DATABASE.md).
- **Label QR** mengarah ke URL produksi aplikasi; bila domain berubah, label lama berhenti berfungsi (atur `VITE_PUBLIC_APP_URL` sebelum mencetak).
- **Ekspor:** Excel (`.xlsx`) untuk riwayat dan perencanaan kebutuhan; PDF untuk label.
- **Tidak ada** integrasi dengan sistem pengadaan atau keuangan.

## 10. Metrik keberhasilan

**[Usulan]** — belum diukur dan belum ada target yang disepakati.

| Metrik | Cara ukur | Arah |
|---|---|---|
| Selisih stok sistem vs hitung fisik (stock opname) | opname berkala per sparepart | mendekati 0 |
| Waktu mencatat satu transaksi dari HP | uji dengan teknisi | di bawah 30 detik |
| Porsi transaksi yang dicatat dalam shift yang sama dengan kejadiannya | bandingkan `created_at` dengan kejadian | naik |
| Kejadian stok habis tak terduga untuk sparepart kritis | jumlah per kuartal | turun |
| Barang bekas layak pakai yang dipakai kembali | jumlah `Pakai` dari stok bekas (perlu pencatatan terpisah) | naik |

## 11. Asumsi, risiko, ketergantungan

### Asumsi
- A1 Pengguna memakai HP dengan kamera dan koneksi internet di area kerja.
- A2 Satu gudang logis; lokasi dan rak berupa teks.
- A3 Semua pengguna dipercaya (karena belum ada login).
- A4 `Serah Terima` selalu berarti barang benar-benar berpindah tangan, sehingga mengubah stok.
- A5 Barang `rusak` tetap berada di gudang sampai diserahkan (lewat `Serah Terima`).

### Risiko

| # | Risiko | Dampak | Penanganan |
|---|---|---|---|
| K1 | Tanpa login, siapa pun yang tahu URL dan anon key dapat mengubah atau menghapus data stok | data rusak | login + RLS ketat (P0) |
| K2 | Validasi stok minus hanya di aplikasi dan tidak atomik | stok minus pada pencatatan bersamaan | guard di database (P0) |
| K3 | Data pribadi personel terbaca publik | pelanggaran privasi | batasi `SELECT` (P0) |
| K4 | Database dipakai aplikasi lain | perubahan skema mengganggu aplikasi lain | prosedur migrasi ([DATABASE.md bagian 8](DATABASE.md#8-prosedur-mengubah-database)) |
| K5 | Aturan stok ada di dua tempat (SQL dan TypeScript) | angka berbeda | vektor uji; ubah keduanya bersamaan |
| K6 | Tes otomatis baru mencakup `utils/reliability.ts` | regresi di aturan stok tidak terdeteksi | tes untuk `utils/stock.ts` dan lainnya (P1) |
| K7 | Seluruh mutasi dimuat ke browser | lambat bila data sangat besar | agregasi di database (P2) |

### Ketergantungan
Supabase (database dan REST), Vercel (hosting dan deploy), GitHub (kode), kamera perangkat, HTTPS.

## 12. Status dan roadmap

### Sudah selesai (v1.0.0)
F-01 sampai F-09. Pada Oktober 2026 menu Pengaturan (F-10) dihapus, lalu: perbaikan menyeluruh (bug, data nyata di dashboard, validasi stok), aliran stok per transaksi (Rusak dari baru/bekas, Serah Terima dua arah), dan pengamanan view `current_stock`. Kemudian **predictive maintenance v2**: MTBF otomatis dari data, `Pakai` wajib unit, titik pesan SLA 98%, dan tes `vitest` pertama.

### Backlog **[Usulan]**

| Prioritas | Item | Alasan |
|---|---|---|
| **P0** | Login (Supabase Auth) dan RLS ketat: tulis hanya `authenticated`; batasi baca `personel`; perbaiki policy `master_configs` | K1, K3 |
| **P0** | Guard stok minus di database (trigger/constraint) | K2 |
| **P1** | Perluas tes `vitest` ke `utils/stock.ts`, `shiftUtils.ts`, `compatibility.ts` | K6 |
| **P1** | Bila pengelolaan data master dibutuhkan lagi di aplikasi ini: bangun kembali dengan login (CRUD lengkap, nonaktifkan) | F-10 dihapus |
| **P1** | Modul pengajuan pembelian (PR) dari rekomendasi order | dashboard sudah menyebut "perlu pengajuan ulang (PR)" |
| **P1** | Catat lead time per sparepart, lalu ganti horizon 30 hari dengan lead time | F-07, 7.4 |
| **P2** | Model Weibull untuk sparepart dengan ≥ 10 penggantian | MTBF konstan tidak menangkap "makin tua makin rawan" |
| **P1** | Soft-delete sparepart (arsip) agar riwayat tidak hilang | BR-12 |
| **P2** | Cocokkan ukuran lembar Tom & Jerry dengan lembar fisik | F-05 |
| **P2** | PWA yang bisa di-install, dan notifikasi (dari backlog `HANDOFF.md`) | kenyamanan lapangan |
| **P2** | Template PDF jadwal shift harian (dari backlog `HANDOFF.md`) | permintaan lama |
| **P2** | Agregasi/pagination di database | K7 |
| **P3** | Bersihkan kode mati dan dependensi tak terpakai | [ARCHITECTURE.md bagian 12](ARCHITECTURE.md#12-utang-teknis-dan-batasan) |

## 13. Pertanyaan terbuka

1. Siapa yang boleh mengubah dan menghapus transaksi dan sparepart? Perlu peran (mis. teknisi vs koordinator)?
2. Setelah barang menjadi **rusak**, bagaimana alurnya (diserahkan ke vendor, dibuang, dihapus dari stok)? Apakah perlu status atau tipe transaksi sendiri?
3. Untuk `Serah Terima` jenis **terima**, apakah asal barang (IASS, SUP API, VENDOR, dst., yang kini hanya dicatat pada `Masuk`) juga perlu dicatat?
4. Apa target waktu pencatatan dan target akurasi stok yang diinginkan (bagian 10)?
5. Berapa banyak sparepart dan transaksi per bulan yang diperkirakan dalam 1–2 tahun (untuk menilai skala)?
6. Apakah banyak gudang perlu dikelola terpisah?
7. Apakah aplikasi lain di database yang sama membaca `current_stock` atau menulis tipe `Serah Terima`? Bila ya, aturannya harus disepakati bersama.
8. Ukuran dan margin lembar Tom & Jerry yang sebenarnya.
