# Spesifikasi: Predictive Maintenance v2 — MTBF otomatis dari data

**Status: DISETUJUI (U1–U8, 2 Oktober 2026) dan DIIMPLEMENTASIKAN (T1–T7)** · T8 (guard database) juga **diterapkan** · 2 Oktober 2026
Dokumen aktif (bukan bagian dari spesifikasi lama yang historis di folder ini).

> Terkait: [PRD F-07 dan F-08](../PRD.md#6-kebutuhan-fungsional) · [ARCHITECTURE 6.3–6.4](../ARCHITECTURE.md#6-logika-domain-lainnya) · [DATABASE 4.7–4.8](../DATABASE.md#4-kamus-tabel)

## 1. Keputusan pemilik

| # | Keputusan |
|---|---|
| K1 | Transaksi **Pakai wajib memilih unit** peralatan. |
| K2 | **Lead time belum ada datanya.** |
| K3 | Target tingkat layanan stok (**SLA**) = **98%**. |
| K4 | **MTBF manual dihapus.** MTBF terisi otomatis dari data transaksi; metode dipilih yang paling sesuai. |

Keputusan teknis pelengkap ditandai **[Usulan]**; semuanya disetujui pemilik pada 2 Oktober 2026 ([bagian 8](#8-hal-yang-perlu-dikonfirmasi)). Implementasi: `src/utils/reliability.ts` (+ `reliability.test.ts`).

## 2. Kondisi sekarang

- Rumus lama: `sisa = MTBF − (hari ini − pergantian terakhir)`, dengan MTBF dan tanggal pergantian diisi manual per sparepart. KRITIS bila sisa ≤ 7 hari, PERINGATAN bila ≤ 21 hari.
- Kelemahan: umur dihitung **per sparepart, bukan per unit**; ambang tetap dalam hari tidak adil antar-sparepart; MTBF manual tidak pernah dikoreksi data.
- Data live (2 Okt 2026): 4 sparepart, **semuanya masih nilai bawaan** (MTBF 180 hari, tanggal ganti 25 Juli 2026 = tanggal didaftarkan); **0 transaksi**. Unit cocok yang beroperasi: SP-003 = 17, SP-004 = 3, SP-005 = 10, SP-006 = 10.
- Akibatnya: setelah fitur ini dipasang, semua prediksi akan berstatus **"Belum cukup data"** sampai transaksi `Pakai` mulai tercatat. Itu konsekuensi jujur dari K4.

## 3. Istilah

| Istilah | Arti |
|---|---|
| **Posisi terpasang** | pasangan (sparepart, unit peralatan). Satu sparepart bisa terpasang di banyak unit. |
| **Pemasangan** | transaksi `Pakai` dengan `unit_id`. |
| **Penggantian** | pemasangan **kedua dan seterusnya** pada posisi yang sama: barang lama dianggap habis umur (rusak atau diganti preventif). |
| **Paparan** | total hari sebuah posisi diamati sejak pemasangan pertama yang tercatat. |
| **MTBF** di aplikasi ini | rata-rata waktu antar-penggantian (secara teknis *mean time between replacements*), termasuk penggantian preventif. |

Transaksi yang **tidak** dihitung sebagai penggantian: `Rusak` dari stok baru (cacat sebelum terpasang), `Bekas`, `Masuk`, `Serah Terima`.

## 4. Rumus

### 4.1 MTBF otomatis (per sparepart, digabung dari semua unit)

Metode: **total waktu operasi dibagi jumlah penggantian**, termasuk data tersensor (posisi yang belum pernah diganti tetap menyumbang waktu operasi). Ini penaksir standar keandalan untuk data sedikit. Rata-rata interval biasa akan bias ke bawah karena mengabaikan unit yang lama tidak rusak.

Untuk tiap posisi (sparepart, unit) dengan pemasangan pada tanggal `t1 < t2 < … < tk` dan jumlah pada pemasangan pertama `q1` (bawaan 1):

```
paparan(posisi)     = (akhir − t1) × q1
penggantian(posisi) = (total qty semua Pakai di posisi itu) − q1
akhir               = hari ini; atau tanggal unit berubah status, bila unit kini 'gudang'/'rusak'

MTBF = Σ paparan / Σ penggantian            (hanya bila Σ penggantian ≥ 1)
```

| Σ penggantian | Tampilan |
|---|---|
| 0 | **"Belum cukup data"** — "terpantau N hari, belum ada penggantian" |
| 1–2 | MTBF, keyakinan **rendah** |
| 3–9 | MTBF, keyakinan **sedang** |
| ≥ 10 | MTBF, keyakinan **tinggi** (kandidat model Weibull, lihat [bagian 9](#9-di-luar-lingkup)) |

**Contoh.** Sparepart di 3 unit, hari ini = hari ke-300:

| Unit | Pemasangan (hari ke-) | Paparan | Penggantian |
|---|---|---|---|
| A | 0, 120, 250 | 300 | 2 |
| B | 50 | 250 | 0 |
| C | 100, 260 | 200 | 1 |
| **Total** | | **750** | **3** |

MTBF = 750 / 3 = **250 hari** (keyakinan sedang). Bila hanya merata-ratakan interval yang selesai (120, 130, 160) hasilnya 137 hari, terlalu pesimis karena unit B yang 250 hari tanpa masalah diabaikan.

### 4.2 Status umur per posisi terpasang

```
umur  = hari ini − tanggal Pakai terakhir di posisi itu
rasio = umur / MTBF
```

| Status | Syarat **[Usulan]** |
|---|---|
| NORMAL | rasio < 70% |
| PERHATIAN | 70% ≤ rasio < 90% |
| KRITIS | 90% ≤ rasio ≤ 100% |
| LEWAT | rasio > 100% |
| BELUM CUKUP DATA | MTBF belum ada |

Ambang relatif terhadap MTBF, sehingga adil untuk sparepart berumur pendek maupun panjang. Ambang disimpan sebagai konstanta yang mudah diubah.

### 4.3 Kecukupan stok dengan SLA 98%

Karena lead time belum ada (K2), dipakai **horizon perencanaan H = 30 hari** **[Usulan]** sebagai pengganti sementara. Setelah ada data lead time, H diganti lead time per sparepart.

```
jendela  = hari sejak transaksi pertama sparepart itu, minimal 30, maksimal 365
r        = (total qty Pakai dalam jendela) / jendela        ← kebutuhan per hari
λ        = r × H                                            ← perkiraan kebutuhan selama H hari
titik_pesan_SLA = angka terkecil s dengan P(Poisson(λ) ≤ s) ≥ 0,98
titik_pesan     = max(titik_pesan_SLA, minimum_stok + 1)    [Usulan: minimum_stok tetap jadi batas bawah manual]
PESAN bila stok_baru < titik_pesan;  jumlah usulan = titik_pesan − stok_baru
```

- Yang dihitung **stok baru** saja, karena `Pakai` hanya mengambil dari stok baru.
- **Penjelasan implementasi:** batas bawahnya `minimum_stok + 1` (bukan `minimum_stok`) agar PESAN selalu muncul bila stok rendah menurut definisi aplikasi (`isLowStock`: stok baru **≤** minimum). Tanpa "+1", stok yang tepat sama dengan minimum dianggap rendah di Dashboard tetapi tidak dipesan di sini.
- Tanpa transaksi `Pakai` sama sekali, titik pesan SLA kosong dan stok minimum = 0 (PESAN hanya bila stok baru habis), dengan keterangan "belum cukup data".
- **Perubahan 2 Okt 2026:** `minimum_stok` tidak lagi diisi manual. Nilainya `titik_pesan_SLA − 1` (`autoMinimumStock`), sehingga `titik_pesan = max(titik_pesan_SLA, minimum + 1)` sama dengan titik pesan SLA.

**Contoh.** 6 kali `Pakai` dalam 180 hari → r = 0,0333/hari → λ = 1,0 untuk 30 hari.
Poisson(1,0): P(≤2) = 92,0%, **P(≤3) = 98,1%** → titik pesan SLA = **3**. Dengan stok baru 1 → PESAN 2.

### 4.4 Kebutuhan tahunan

`kebutuhan_tahunan = r × 365` (dibulatkan ke atas). Cabang lama berbasis MTBF manual dihapus. Tanpa data → "belum cukup data" dan tidak ada rekomendasi order tahunan.

Rekomendasi order tahunan = `max(0, kebutuhan_tahunan − stok_baru)`. Stok bekas tidak lagi ikut dikurangkan (sebelumnya `baru + bekas`), dengan alasan yang sama seperti 4.3: `Pakai` hanya mengambil stok baru.

### 4.5 Klasifikasi rotasi stok (ditambahkan 2 Okt 2026)

Memakai `r` dan jendela yang sama dengan 4.3/4.4, supaya laporan rotasi, kebutuhan tahunan, dan "top moving" di Dashboard satu angka.

| Kelas | Syarat |
|---|---|
| Fast | qty `Pakai` dalam jendela × 30 ≥ panjang jendela (rata-rata ≥ 1 per bulan) |
| Medium | ada `Pakai`, kurang dari itu |
| Slow | tanpa `Pakai`, riwayat sparepart ≥ 30 hari |
| Belum cukup data | tanpa `Pakai`, riwayat < 30 hari |

Hanya `Pakai` yang dihitung; Masuk, Bekas, Rusak, dan Serah Terima (termasuk stok awal saat mendaftar) bukan perputaran.

## 5. Perubahan aplikasi

| Area | Perubahan |
|---|---|
| Modul baru `src/utils/reliability.ts` | fungsi murni: `buildPositions`, `estimateMtbf`, `positionStatus`, `demandRate`, `poissonReorderPoint`. Tidak menyentuh Supabase. |
| `InventoryContext` | `getPredictiveAlerts` dan `getAnnualNeeds` memakai modul baru. `addMutation`/`updateMutation` **menolak `Pakai` tanpa unit**. Berhenti membaca dan menulis `mtbf_days` dan `last_replaced_at`. |
| Input Transaksi, Scanner | unit **wajib** untuk `Pakai`. Daftar unit: unit kompatibel di atas, lalu "unit lain" (agar `Pakai` tidak terblokir saat data kompatibilitas belum lengkap). Untuk `Bekas` dan `Rusak` unit tetap opsional. |
| History (edit) | modal edit mendapat pilihan unit; mengubah tipe menjadi `Pakai` wajib memilih unit. |
| Katalog | hapus isian **MTBF** dan **Terakhir Diganti** [Usulan]; tampilkan "MTBF (data): N hari · k penggantian · keyakinan …" atau "Belum cukup data". |
| Peringatan (`/alerts`) | dua bagian: (1) **Umur komponen terpasang** per posisi (unit, lokasi, terpasang sejak, umur, MTBF, rasio, status); (2) **Kecukupan stok 30 hari @ SLA 98%** per sparepart (r, λ, titik pesan, stok baru, status PESAN, jumlah usulan). |
| Kebutuhan (`/needs`) | hanya dasar data riil; "belum cukup data" bila kosong. |
| Header | jumlah "kritis" = posisi KRITIS + LEWAT + sparepart PESAN. |

## 6. Perubahan database

- **Tidak perlu kolom baru.** Semua dihitung dari `stock_mutations` (`unit_id`, `created_at`, `qty`) dan `unit_peralatan` (`status`, `updated_at`).
- `spareparts.mtbf_days` dan `spareparts.last_replaced_at` **tidak dipakai lagi** tetapi **tidak dihapus** dulu (tanpa migrasi destruktif). Penghapusan kolom bisa jadi migrasi terpisah setelah dipastikan tidak ada aplikasi lain yang membacanya.
- **[Usulan, disetujui]** guard database agar aturan K1 juga berlaku bagi penulis lain. Aman untuk data sekarang (0 transaksi), tetapi akan menolak `Pakai` tanpa unit dari aplikasi lain bila ada.
  - Saat diuji, bentuk `CHECK (mutation_type <> 'Pakai' OR unit_id IS NOT NULL)` ternyata **mencegah penghapusan unit** yang punya riwayat `Pakai`, karena FK `unit_id ON DELETE SET NULL` melanggar CHECK.
  - Penggantinya adalah **trigger** yang hanya memeriksa penulisan langsung, sehingga penghapusan unit tetap berjalan: [`migrations/2026-10-02_pakai_wajib_unit.sql`](../migrations/2026-10-02_pakai_wajib_unit.sql). Diterapkan pada 2 Okt 2026 atas persetujuan pemilik.

## 7. Tiket

| # | Tiket | Kriteria selesai |
|---|---|---|
| T1 | `utils/reliability.ts` + **tes otomatis** (menambah `vitest` sebagai dev-dependency) | contoh 4.1 menghasilkan 250 hari / keyakinan sedang; contoh 4.3 menghasilkan titik pesan 3; posisi tanpa penggantian → MTBF kosong |
| T2 | `Pakai` wajib unit di Input Transaksi, Scanner, edit History, dan validasi di `InventoryContext` | form tidak bisa dikirim tanpa unit; `addMutation`/`updateMutation` menolak dengan pesan jelas; payload yang dicegat berisi `unit_id` |
| T3 | Ganti `getPredictiveAlerts` dan `getAnnualNeeds` | tanpa transaksi semua berstatus "Belum cukup data"; tidak ada lagi rujukan `mtbf_days`/`last_replaced_at` di perhitungan |
| T4 | Halaman Peringatan dua bagian | tampil benar untuk data kosong dan untuk data simulasi (dicegat, tanpa menulis ke produksi) |
| T5 | Katalog: hapus isian manual, tampilkan MTBF otomatis | payload tambah/ubah sparepart tidak lagi berisi `mtbf_days`/`last_replaced_at` |
| T6 | Kebutuhan tahunan dan header | sesuai 4.4 dan bagian 5 |
| T7 | Dokumen: PRD (F-07, F-08, aturan 7.4–7.5), ARCHITECTURE (6.3–6.4), DATABASE (4.7), README, AGENTS; `graphify update` | tautan valid; isi sesuai kode |
| T8 | (opsional, butuh persetujuan) guard database untuk K1 | diuji dalam transaksi yang dibatalkan, juga sebagai `anon` — **diterapkan 2 Okt 2026** (migrasi `pakai_wajib_unit`) |

Verifikasi: `typecheck`, `build`, tes `vitest`, uji browser dengan penulisan dicegat, dan perbandingan hasil terhadap contoh di bagian 4.

## 8. Hal yang perlu dikonfirmasi

Semua usulan U1–U8 **disetujui pemilik** pada 2 Oktober 2026. Untuk U8, bentuk akhirnya trigger, bukan CHECK (lihat [bagian 6](#6-perubahan-database)).


| # | Usulan saya | Alternatif |
|---|---|---|
| U1 | MTBF = total paparan ÷ jumlah penggantian (model laju kerusakan konstan) | Weibull (butuh ≥ 10 penggantian per sparepart) |
| U2 | Horizon 30 hari sampai lead time ada | 14 / 60 / 90 hari |
| U3 | Ambang umur 70% / 90% / 100% MTBF | angka lain |
| U4 | Hapus juga isian **Terakhir Diganti** (ikut tidak dipakai) | biarkan sebagai catatan saja |
| U5 | ~~`minimum_stok` tetap sebagai batas bawah manual titik pesan~~ **Diganti (2 Okt 2026, atas permintaan pemilik): stok minimum dihitung otomatis** = titik pesan SLA − 1, 0 tanpa pemakaian; isian manual dihapus | hapus, hanya pakai SLA 98% |
| U6 | Daftar unit untuk `Pakai` mencakup unit non-kompatibel (di grup terpisah) | hanya unit kompatibel |
| U7 | Tambah `vitest` untuk menguji rumus | tanpa tes otomatis |
| U8 | Constraint database `Pakai` wajib unit (T8) | hanya di aplikasi |

## 9. Di luar lingkup

- Model Weibull (pola "makin tua makin rawan"): setelah ada sparepart dengan ≥ 10 penggantian.
- Lead time per sparepart: setelah datanya tersedia (akan menggantikan H = 30).
- Riwayat sebelum aplikasi dipakai: tidak diketahui; umur posisi dimulai dari pemasangan pertama yang tercatat.
- `Pakai` dari stok bekas (rotable dipasang ulang): model aliran stok saat ini belum mendukungnya.
- Jumlah komponen sejenis per unit: diambil dari qty pemasangan pertama, bukan dari data master.
