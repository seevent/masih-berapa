// How each type moves stock between the baru / bekas / rusak buckets: see src/utils/stock.ts
export type MutationType = 'Masuk' | 'Pakai' | 'Bekas' | 'Rusak' | 'Serah Terima';
export type StockBucketValue = 'baru' | 'bekas' | 'rusak';
export type SupplierType = 'SUP API' | 'SISA PEKERJAAN' | 'IASS' | 'MANDIRI' | 'DARI UNIT LAIN' | 'VENDOR';
export type UnitStatus = 'operasi' | 'standby' | 'gudang' | 'rusak';

// --- Database Table Types matching exact Supabase Schema ---

export interface JenisPeralatan {
  id: string;
  nama: string;
  tampil_di_kalibrasi?: boolean;
}

export interface TipePeralatan {
  id: string;
  id_jenis: string;
  nama: string;
  varian?: string;
  jenis_nama?: string;
}

export interface Lokasi {
  id: string;
  nama: string;
}

export interface TitikLokasi {
  id: string;
  id_lokasi: string;
  nomor: string;
  lokasi_nama?: string;
}

export interface UnitPeralatan {
  id: string;
  id_tipe: string;
  serial_number?: string;
  no_sertifikasi?: string;
  tahun_instalasi?: number;
  milik?: string;
  status: UnitStatus;
  catatan?: string;
  foto_url?: string;
  ampere?: string;
  created_at?: string;
  updated_at?: string;
  tipe_nama?: string;
  jenis_nama?: string;
}

export interface PenempatanPeralatan {
  id: string;
  id_tipe?: string;
  id_lokasi?: string;
  id_titik?: string;
  id_unit?: string;
  is_active: boolean;
  created_at?: string;
  tipe_nama?: string;
  lokasi_nama?: string;
  titik_nomor?: string;
}

export interface UnitKerja {
  id: string;
  nama: string;
  created_at?: string;
}

export interface Personel {
  id: string;
  nik: string;
  nama: string;
  no_hp?: string;
  unit_id?: string;
  jabatan?: string;
  urutan?: number;
  created_at?: string;
  unit_nama?: string;
}

export interface JadwalShift {
  id: string;
  personel_id: string;
  tanggal: string;
  shift: string; // 'PS' (Pagi/Siang 08-20) | 'M' (Malam 20-08); legacy: 'Pagi' | 'Siang' | 'Malam'
  status_kehadiran?: string;
  created_at?: string;
  personel_nama?: string;
}

export interface MasterConfig {
  id: string;
  key: string;
  value: any;
  updated_at?: string;
}

// --- Sparepart & Mutation Relational Catalog Interfaces ---

export interface Sparepart {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unit?: string;
  minimum_stok: number;
  lokasi?: string;
  rack?: string;
  created_at?: string;
  updated_at?: string;
  // Computed client-side from sparepart_compatibility (not database columns).
  // The old `spareparts.id_tipe` column is no longer read or written.
  /** Compatible tipe peralatan, sorted by name */
  tipe_ids: string[];
  /** Jenis peralatan of the compatible tipe (unique) */
  jenis_ids: string[];
  /** Compatible tipe names joined with ", " ('Umum' when none) */
  equipment_type_name: string;
  /** Jenis names joined with ", " ('Umum' when none) */
  jenis_name: string;
  stok_aktual: number;
  stok_bekas: number;
  stok_rusak: number;
}

export interface StockMutation {
  id: string;
  sparepart_id: string;
  unit_id?: string;       // Foreign key to unit_peralatan
  personel_id?: string;   // Foreign key to personel
  sparepart_sku?: string;
  sparepart_name?: string;
  mutation_type: MutationType;
  sumber?: SupplierType | null;
  qty: number;
  /** Bucket that decreases (null = from outside the warehouse) */
  stok_asal?: StockBucketValue | null;
  /** Bucket that increases (null = leaves the warehouse) */
  stok_tujuan?: StockBucketValue | null;
  location?: string | null;
  /** Serah Terima: the other party (receiver when handed over, giver when received) */
  penerima?: string | null;
  unit_penerima?: string | null;
  operator_name?: string;
  notes?: string | null;
  created_at: string;
}

export interface SparepartCompatibility {
  id: string;
  sparepart_id: string;
  id_tipe: string;
  is_primary?: boolean;
  created_at?: string;
}

export interface PurchaseRequisition {
  id: string;
  pr_number: string;
  sparepart_id: string;
  requested_by?: string;
  requested_qty: number;
  urgency: 'CRITICAL' | 'WARNING' | 'ROUTINE';
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

