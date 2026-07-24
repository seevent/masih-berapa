import {
  JenisPeralatan,
  TipePeralatan,
  Lokasi,
  TitikLokasi,
  UnitPeralatan,
  PenempatanPeralatan,
  UnitKerja,
  Personel,
  JadwalShift,
  MasterConfig,
  Sparepart,
  StockMutation,
  SparepartCompatibility
} from '../types';

export const INITIAL_JENIS_PERALATAN: JenisPeralatan[] = [
  { id: '10000000-0000-4000-8000-000000000001', nama: 'Baggage Handling System (BHS)', tampil_di_kalibrasi: false },
  { id: '10000000-0000-4000-8000-000000000002', nama: 'HVAC & Chiller Presisi', tampil_di_kalibrasi: true },
  { id: '10000000-0000-4000-8000-000000000003', nama: 'Pembangkit & Substation Listrik', tampil_di_kalibrasi: true },
  { id: '10000000-0000-4000-8000-000000000004', nama: 'X-Ray & Screening Detector', tampil_di_kalibrasi: true },
  { id: '10000000-0000-4000-8000-000000000005', nama: 'Sistem Pompa Hydrant & BFP', tampil_di_kalibrasi: false }
];

export const INITIAL_TIPE_PERALATAN: TipePeralatan[] = [
  { id: '20000000-0000-4000-8000-000000000001', id_jenis: '10000000-0000-4000-8000-000000000001', nama: 'Main Check-in Conveyor Belt', varian: 'Heavy Duty PVC 3-ply' },
  { id: '20000000-0000-4000-8000-000000000002', id_jenis: '10000000-0000-4000-8000-000000000001', nama: 'Baggage Carousel 360', varian: 'Stainless Steel Slat Type' },
  { id: '20000000-0000-4000-8000-000000000003', id_jenis: '10000000-0000-4000-8000-000000000002', nama: 'Chiller Trane Centrifugal 500TR', varian: 'R-134a Water-Cooled' },
  { id: '20000000-0000-4000-8000-000000000004', id_jenis: '10000000-0000-4000-8000-000000000003', nama: 'Genset Caterpillar 1000kVA', varian: 'Diesel Silent Type 380V' },
  { id: '20000000-0000-4000-8000-000000000005', id_jenis: '10000000-0000-4000-8000-000000000004', nama: 'Dual View X-Ray Scanner 620XR', varian: 'Dual Energy Line Scanner' },
  { id: '20000000-0000-4000-8000-000000000006', id_jenis: '10000000-0000-4000-8000-000000000005', nama: 'Boiler Feed Pump (BFP) Multistage', varian: 'High Pressure Centrifugal' }
];

export const INITIAL_LOKASI: Lokasi[] = [
  { id: '30000000-0000-4000-8000-000000000001', nama: 'Terminal 2D (Keberangkatan Domestik)' },
  { id: '30000000-0000-4000-8000-000000000002', nama: 'Terminal 2E (Keberangkatan Internasional)' },
  { id: '30000000-0000-4000-8000-000000000003', nama: 'Terminal 2F (Kedatangan & Baggage Claim)' },
  { id: '30000000-0000-4000-8000-000000000004', nama: 'Gedung Substation T2 Utama' },
  { id: '30000000-0000-4000-8000-000000000005', nama: 'Gedung Utility Chiller T2' }
];

export const INITIAL_TITIK_LOKASI: TitikLokasi[] = [
  { id: '40000000-0000-4000-8000-000000000001', id_lokasi: '30000000-0000-4000-8000-000000000001', nomor: 'Titik 01-A (Island Check-in 1-12)' },
  { id: '40000000-0000-4000-8000-000000000002', id_lokasi: '30000000-0000-4000-8000-000000000002', nomor: 'Titik 02-B (Security Check Point 1)' },
  { id: '40000000-0000-4000-8000-000000000003', id_lokasi: '30000000-0000-4000-8000-000000000003', nomor: 'Titik 03-C (Carousel Claim #4)' },
  { id: '40000000-0000-4000-8000-000000000004', id_lokasi: '30000000-0000-4000-8000-000000000004', nomor: 'Titik SS-01 (Ruang Transformer 20kV)' },
  { id: '40000000-0000-4000-8000-000000000005', id_lokasi: '30000000-0000-4000-8000-000000000005', nomor: 'Titik CH-02 (Plant Floor Utama)' }
];

