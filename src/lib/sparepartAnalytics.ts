import { Sparepart, StockMutation, SupplierType } from '../types';
import { isLowStock, usableStock } from '../utils/stock';

export interface ABCItemPhysical {
  sparepart: Sparepart;
  category: 'A' | 'B' | 'C';
  categoryLabel: 'Fast Moving (Class A)' | 'Medium Moving (Class B)' | 'Slow / Dead Stock (Class C)';
  usageVolume: number; // Volume unit terpakai / terotasi
  cumulativePercentage: number;
}

export interface ABCPhysicalBreakdown {
  classA: { count: number; totalVolume: number; percentage: number };
  classB: { count: number; totalVolume: number; percentage: number };
  classC: { count: number; totalVolume: number; percentage: number };
  items: ABCItemPhysical[];
}

export interface CategoryPhysicalBreakdown {
  categoryName: string;
  itemCount: number;
  totalNewStock: number;
  totalUsedStock: number;
  totalPhysicalStock: number;
  rotationRatio: number;
}

export interface MonthlyPhysicalTrend {
  month: string;
  inflowUnit: number;  // Unit barang masuk
  outflowUnit: number; // Unit barang keluar/pakai
  netStockChange: number;
}

export interface ReorderPriorityItemPhysical {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  stokAktual: number;
  stokBekas: number;
  minimumStok: number;
  safetyStok: number;
  suggestedReorderQty: number;
  supplierType: SupplierType;
  estimatedLeadTimeDays: number;
  urgency: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  locationRack: string;
}

export interface SparepartAnalyticsFilter {
  categoryFilter?: string;
  periodMonths?: number;
  locationRackFilter?: string;
}

