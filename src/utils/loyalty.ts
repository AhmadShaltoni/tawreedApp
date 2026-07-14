import type { LoyaltyEarnConfig } from "@/src/types/loyalty";

/**
 * Forecast the points an order would earn.
 *
 * Mirrors the backend `awardOrderPoints` calculation
 * (tawreedPortal/actions/loyalty-points.ts) so the number shown in the
 * cart matches what the server will actually award.
 *
 * @param baseAmount Order amount in JOD — pass the products subtotal when
 *   `excludeDeliveryFees` is true (the default), otherwise the grand total.
 */
export function estimateOrderPoints(
  baseAmount: number,
  config: LoyaltyEarnConfig | undefined,
): number {
  if (!config || !config.isEnabled) return 0;
  if (baseAmount <= 0) return 0;
  if (config.minOrderValue != null && baseAmount < config.minOrderValue) {
    return 0;
  }

  const base = config.calculationBase > 0 ? config.calculationBase : 1;
  const raw = (baseAmount / base) * config.pointsPerJod;

  switch (config.roundingMode) {
    case "CEIL":
      return Math.max(0, Math.ceil(raw));
    case "ROUND":
      return Math.max(0, Math.round(raw));
    case "FLOOR":
    default:
      return Math.max(0, Math.floor(raw));
  }
}