export const INITIAL_UNIT_PERALATAN: UnitPeralatan[] = [
  {
    id: '50000000-0000-4000-8000-000000000101',
    id_tipe: '20000000-0000-4000-8000-000000000001',
    serial_number: 'SN-BHS-2023-001',
    no_sertifikasi: 'CERT-AP2-BHS-991',
    tahun_instalasi: 2021,
    milik: 'Injourney / AP2',
    status: 'operasi',
    catatan: 'Motor gearbox baru di-service overhaul Januari 2026',
    foto_url: '',
    ampere: '45A',
    created_at: '2025-01-10T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z'
  },
  {
    id: '50000000-0000-4000-8000-000000000102',
    id_tipe: '20000000-0000-4000-8000-000000000003',
    serial_number: 'SN-TRANE-CH-500',
    no_sertifikasi: 'CERT-DISNAKER-AC-2024',
    tahun_instalasi: 2019,
    milik: 'Injourney / AP2',
    status: 'operasi',
    catatan: 'Pressure refrigerant normal, rutin pergantian oil filter',
    foto_url: '',
    ampere: '320A',
    created_at: '2025-01-12T08:00:00Z',
    updated_at: '2026-01-20T08:00:00Z'
  },
  {
    id: '50000000-0000-4000-8000-000000000103',
    id_tipe: '20000000-0000-4000-8000-000000000004',
    serial_number: 'SN-CAT-1000-T2',
    no_sertifikasi: 'CERT-SLO-PLN-1000KVA',
    tahun_instalasi: 2020,
    milik: 'Injourney / AP2',
    status: 'standby',
    catatan: 'Status otomatis standby ATS/AMF genset darurat',
    foto_url: '',
    ampere: '1400A',
    created_at: '2025-01-15T08:00:00Z',
    updated_at: '2026-02-01T08:00:00Z'
  },
  {
    id: '50000000-0000-4000-8000-000000000104',
    id_tipe: '20000000-0000-4000-8000-000000000005',
    serial_number: 'SN-RAPISCAN-620-88',
    no_sertifikasi: 'CERT-BATAN-XRAY-2025',
    tahun_instalasi: 2022,
    milik: 'Injourney / AP2',
    status: 'operasi',
    catatan: 'Kalibrasi radiasi BAPETEN berlaku hingga Des 2026',
    foto_url: '',
    ampere: '16A',
    created_at: '2025-02-01T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z'
  },
  {
    id: '50000000-0000-4000-8000-000000000105',
    id_tipe: '20000000-0000-4000-8000-000000000006',
    serial_number: 'SN-BFP-KSB-400',
    no_sertifikasi: 'CERT-ME-BFP-2023',
    tahun_instalasi: 2018,
    milik: 'Injourney / AP2',
    status: 'rusak',
    catatan: 'Vibrasi tinggi pada bearing poros impeller, menunggu pergantian sparepart',
    foto_url: '',
    ampere: '110A',
    created_at: '2025-02-10T08:00:00Z',
    updated_at: '2026-02-15T08:00:00Z'
  }
];