export const getFilteredSpareparts = (
  spareparts: Sparepart[],
  filters: SparepartAnalyticsFilter
): Sparepart[] => {
  return spareparts.filter((item) => {
    // Filter Category / Equipment Type
    if (filters.categoryFilter && filters.categoryFilter !== 'ALL') {
      const matchTipe = item.tipe_ids.includes(filters.categoryFilter);
      const matchJenis = item.jenis_ids.includes(filters.categoryFilter);
      const matchName = item.equipment_type_name === filters.categoryFilter;
      if (!matchTipe && !matchJenis && !matchName) return false;
    }

    // Filter Location / Rack
    if (filters.locationRackFilter && filters.locationRackFilter !== 'ALL') {
      const locStr = `${item.rack || ''} ${item.lokasi || ''}`;
      if (!locStr.toLowerCase().includes(filters.locationRackFilter.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Calculates ABC Classification based strictly on Physical Volume / Consumption Frequency.
 */
export const calculateABCAnalysisPhysical = (
  spareparts: Sparepart[],
  mutations: StockMutation[]
): ABCPhysicalBreakdown => {
  if (spareparts.length === 0) {
    return {
      classA: { count: 0, totalVolume: 0, percentage: 0 },
      classB: { count: 0, totalVolume: 0, percentage: 0 },
      classC: { count: 0, totalVolume: 0, percentage: 0 },
      items: []
    };
  }

  // Calculate physical outbound volume per sparepart
  const volumeMap: Record<string, number> = {};
  mutations.forEach((m) => {
    if (m.mutation_type === 'Pakai' || m.mutation_type === 'Rusak') {
      volumeMap[m.sparepart_id] = (volumeMap[m.sparepart_id] || 0) + m.qty;
    }
  });

  // Combine mutation volume + stock turnover estimate
  const itemsWithVolume = spareparts.map((p) => {
    const outboundVol = volumeMap[p.id] || 0;
    return {
      sparepart: p,
      usageVolume: outboundVol
    };
  });

  const totalVolumeSum = itemsWithVolume.reduce((s, i) => s + i.usageVolume, 0);

  // Sort descending by physical volume
  const sorted = [...itemsWithVolume].sort((a, b) => b.usageVolume - a.usageVolume);

  let runningSum = 0;
  const items: ABCItemPhysical[] = sorted.map((item) => {
    runningSum += item.usageVolume;
    const cumulativePct = totalVolumeSum > 0 ? (runningSum / totalVolumeSum) * 100 : 100;

    let category: 'A' | 'B' | 'C' = 'C';
    let categoryLabel: ABCItemPhysical['categoryLabel'] = 'Slow / Dead Stock (Class C)';

    if (item.usageVolume > 0 && (cumulativePct <= 80 || item.usageVolume >= 10)) {
      category = 'A';
      categoryLabel = 'Fast Moving (Class A)';
    } else if (item.usageVolume > 0 && cumulativePct <= 95) {
      category = 'B';
      categoryLabel = 'Medium Moving (Class B)';
    }

    return {
      sparepart: item.sparepart,
      category,
      categoryLabel,
      usageVolume: item.usageVolume,
      cumulativePercentage: Math.round(cumulativePct * 10) / 10
    };
  });

  const classAItems = items.filter((i) => i.category === 'A');
  const classBItems = items.filter((i) => i.category === 'B');
  const classCItems = items.filter((i) => i.category === 'C');

  const classAVol = classAItems.reduce((s, i) => s + i.usageVolume, 0);
  const classBVol = classBItems.reduce((s, i) => s + i.usageVolume, 0);
  const classCVol = classCItems.reduce((s, i) => s + i.usageVolume, 0);

  return {
    classA: {
      count: classAItems.length,
      totalVolume: classAVol,
      percentage: totalVolumeSum > 0 ? Math.round((classAVol / totalVolumeSum) * 100) : 0
    },
    classB: {
      count: classBItems.length,
      totalVolume: classBVol,
      percentage: totalVolumeSum > 0 ? Math.round((classBVol / totalVolumeSum) * 100) : 0
    },
    classC: {
      count: classCItems.length,
      totalVolume: classCVol,
      percentage: totalVolumeSum > 0 ? Math.round((classCVol / totalVolumeSum) * 100) : 0
    },
    items
  };
};

/**
 * Calculates Category Physical Stock Breakdown & Rotation Ratio.
 */
export const calculateCategoryPhysicalBreakdown = (
  spareparts: Sparepart[],
  mutations: StockMutation[]
): CategoryPhysicalBreakdown[] => {
  const categoryMap: Record<
    string,
    { itemCount: number; newStock: number; usedStock: number; outboundQty: number }
  > = {};

  spareparts.forEach((p) => {
    const categoryName = p.equipment_type_name || 'Umum & Rotable';
    if (!categoryMap[categoryName]) {
      categoryMap[categoryName] = {
        itemCount: 0,
        newStock: 0,
        usedStock: 0,
        outboundQty: 0
      };
    }
    categoryMap[categoryName].itemCount += 1;
    categoryMap[categoryName].newStock += p.stok_aktual;
    categoryMap[categoryName].usedStock += p.stok_bekas;
  });

  mutations.forEach((m) => {
    if (m.mutation_type === 'Pakai') {
      const part = spareparts.find((sp) => sp.id === m.sparepart_id);
      if (part) {
        const cat = part.equipment_type_name || 'Umum & Rotable';
        if (categoryMap[cat]) {
          categoryMap[cat].outboundQty += m.qty;
        }
      }
    }
  });

  return Object.entries(categoryMap).map(([categoryName, data]) => {
    const totalPhysical = data.newStock + data.usedStock;
    // Units issued per unit of physical stock currently held
    const rotationRatio = totalPhysical > 0
      ? Math.round((data.outboundQty / totalPhysical) * 10) / 10
      : 0;

    return {
      categoryName,
      itemCount: data.itemCount,
      totalNewStock: data.newStock,
      totalUsedStock: data.usedStock,
      totalPhysicalStock: totalPhysical,
      rotationRatio
    };
  });
};

/**
 * Calculates Monthly Physical Movement Trend (Inflow vs Outflow Unit count) based strictly on real mutations.
 */
export const calculateMonthlyPhysicalTrend = (
  spareparts: Sparepart[],
  mutations: StockMutation[]
): MonthlyPhysicalTrend[] => {
  const monthsMap: Record<string, { month: string; inflowUnit: number; outflowUnit: number }> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Initialize last 6 months
  const now = new Date();
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    monthKeys.push(key);
    monthsMap[key] = { month: label, inflowUnit: 0, outflowUnit: 0 };
  }

  // Aggregate mutations by created_at timestamp
  mutations.forEach((m) => {
    if (!m.created_at) return;
    const date = new Date(m.created_at);
    if (isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    if (monthsMap[key]) {
      if (m.mutation_type === 'Masuk') {
        monthsMap[key].inflowUnit += m.qty;
      } else if (m.mutation_type === 'Pakai' || m.mutation_type === 'Rusak') {
        monthsMap[key].outflowUnit += m.qty;
      }
    }
  });

  return monthKeys.map((key) => {
    const item = monthsMap[key];
    return {
      month: item.month,
      inflowUnit: item.inflowUnit,
      outflowUnit: item.outflowUnit,
      netStockChange: item.inflowUnit - item.outflowUnit
    };
  });
};

/**
 * Generates Reorder Priority List based strictly on physical safety stock levels.
 */
export const getReorderPriorityListPhysical = (
  spareparts: Sparepart[]
): ReorderPriorityItemPhysical[] => {
  return spareparts
    .map((p) => {
      const safetyStok = Math.ceil(p.minimum_stok * 1.5);
      const isCritical = isLowStock(usableStock(p), p.minimum_stok);
      const isWarning = !isCritical && p.stok_aktual <= safetyStok;

      const suggestedQty = Math.max(p.minimum_stok * 2 - p.stok_aktual, 0);
      const leadTime = 30;

      let urgency: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
      if (isCritical) urgency = 'CRITICAL';
      else if (isWarning) urgency = 'WARNING';

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        categoryName: p.equipment_type_name || 'General',
        stokAktual: p.stok_aktual,
        stokBekas: p.stok_bekas,
        minimumStok: p.minimum_stok,
        safetyStok,
        suggestedReorderQty: suggestedQty,
        supplierType: 'VENDOR' as SupplierType,
        estimatedLeadTimeDays: leadTime,
        urgency,
        locationRack: p.rack || p.lokasi || '-'
      };
    })
    .sort((a, b) => {
      const urgencyOrder = { CRITICAL: 0, WARNING: 1, HEALTHY: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return b.suggestedReorderQty - a.suggestedReorderQty;
    });
};
