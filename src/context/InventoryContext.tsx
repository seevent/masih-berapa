import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  SparepartCompatibility,
  MutationType,
  PredictiveAlert,
  AnnualNeed
} from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { useNotification } from './NotificationContext';

export interface OnDutyPersonel extends Personel {
  current_shift?: string;
}

interface InventoryContextType {
  // State Data
  jenisPeralatan: JenisPeralatan[];
  tipePeralatan: TipePeralatan[];
  lokasiList: Lokasi[];
  titikLokasiList: TitikLokasi[];
  unitPeralatanList: UnitPeralatan[];
  penempatanList: PenempatanPeralatan[];
  unitKerjaList: UnitKerja[];
  personelList: Personel[];
  jadwalShiftList: JadwalShift[];
  masterConfigs: MasterConfig[];
  spareparts: Sparepart[];
  mutations: StockMutation[];
  sparepartCompatibility: SparepartCompatibility[];
  
  isLoading: boolean;
  isSupabaseConnected: boolean;

  // Actions (Full Supabase UUID CRUD)
  addJenisPeralatan: (data: Omit<JenisPeralatan, 'id'>) => Promise<void>;
  addTipePeralatan: (data: Omit<TipePeralatan, 'id'>) => Promise<void>;
  addLokasi: (data: Omit<Lokasi, 'id'>) => Promise<void>;
  addTitikLokasi: (data: Omit<TitikLokasi, 'id'>) => Promise<void>;
  addUnitPeralatan: (data: Omit<UnitPeralatan, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateUnitStatus: (id: string, status: UnitPeralatan['status']) => Promise<void>;
  addPersonel: (data: Omit<Personel, 'id' | 'created_at'>) => Promise<void>;
  addJadwalShift: (data: Omit<JadwalShift, 'id' | 'created_at'>) => Promise<void>;
  
  addSparepart: (part: Omit<Sparepart, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSparepart: (id: string, part: Partial<Sparepart>) => Promise<void>;
  deleteSparepart: (id: string) => Promise<void>;
  
  addMutation: (mutation: {
    sparepart_id: string;
    unit_id?: string;
    personel_id?: string;
    mutation_type: MutationType;
    sumber?: SupplierType;
    qty: number;
    operator_name?: string;
    reference_no?: string;
    notes?: string;
  }) => Promise<boolean>;
  updateMutation: (
    id: string,
    data: Partial<{
      sparepart_id: string;
      unit_id?: string | null;
      personel_id?: string | null;
      mutation_type: MutationType;
      sumber?: SupplierType;
      qty: number;
      notes?: string | null;
    }>
  ) => Promise<boolean>;
  deleteMutation: (id: string) => Promise<boolean>;

  // Calculations
  getOnDutyPersonel: (dateStr?: string) => OnDutyPersonel[];
  getPredictiveAlerts: () => PredictiveAlert[];
  getAnnualNeeds: () => AnnualNeed[];
  refreshData: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useNotification();

  const [jenisPeralatan, setJenisPeralatan] = useState<JenisPeralatan[]>([]);
  const [tipePeralatan, setTipePeralatan] = useState<TipePeralatan[]>([]);
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [titikLokasiList, setTitikLokasiList] = useState<TitikLokasi[]>([]);
  const [unitPeralatanList, setUnitPeralatanList] = useState<UnitPeralatan[]>([]);
  const [penempatanList, setPenempatanList] = useState<PenempatanPeralatan[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [personelList, setPersonelList] = useState<Personel[]>([]);
  const [jadwalShiftList, setJadwalShiftList] = useState<JadwalShift[]>([]);
  const [masterConfigs, setMasterConfigs] = useState<MasterConfig[]>([]);
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [sparepartCompatibility, setSparepartCompatibilityState] = useState<SparepartCompatibility[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // --- Fetch All Data 100% From Supabase PostgreSQL ---
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    if (!supabase) {
      setIsSupabaseConnected(false);
      setJenisPeralatan([]);
      setTipePeralatan([]);
      setLokasiList([]);
      setTitikLokasiList([]);
      setUnitPeralatanList([]);
      setPenempatanList([]);
      setUnitKerjaList([]);
      setPersonelList([]);
      setJadwalShiftList([]);
      setMasterConfigs([]);
      setSpareparts([]);
      setMutations([]);
      setSparepartCompatibilityState([]);
      setIsLoading(false);
      return;
    }

    try {
      const [
        jpRes, tpRes, lokRes, titRes, unitRes, penRes, ukRes, persRes, shfRes, cfgRes, spRes, mutRes, compatRes
      ] = await Promise.all([
        supabase.from('jenis_peralatan').select('*').order('nama', { ascending: true }),
        supabase.from('tipe_peralatan').select('*').order('nama', { ascending: true }),
        supabase.from('lokasi').select('*').order('nama', { ascending: true }),
        supabase.from('titik_lokasi').select('*'),
        supabase.from('unit_peralatan').select('*'),
        supabase.from('penempatan_peralatan').select('*'),
        supabase.from('unit_kerja').select('*'),
        supabase.from('personel').select('*'),
        supabase.from('jadwal_shift').select('*'),
        supabase.from('master_configs').select('*'),
        supabase.from('spareparts').select('*').order('created_at', { ascending: false }),
        supabase.from('stock_mutations').select('*').order('created_at', { ascending: false }),
        supabase.from('sparepart_compatibility').select('*')
      ]);

      if (jpRes.error || tpRes.error || spRes.error) {
        console.error('Supabase fetch error:', jpRes.error || tpRes.error || spRes.error);
        setIsSupabaseConnected(false);
        setIsLoading(false);
        return;
      }

      setIsSupabaseConnected(true);
      setJenisPeralatan(jpRes.data || []);
      setTipePeralatan(tpRes.data || []);
      setLokasiList(lokRes.data || []);
      setTitikLokasiList(titRes.data || []);
      setUnitPeralatanList(unitRes.data || []);
      setPenempatanList(penRes.data || []);
      setUnitKerjaList(ukRes.data || []);
      setPersonelList(persRes.data || []);
      setJadwalShiftList(shfRes.data || []);
      setMasterConfigs(cfgRes.data || []);

      const tpMap = new Map((tpRes.data || []).map((t: any) => [t.id, t.nama]));
      const tpJenisMap = new Map((tpRes.data || []).map((t: any) => [t.id, t.id_jenis]));
      const persMap = new Map((persRes.data || []).map((p: any) => [p.id, p.nama]));

      const mutsData = mutRes.data || [];

      // Calculate dynamic stock per sparepart ID from stock_mutations history
      const mutationBaruDelta: Record<string, number> = {};
      const mutationBekasDelta: Record<string, number> = {};

      mutsData.forEach((m: any) => {
        const spId = m.sparepart_id;
        if (!spId) return;
        if (mutationBaruDelta[spId] === undefined) mutationBaruDelta[spId] = 0;
        if (mutationBekasDelta[spId] === undefined) mutationBekasDelta[spId] = 0;

        if (m.mutation_type === 'Masuk') {
          mutationBaruDelta[spId] += Number(m.qty) || 0;
        } else if (m.mutation_type === 'Pakai') {
          mutationBaruDelta[spId] -= Number(m.qty) || 0;
        } else if (m.mutation_type === 'Bekas') {
          mutationBekasDelta[spId] += Number(m.qty) || 0;
        } else if (m.mutation_type === 'Rusak') {
          mutationBekasDelta[spId] -= Number(m.qty) || 0;
        }
      });

      const formattedParts: Sparepart[] = (spRes.data || []).map((sp: any) => {
        const idJenis = sp.id_jenis || tpJenisMap.get(sp.id_tipe) || '';
        const baseBaru = Number(sp.stok_aktual) || 0;
        const baseBekas = Number(sp.stok_bekas) || 0;
        const deltaBaru = mutationBaruDelta[sp.id] || 0;
        const deltaBekas = mutationBekasDelta[sp.id] || 0;

        const calculatedStokBaru = Math.max(0, baseBaru + deltaBaru);
        const calculatedStokBekas = Math.max(0, baseBekas + deltaBekas);

        return {
          ...sp,
          id_jenis: idJenis,
          stok_aktual: calculatedStokBaru,
          stok_bekas: calculatedStokBekas,
          equipment_type_name: tpMap.get(sp.id_tipe) || sp.equipment_type_name || 'Umum',
          lokasi: sp.lokasi || sp.location || ''
        };
      });

      const spMap = new Map(formattedParts.map((sp) => [sp.id, sp]));
      const formattedMuts: StockMutation[] = mutsData.map((mut: any) => ({
        ...mut,
        sumber: mut.sumber || 'VENDOR',
        operator_name: persMap.get(mut.personel_id) || mut.operator_name || 'Teknisi',
        sparepart_sku: spMap.get(mut.sparepart_id)?.sku || 'UNKNOWN',
        sparepart_name: spMap.get(mut.sparepart_id)?.name || 'Sparepart Removed'
      }));

      setSpareparts(formattedParts);
      setMutations(formattedMuts);
      setSparepartCompatibilityState(compatRes.data || []);
    } catch (err: any) {
      console.error('Failed to sync with Supabase PostgreSQL:', err);
      setIsSupabaseConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --- Filter Personnel Currently On Duty Based on Shift Schedule ---
  const getOnDutyPersonel = useCallback(
    (dateStr?: string): OnDutyPersonel[] => {
      const targetDate = dateStr || new Date().toISOString().slice(0, 10);
      
      const onDutyShifts = jadwalShiftList.filter(
        (s) =>
          s.tanggal === targetDate &&
          s.shift !== 'Off' &&
          s.status_kehadiran !== 'Izin' &&
          s.status_kehadiran !== 'Sakit'
      );

      if (onDutyShifts.length > 0) {
        return onDutyShifts
          .map((s) => {
            const p = personelList.find((pers) => pers.id === s.personel_id);
            if (!p) return null;
            return {
              ...p,
              current_shift: s.shift
            };
          })
          .filter((p): p is OnDutyPersonel => p !== null);
      }

      return personelList.slice(0, 5).map((p, idx) => ({
        ...p,
        current_shift: idx % 3 === 0 ? 'Pagi (08:00 - 16:00)' : idx % 3 === 1 ? 'Siang (16:00 - 24:00)' : 'Malam (00:00 - 08:00)'
      }));
    },
    [jadwalShiftList, personelList]
  );

  // --- CRUD Actions (100% Pure UUID Primary Keys) ---

  const addJenisPeralatan = async (data: Omit<JenisPeralatan, 'id'>) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase belum terkonfigurasi di Pengaturan.', 'error');
      return;
    }
    const newItem = { ...data, id: crypto.randomUUID() };
    const { error } = await supabase.from('jenis_peralatan').insert([newItem]);
    if (error) {
      showToast('Gagal Simpan', error.message, 'error');
    } else {
      showToast('Jenis Peralatan Ditambah', newItem.nama, 'success');
      await refreshData();
    }
  };

  const addTipePeralatan = async (data: Omit<TipePeralatan, 'id'>) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase belum terkonfigurasi di Pengaturan.', 'error');
      return;
    }
    const newItem = { ...data, id: crypto.randomUUID() };
    const { error } = await supabase.from('tipe_peralatan').insert([newItem]);
    if (error) {
      showToast('Gagal Simpan', error.message, 'error');
    } else {
      showToast('Tipe Peralatan Ditambah', newItem.nama, 'success');
      await refreshData();
    }
  };

  const addLokasi = async (data: Omit<Lokasi, 'id'>) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase belum terkonfigurasi.', 'error');
      return;
    }
    const newItem = { ...data, id: crypto.randomUUID() };
    const { error } = await supabase.from('lokasi').insert([newItem]);
    if (error) {
      showToast('Gagal Simpan', error.message, 'error');
    } else {
      showToast('Lokasi Ditambah', newItem.nama, 'success');
      await refreshData();
    }
  };

  const addTitikLokasi = async (data: Omit<TitikLokasi, 'id'>) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase belum terkonfigurasi.', 'error');
      return;
    }
    const newItem = { ...data, id: crypto.randomUUID() };
    const { error } = await supabase.from('titik_lokasi').insert([newItem]);
    if (error) {
      showToast('Gagal Simpan', error.message, 'error');
    } else {
      showToast('Titik Lokasi Ditambah', newItem.nomor, 'success');
      await refreshData();
    }
  };

  const addUnitPeralatan = async (data: Omit<UnitPeralatan, 'id' | 'created_at' | 'updated_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase belum terkonfigurasi.', 'error');
      return;
    }
    const newItem = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('unit_peralatan').insert([newItem]);
    if (error) {
      showToast('Gagal Simpan', error.message, 'error');
    } else {
      showToast('Unit Peralatan Ditambah', newItem.serial_number || 'Unit Baru', 'success');
      await refreshData();
    }
  };

  const updateUnitStatus = async (id: string, status: UnitPeralatan['status']) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase belum terkonfigurasi.', 'error');
      return;
    }
    const { error } = await supabase
      .from('unit_peralatan')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      showToast('Gagal Update Status', error.message, 'error');
    } else {
      showToast('Status Unit Diperbarui', `Status diubah ke ${status}`, 'success');
      await refreshData();
    }
  };

  const addPersonel = async (data: Omit<Personel, 'id' | 'created_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const newItem = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    const { error } = await supabase.from('personel').insert([newItem]);
    if (!error) {
      showToast('Personel Ditambah', newItem.nama, 'success');
      await refreshData();
    }
  };

  const addJadwalShift = async (data: Omit<JadwalShift, 'id' | 'created_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const newItem = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    const { error } = await supabase.from('jadwal_shift').insert([newItem]);
    if (!error) {
      showToast('Jadwal Shift Ditambah', `${data.shift} - ${data.tanggal}`, 'success');
      await refreshData();
    }
  };

  const addSparepart = async (partData: Omit<Sparepart, 'id' | 'created_at' | 'updated_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase URL & Anon Key belum terkonfigurasi di Settings.', 'error');
      return;
    }
    const newId = crypto.randomUUID();
    const initialStokBaru = Number(partData.stok_aktual) || 0;
    const initialStokBekas = Number(partData.stok_bekas) || 0;

    // Sanitize payload for live Supabase columns (remove non-db & computed stock fields)
    const {
      equipment_type_name,
      location_rack,
      id_jenis,
      supplier_type,
      location,
      stok_aktual,
      stok_bekas,
      ...dbPayload
    } = partData as any;

    const cleanPayload = {
      ...dbPayload,
      id: newId,
      lokasi: dbPayload.lokasi || location || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('spareparts').insert([cleanPayload]);
    if (error) {
      showToast('Gagal Simpan Supabase', error.message, 'error');
      return;
    }

    // Insert initial stock mutations if initial stock was provided
    if (initialStokBaru > 0) {
      await supabase.from('stock_mutations').insert([{
        id: crypto.randomUUID(),
        sparepart_id: newId,
        mutation_type: 'Masuk',
        sumber: 'VENDOR',
        qty: initialStokBaru,
        notes: 'Stok awal pendaftaran sparepart baru',
        created_at: new Date().toISOString()
      }]);
    }
    if (initialStokBekas > 0) {
      await supabase.from('stock_mutations').insert([{
        id: crypto.randomUUID(),
        sparepart_id: newId,
        mutation_type: 'Bekas',
        sumber: 'VENDOR',
        qty: initialStokBekas,
        notes: 'Stok awal bekas pendaftaran sparepart baru',
        created_at: new Date().toISOString()
      }]);
    }

    showToast('Sparepart Ditambahkan', `${partData.name} tersimpan di Supabase`, 'success');
    await refreshData();
  };

  const updateSparepart = async (id: string, partData: Partial<Sparepart>) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase belum terkonfigurasi.', 'error');
      return;
    }

    // Sanitize payload for live Supabase columns (remove non-db & computed stock fields)
    const {
      equipment_type_name,
      location_rack,
      id_jenis,
      supplier_type,
      sumber,
      location,
      stok_aktual,
      stok_bekas,
      ...dbPayload
    } = partData as any;

    const cleanPayload: any = {
      ...dbPayload,
      updated_at: new Date().toISOString()
    };

    if (location !== undefined) cleanPayload.lokasi = location;

    const { error } = await supabase
      .from('spareparts')
      .update(cleanPayload)
      .eq('id', id);

    if (error) {
      showToast('Gagal Update Supabase', error.message, 'error');
    } else {
      showToast('Berhasil Diperbarui', 'Data sparepart diperbarui di Supabase', 'success');
      await refreshData();
    }
  };

  const deleteSparepart = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase belum terkonfigurasi.', 'error');
      return;
    }
    const target = spareparts.find((s) => s.id === id);
    const { error } = await supabase.from('spareparts').delete().eq('id', id);

    if (error) {
      showToast('Gagal Hapus Supabase', error.message, 'error');
    } else {
      showToast('Sparepart Dihapus', `${target?.name || id} telah dihapus dari Supabase`, 'info');
      await refreshData();
    }
  };

  const addMutation = async (mutationData: {
    sparepart_id: string;
    unit_id?: string;
    personel_id?: string;
    mutation_type: MutationType;
    sumber?: SupplierType;
    qty: number;
    operator_name?: string;
    reference_no?: string;
    notes?: string;
  }): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase belum terkonfigurasi di Settings.', 'error');
      return false;
    }

    const targetPart = spareparts.find((s) => s.id === mutationData.sparepart_id);
    if (!targetPart) {
      showToast('Gagal Mutasi', 'Sparepart tidak ditemukan', 'error');
      return false;
    }

    if (mutationData.mutation_type === 'Pakai' && targetPart.stok_aktual < mutationData.qty) {
      showToast('Stok Tidak Cukup', `Stok baru (${targetPart.stok_aktual}) kurang dari ${mutationData.qty}`, 'error');
      return false;
    } else if (mutationData.mutation_type === 'Rusak' && targetPart.stok_bekas < mutationData.qty) {
      showToast('Stok Bekas Kurang', `Stok bekas (${targetPart.stok_bekas}) kurang dari ${mutationData.qty}`, 'error');
      return false;
    }

    let finalNotes = mutationData.notes?.trim() || '';
    if (mutationData.reference_no?.trim()) {
      finalNotes = `[Ref: ${mutationData.reference_no.trim()}] ${finalNotes}`.trim();
    }

    const dbMutPayload = {
      id: crypto.randomUUID(),
      sparepart_id: mutationData.sparepart_id,
      unit_id: mutationData.unit_id || null,
      personel_id: mutationData.personel_id || null,
      mutation_type: mutationData.mutation_type,
      sumber: mutationData.sumber || 'VENDOR',
      qty: mutationData.qty,
      notes: finalNotes || null,
      created_at: new Date().toISOString()
    };

    // Execute Supabase Mutation
    const { error: mutErr } = await supabase.from('stock_mutations').insert([dbMutPayload]);
    if (mutErr) {
      showToast('Gagal Transaksi Supabase', mutErr.message, 'error');
      return false;
    }

    showToast('Transaksi Berhasil', `Stok ${targetPart.name} diperbarui`, 'success');
    await refreshData();
    return true;
  };

  const updateMutation = async (
    id: string,
    data: Partial<{
      sparepart_id: string;
      unit_id?: string | null;
      personel_id?: string | null;
      mutation_type: MutationType;
      qty: number;
      notes?: string | null;
    }>
  ): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase belum terkonfigurasi di Settings.', 'error');
      return false;
    }

    const { error } = await supabase
      .from('stock_mutations')
      .update(data)
      .eq('id', id);

    if (error) {
      showToast('Gagal Edit Transaksi', error.message, 'error');
      return false;
    }

    showToast('Transaksi Diperbarui', 'Data riwayat mutasi berhasil diperbarui.', 'success');
    await refreshData();
    return true;
  };

  const deleteMutation = async (id: string): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'Supabase belum terkonfigurasi di Settings.', 'error');
      return false;
    }

    const { error } = await supabase
      .from('stock_mutations')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Gagal Hapus Transaksi', error.message, 'error');
      return false;
    }

    showToast('Transaksi Dihapus', 'Data riwayat mutasi berhasil dihapus.', 'info');
    await refreshData();
    return true;
  };

  // Calculations
  const getPredictiveAlerts = (): PredictiveAlert[] => {
    const now = new Date();
    return spareparts.map((sp) => {
      const mtbf = sp.mtbf_days || 180;
      const lastReplaced = sp.last_replaced_at ? new Date(sp.last_replaced_at) : new Date(sp.created_at || now);
      const diffTime = Math.abs(now.getTime() - lastReplaced.getTime());
      const daysUsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, mtbf - daysUsed);
      const isStockEmpty = sp.stok_aktual + sp.stok_bekas <= 0;

      let urgency: PredictiveAlert['urgency'] = 'NORMAL';
      if (isStockEmpty || remainingDays <= 7 || sp.stok_aktual <= sp.minimum_stok) {
        urgency = 'CRITICAL';
      } else if (remainingDays <= 21 || sp.stok_aktual <= sp.minimum_stok * 1.5) {
        urgency = 'WARNING';
      }

      return {
        sparepart: sp,
        days_used: daysUsed,
        remaining_days: remainingDays,
        urgency,
        is_stock_empty: isStockEmpty
      };
    });
  };

  const getAnnualNeeds = (): AnnualNeed[] => {
    return spareparts.map((sp) => {
      const mtbf = sp.mtbf_days || 180;
      const annualForecast = Math.ceil((365 / Math.max(mtbf, 30)) * 2);
      const totalAvailable = sp.stok_aktual + sp.stok_bekas;
      const orderNeeded = Math.max(0, annualForecast - totalAvailable);

      return {
        sparepart: sp,
        annual_forecast_qty: annualForecast,
        total_available_stock: totalAvailable,
        order_needed_qty: orderNeeded,
        estimated_cost: 0
      };
    });
  };

  return (
    <InventoryContext.Provider
      value={{
        jenisPeralatan,
        tipePeralatan,
        lokasiList,
        titikLokasiList,
        unitPeralatanList,
        penempatanList,
        unitKerjaList,
        personelList,
        jadwalShiftList,
        masterConfigs,
        spareparts,
        mutations,
        sparepartCompatibility,
        isLoading,
        isSupabaseConnected,
        addJenisPeralatan,
        addTipePeralatan,
        addLokasi,
        addTitikLokasi,
        addUnitPeralatan,
        updateUnitStatus,
        addPersonel,
        addJadwalShift,
        addSparepart,
        updateSparepart,
        deleteSparepart,
        addMutation,
        updateMutation,
        deleteMutation,
        getOnDutyPersonel,
        getPredictiveAlerts,
        getAnnualNeeds,
        refreshData
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};