export const INITIAL_PENEMPATAN_PERALATAN: PenempatanPeralatan[] = [
  {
    id: '55000000-0000-4000-8000-000000000001',
    id_tipe: '20000000-0000-4000-8000-000000000001',
    id_lokasi: '30000000-0000-4000-8000-000000000001',
    id_titik: '40000000-0000-4000-8000-000000000001',
    id_unit: '50000000-0000-4000-8000-000000000101',
    is_active: true,
    created_at: '2025-01-10T08:00:00Z'
  },
  {
    id: '55000000-0000-4000-8000-000000000002',
    id_tipe: '20000000-0000-4000-8000-000000000003',
    id_lokasi: '30000000-0000-4000-8000-000000000005',
    id_titik: '40000000-0000-4000-8000-000000000005',
    id_unit: '50000000-0000-4000-8000-000000000102',
    is_active: true,
    created_at: '2025-01-12T08:00:00Z'
  },
  {
    id: '55000000-0000-4000-8000-000000000003',
    id_tipe: '20000000-0000-4000-8000-000000000004',
    id_lokasi: '30000000-0000-4000-8000-000000000004',
    id_titik: '40000000-0000-4000-8000-000000000004',
    id_unit: '50000000-0000-4000-8000-000000000103',
    is_active: true,
    created_at: '2025-01-15T08:00:00Z'
  },
  {
    id: '55000000-0000-4000-8000-000000000004',
    id_tipe: '20000000-0000-4000-8000-000000000005',
    id_lokasi: '30000000-0000-4000-8000-000000000002',
    id_titik: '40000000-0000-4000-8000-000000000002',
    id_unit: '50000000-0000-4000-8000-000000000104',
    is_active: true,
    created_at: '2025-02-01T08:00:00Z'
  }
];

export const INITIAL_UNIT_KERJA: UnitKerja[] = [
  { id: '60000000-0000-4000-8000-000000000001', nama: 'Maintenance Facility & Equipment (MFE T2)' },
  { id: '60000000-0000-4000-8000-000000000002', nama: 'Electrical & Substation Operations' },
  { id: '60000000-0000-4000-8000-000000000003', nama: 'Baggage Handling System (BHS Automation)' },
  { id: '60000000-0000-4000-8000-000000000004', nama: 'Gudang & Logistik Sparepart Operasional' }
];

export const INITIAL_PERSONEL: Personel[] = [
  {
    id: '70000000-0000-4000-8000-000000000001',
    nik: '10098231',
    nama: 'Budi Santoso',
    no_hp: '081298765432',
    unit_id: '60000000-0000-4000-8000-000000000004',
    jabatan: 'Head of Inventory Admin',
    urutan: 1,
    created_at: '2025-01-01T08:00:00Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000002',
    nik: '10098232',
    nama: 'Agus Maintenance',
    no_hp: '081311223344',
    unit_id: '60000000-0000-4000-8000-000000000001',
    jabatan: 'Senior Mechanical Technician',
    urutan: 2,
    created_at: '2025-01-01T08:00:00Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000003',
    nik: '10098233',
    nama: 'Doni Mekanik',
    no_hp: '081599887766',
    unit_id: '60000000-0000-4000-8000-000000000003',
    jabatan: 'BHS Systems Specialist',
    urutan: 3,
    created_at: '2025-01-01T08:00:00Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000004',
    nik: '10098234',
    nama: 'Rian Teknisi Listrik',
    no_hp: '081744556677',
    unit_id: '60000000-0000-4000-8000-000000000002',
    jabatan: 'Substation Electrical Engineer',
    urutan: 4,
    created_at: '2025-01-01T08:00:00Z'
  }
];

