import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  INITIAL_JENIS_PERALATAN,
  INITIAL_TIPE_PERALATAN,
  INITIAL_LOKASI,
  INITIAL_TITIK_LOKASI,
  INITIAL_UNIT_PERALATAN,
  INITIAL_PENEMPATAN_PERALATAN,
  INITIAL_UNIT_KERJA,
  INITIAL_PERSONEL,
  INITIAL_JADWAL_SHIFT,
  INITIAL_MASTER_CONFIGS,
  INITIAL_SPAREPARTS,
  INITIAL_MUTATIONS,
  INITIAL_SPAREPART_COMPATIBILITY
} from '../data/mockSeedData';

export function getStoredSupabaseConfig() {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  return { url, anonKey };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) return null;
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

/**
 * 1-Click Seed Initial Schema & Data directly into Supabase PostgreSQL tables.
 */
export async function seedSupabaseDatabase(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Kredensial Supabase (URL & Anon Key) belum dikonfigurasi.' };
  }

  try {
    // 1. jenis_peralatan
    await supabase.from('jenis_peralatan').upsert(INITIAL_JENIS_PERALATAN);

    // 2. tipe_peralatan
    await supabase.from('tipe_peralatan').upsert(INITIAL_TIPE_PERALATAN);

    // 3. lokasi
    await supabase.from('lokasi').upsert(INITIAL_LOKASI);

    // 4. titik_lokasi
    await supabase.from('titik_lokasi').upsert(INITIAL_TITIK_LOKASI);

    // 5. unit_peralatan
    const unitPeralatanClean = INITIAL_UNIT_PERALATAN.map(({ tipe_nama, jenis_nama, ...rest }) => rest);
    await supabase.from('unit_peralatan').upsert(unitPeralatanClean);

    // 6. penempatan_peralatan
    const penempatanClean = INITIAL_PENEMPATAN_PERALATAN.map(({ tipe_nama, lokasi_nama, titik_nomor, ...rest }) => rest);
    await supabase.from('penempatan_peralatan').upsert(penempatanClean);

    // 7. unit_kerja
    await supabase.from('unit_kerja').upsert(INITIAL_UNIT_KERJA);

    // 8. personel
    const personelClean = INITIAL_PERSONEL.map(({ unit_nama, ...rest }) => rest);
    await supabase.from('personel').upsert(personelClean);

    // 9. jadwal_shift
    const shiftClean = INITIAL_JADWAL_SHIFT.map(({ personel_nama, ...rest }) => rest);
    await supabase.from('jadwal_shift').upsert(shiftClean);

    // 10. master_configs
    await supabase.from('master_configs').upsert(INITIAL_MASTER_CONFIGS);

    // 11. spareparts
    const sparepartsClean = INITIAL_SPAREPARTS.map(({ equipment_type_name, location_rack, id_jenis, stok_aktual, stok_bekas, supplier_type, sumber, location, ...rest }: any) => ({
      ...rest,
      lokasi: rest.lokasi || location || ''
    }));
    await supabase.from('spareparts').upsert(sparepartsClean);

    // 12. stock_mutations
    const mutationsClean = INITIAL_MUTATIONS.map(({ sparepart_sku, sparepart_name, operator_name, reference_no, ...rest }: any) => ({
      ...rest,
      sumber: rest.sumber || 'VENDOR'
    }));
    await supabase.from('stock_mutations').upsert(mutationsClean);

    // 13. sparepart_compatibility
    await supabase.from('sparepart_compatibility').upsert(INITIAL_SPAREPART_COMPATIBILITY);

    return { success: true, message: 'Berhasil melakukan seed 100% sampel data ke Supabase PostgreSQL!' };
  } catch (err: any) {
    return { success: false, message: 'Gagal melakukan seed Supabase: ' + err.message };
  }
}
