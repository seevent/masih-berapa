export type MutationType = 'Masuk' | 'Pakai' | 'Bekas' | 'Rusak';
export type SupplierType = 'SUP API' | 'SISA PEKERJAAN' | 'IAS' | 'MANDIRI' | 'DARI UNIT LAIN' | 'VENDOR';
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
  shift: string; // 'Pagi' | 'Siang' | 'Malam' | 'Off'
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
  id_tipe: string;
  id_jenis?: string;
  equipment_type_name?: string;
  unit?: string;
  stok_aktual: number;
  stok_bekas: number;
  minimum_stok: number;
  location?: string;
  lokasi?: string;
  rack?: string;
  location_rack?: string; // backwards compatibility helper
  mtbf_days?: number;
  last_replaced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockMutation {
  id: string;
  sparepart_id: string;
  unit_id?: string;       // Foreign key to unit_peralatan
  personel_id?: string;   // Foreign key to personel
  sparepart_sku?: string;
  sparepart_name?: string;
  mutation_type: MutationType;
  sumber?: SupplierType;
  qty: number;
  operator_name?: string;
  reference_no?: string;
  notes?: string;
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

export interface PredictiveAlert {
  sparepart: Sparepart;
  days_used: number;
  remaining_days: number;
  urgency: 'CRITICAL' | 'WARNING' | 'NORMAL';
  is_stock_empty: boolean;
}

export interface AnnualNeed {
  sparepart: Sparepart;
  annual_forecast_qty: number;
  total_available_stock: number;
  order_needed_qty: number;
  estimated_cost: number;
}