export const INITIAL_JADWAL_SHIFT: JadwalShift[] = [
  {
    id: '80000000-0000-4000-8000-000000000001',
    personel_id: '70000000-0000-4000-8000-000000000001',
    tanggal: '2026-07-22',
    shift: 'Pagi',
    status_kehadiran: 'Hadir',
    created_at: '2026-07-22T08:00:00Z'
  },
  {
    id: '80000000-0000-4000-8000-000000000002',
    personel_id: '70000000-0000-4000-8000-000000000002',
    tanggal: '2026-07-22',
    shift: 'Pagi',
    status_kehadiran: 'Hadir',
    created_at: '2026-07-22T08:00:00Z'
  },
  {
    id: '80000000-0000-4000-8000-000000000003',
    personel_id: '70000000-0000-4000-8000-000000000003',
    tanggal: '2026-07-22',
    shift: 'Siang',
    status_kehadiran: 'Hadir',
    created_at: '2026-07-22T08:00:00Z'
  },
  {
    id: '80000000-0000-4000-8000-000000000004',
    personel_id: '70000000-0000-4000-8000-000000000004',
    tanggal: '2026-07-22',
    shift: 'Malam',
    status_kehadiran: 'Hadir',
    created_at: '2026-07-22T08:00:00Z'
  }
];

export const INITIAL_MASTER_CONFIGS: MasterConfig[] = [
  {
    id: '85000000-0000-4000-8000-000000000001',
    key: 'app_settings',
    value: {
      app_name: 'SSES T2 Sparepart Management - Masih Berapa',
      version: '1.0.0',
      min_stock_alert_global: 5,
      mtbf_alert_days_threshold: 30
    },
    updated_at: '2026-07-22T08:00:00Z'
  }
];

