import type { FMSRiskLevelId } from '../../lib/fmsReport/types';

/**
 * Az FMS értékelés jelzőszínei. Egy helyen, mert a riport fejléce és az
 * eredménylista kártyái ugyanazt a szintet mutatják.
 */
export const FMS_RISK_BADGE: Record<FMSRiskLevelId, string> = {
  ready: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
  corrective: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
  restricted: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
};

export const FMS_RISK_RING: Record<FMSRiskLevelId, string> = {
  ready: 'ring-success-200 dark:ring-success-900/50',
  corrective: 'ring-warning-200 dark:ring-warning-900/50',
  restricted: 'ring-error-200 dark:ring-error-900/50',
};
