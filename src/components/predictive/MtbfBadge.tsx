import React from 'react';
import { MtbfConfidence, MtbfEstimate } from '../../utils/reliability';

const CONFIDENCE_LABEL: Record<MtbfConfidence, string> = {
  BELUM_CUKUP_DATA: 'belum cukup data',
  RENDAH: 'keyakinan rendah',
  SEDANG: 'keyakinan sedang',
  TINGGI: 'keyakinan tinggi'
};

const CONFIDENCE_CLASS: Record<MtbfConfidence, string> = {
  BELUM_CUKUP_DATA: 'text-slate-500',
  RENDAH: 'text-amber-400',
  SEDANG: 'text-cyan-400',
  TINGGI: 'text-emerald-400'
};

interface MtbfBadgeProps {
  estimate?: MtbfEstimate;
  /** Smaller layout for table cells */
  compact?: boolean;
}

/** MTBF derived from 'Pakai' history: value, number of replacements and confidence. */
export const MtbfBadge: React.FC<MtbfBadgeProps> = ({ estimate, compact }) => {
  if (!estimate || estimate.mtbf_days === null) {
    const observed = estimate ? Math.floor(estimate.exposure_days) : 0;
    return (
      <div className="text-slate-400">
        <span className="font-semibold">Belum cukup data</span>
        <div className="text-[10px] text-slate-500">
          {observed > 0 ? `terpantau ${observed} hari, belum ada penggantian` : 'belum ada Pakai dengan unit'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className={`font-semibold text-slate-200 ${compact ? '' : 'text-sm'}`}>{Math.round(estimate.mtbf_days)} hari</span>
      <div className={`text-[10px] ${CONFIDENCE_CLASS[estimate.confidence]}`}>
        {estimate.replacements} penggantian · {CONFIDENCE_LABEL[estimate.confidence]}
      </div>
    </div>
  );
};