export const INITIAL_SPAREPARTS: Sparepart[] = [
  {
    id: '90000000-0000-4000-8000-000000000101',
    sku: 'SP-SKF-6205ZZ',
    name: 'Bearing SKF 6205-2Z High Speed',
    description: 'Deep groove ball bearing shielded 25x52x15 mm',
    id_tipe: '20000000-0000-4000-8000-000000000006',
    id_jenis: '10000000-0000-4000-8000-000000000005',
    equipment_type_name: 'Boiler Feed Pump (BFP) Multistage',
    unit: 'PCS',
    stok_aktual: 3,
    stok_bekas: 2,
    minimum_stok: 5,
    location: 'Gudang Utility Chiller T2',
    rack: 'RAK-A1-04',
    location_rack: 'RAK-A1-04',
    supplier_type: 'VENDOR',
    mtbf_days: 180,
    last_replaced_at: '2025-10-15',
    created_at: '2025-01-10T08:00:00Z'
  },
  {
    id: '90000000-0000-4000-8000-000000000102',
    sku: 'SP-SEAL-TC-3552',
    name: 'Oil Seal TC 35x52x7 Viton High Temp',
    description: 'Fluorocarbon rubber double lip oil seal resistant up to 200C',
    id_tipe: '20000000-0000-4000-8000-000000000006',
    id_jenis: '10000000-0000-4000-8000-000000000005',
    equipment_type_name: 'Boiler Feed Pump (BFP) Multistage',
    unit: 'PCS',
    stok_aktual: 12,
    stok_bekas: 0,
    minimum_stok: 6,
    location: 'Gudang Utility Chiller T2',
    rack: 'RAK-A2-12',
    location_rack: 'RAK-A2-12',
    supplier_type: 'SUP API',
    mtbf_days: 120,
    last_replaced_at: '2026-01-20',
    created_at: '2025-01-12T08:00:00Z'
  },
  {
    id: '90000000-0000-4000-8000-000000000103',
    sku: 'SP-BELT-B112-OPT',
    name: 'V-Belt Optibelt Red Power B112',
    description: 'Maintenance-free wedge v-belt for conveyor motor drive',
    id_tipe: '20000000-0000-4000-8000-000000000001',
    id_jenis: '10000000-0000-4000-8000-000000000001',
    equipment_type_name: 'Main Check-in Conveyor Belt',
    unit: 'PCS',
    stok_aktual: 2,
    stok_bekas: 1,
    minimum_stok: 4,
    location: 'Terminal 2D Domestik',
    rack: 'RAK-B3-01',
    location_rack: 'RAK-B3-01',
    supplier_type: 'VENDOR',
    mtbf_days: 90,
    last_replaced_at: '2025-11-01',
    created_at: '2025-01-15T08:00:00Z'
  },
  {
    id: '90000000-0000-4000-8000-000000000104',
    sku: 'SP-SOL-SMC-24V',
    name: 'Solenoid Valve SMC 5 Port 24VDC',
    description: 'Pneumatic control valve SY5120-5D-C6',
    id_tipe: '20000000-0000-4000-8000-000000000005',
    id_jenis: '10000000-0000-4000-8000-000000000004',
    equipment_type_name: 'Dual View X-Ray Scanner 620XR',
    unit: 'SET',
    stok_aktual: 8,
    stok_bekas: 3,
    minimum_stok: 3,
    location: 'Terminal 2E Internasional',
    rack: 'RAK-C1-05',
    location_rack: 'RAK-C1-05',
    supplier_type: 'VENDOR',
    mtbf_days: 365,
    last_replaced_at: '2025-06-15',
    created_at: '2025-02-01T08:00:00Z'
  },
  {
    id: '90000000-0000-4000-8000-000000000105',
    sku: 'SP-FLT-MANN-C15',
    name: 'Air Filter Element Mann C15300',
    description: 'Heavy duty air intake filter cartridge',
    id_tipe: '20000000-0000-4000-8000-000000000003',
    id_jenis: '10000000-0000-4000-8000-000000000002',
    equipment_type_name: 'Chiller Trane Centrifugal 500TR',
    unit: 'PCS',
    stok_aktual: 1,
    stok_bekas: 0,
    minimum_stok: 4,
    location: 'Gedung Utility Chiller T2',
    rack: 'RAK-C2-02',
    location_rack: 'RAK-C2-02',
    supplier_type: 'SUP API',
    mtbf_days: 90,
    last_replaced_at: '2026-05-10',
    created_at: '2025-02-10T08:00:00Z'
  },
  {
    id: '90000000-0000-4000-8000-000000000106',
    sku: 'SP-COUP-ROTEX-38',
    name: 'Coupling Spider Rotex 38 PUR 92 Sh-A',
    description: 'Polyurethane flexible insert spider coupling yellow',
    id_tipe: '20000000-0000-4000-8000-000000000004',
    id_jenis: '10000000-0000-4000-8000-000000000003',
    equipment_type_name: 'Genset Caterpillar 1000kVA',
    unit: 'PCS',
    stok_aktual: 5,
    stok_bekas: 2,
    minimum_stok: 2,
    location: 'Gedung Substation T2 Utama',
    rack: 'RAK-A3-09',
    location_rack: 'RAK-A3-09',
    supplier_type: 'VENDOR',
    mtbf_days: 240,
    last_replaced_at: '2025-08-20',
    created_at: '2025-02-15T08:00:00Z'
  },
  {
    id: '90000000-0000-4000-8000-000000000107',
    sku: 'SP-AVR-STAM-MX321',
    name: 'Automatic Voltage Regulator MX321',
    description: 'Analog AVR module for Stamford generator 500kVA',
    id_tipe: '20000000-0000-4000-8000-000000000004',
    id_jenis: '10000000-0000-4000-8000-000000000003',
    equipment_type_name: 'Genset Caterpillar 1000kVA',
    unit: 'UNIT',
    stok_aktual: 2,
    stok_bekas: 1,
    minimum_stok: 1,
    location: 'Gedung Substation T2 Utama',
    rack: 'RAK-E1-01',
    location_rack: 'RAK-E1-01',
    supplier_type: 'VENDOR',
    mtbf_days: 730,
    last_replaced_at: '2024-12-01',
    created_at: '2025-03-01T08:00:00Z'
  }
];

export const INITIAL_MUTATIONS: StockMutation[] = [
  {
    id: '99000000-0000-4000-8000-000000000001',
    sparepart_id: '90000000-0000-4000-8000-000000000101',
    sparepart_sku: 'SP-SKF-6205ZZ',
    sparepart_name: 'Bearing SKF 6205-2Z High Speed',
    mutation_type: 'Masuk',
    qty: 10,
    operator_name: 'Budi Santoso (Head of Inventory)',
    reference_no: 'PO-2026-0089',
    notes: 'Penerimaan stok dari PT Mahkota Industri',
    created_at: '2026-07-01T09:30:00Z'
  },
  {
    id: '99000000-0000-4000-8000-000000000002',
    sparepart_id: '90000000-0000-4000-8000-000000000101',
    sparepart_sku: 'SP-SKF-6205ZZ',
    sparepart_name: 'Bearing SKF 6205-2Z High Speed',
    mutation_type: 'Pakai',
    qty: 2,
    operator_name: 'Agus Maintenance',
    reference_no: 'WO-BFP-9902',
    notes: 'Penggantian bearing pompa BFP-2 trip vibration',
    created_at: '2026-07-10T14:15:00Z'
  },
  {
    id: '99000000-0000-4000-8000-000000000003',
    sparepart_id: '90000000-0000-4000-8000-000000000103',
    sparepart_sku: 'SP-BELT-B112-OPT',
    sparepart_name: 'V-Belt Optibelt Red Power B112',
    mutation_type: 'Bekas',
    qty: 1,
    operator_name: 'Doni Mekanik',
    reference_no: 'WO-CONV-1021',
    notes: 'Pengembalian V-belt bekas pencopotan conveyor C-01, kondisi masih layak backup',
    created_at: '2026-07-15T11:00:00Z'
  },
  {
    id: '99000000-0000-4000-8000-000000000004',
    sparepart_id: '90000000-0000-4000-8000-000000000105',
    sparepart_sku: 'SP-FLT-MANN-C15',
    sparepart_name: 'Air Filter Element Mann C15300',
    mutation_type: 'Rusak',
    qty: 1,
    operator_name: 'Budi Santoso',
    reference_no: 'SCRAP-2026-004',
    notes: 'Filter lama kotor dan sobek total saat dismantling',
    created_at: '2026-07-18T16:20:00Z'
  }
];

export const INITIAL_SPAREPART_COMPATIBILITY: SparepartCompatibility[] = [
  { id: '80000000-0000-4000-8000-000000000001', sparepart_id: '90000000-0000-4000-8000-000000000101', id_tipe: '20000000-0000-4000-8000-000000000006', is_primary: true },
  { id: '80000000-0000-4000-8000-000000000002', sparepart_id: '90000000-0000-4000-8000-000000000101', id_tipe: '20000000-0000-4000-8000-000000000001', is_primary: false },
  { id: '80000000-0000-4000-8000-000000000003', sparepart_id: '90000000-0000-4000-8000-000000000102', id_tipe: '20000000-0000-4000-8000-000000000003', is_primary: true },
  { id: '80000000-0000-4000-8000-000000000004', sparepart_id: '90000000-0000-4000-8000-000000000103', id_tipe: '20000000-0000-4000-8000-000000000001', is_primary: true },
  { id: '80000000-0000-4000-8000-000000000005', sparepart_id: '90000000-0000-4000-8000-000000000104', id_tipe: '20000000-0000-4000-8000-000000000005', is_primary: true },
  { id: '80000000-0000-4000-8000-000000000006', sparepart_id: '90000000-0000-4000-8000-000000000105', id_tipe: '20000000-0000-4000-8000-000000000004', is_primary: true },
  { id: '80000000-0000-4000-8000-000000000007', sparepart_id: '90000000-0000-4000-8000-000000000106', id_tipe: '20000000-0000-4000-8000-000000000002', is_primary: true },
  { id: '80000000-0000-4000-8000-000000000008', sparepart_id: '90000000-0000-4000-8000-000000000107', id_tipe: '20000000-0000-4000-8000-000000000004', is_primary: true }
];
