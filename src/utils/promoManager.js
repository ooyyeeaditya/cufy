// Centralized Promotional Pricing & Free Access Management for Cufy

// Launch Promotional Period End Date: October 15, 2026, 23:59:59 IST
export const FREE_PROMO_END_DATE = new Date('2026-10-15T23:59:59.999+05:30');

/**
 * Checks if the 100% free launch period is currently active.
 * Automatically turns off after October 15, 2026, 23:59:59 IST.
 */
export function isFreeLaunchPeriodActive() {
  return new Date() <= FREE_PROMO_END_DATE;
}

/**
 * Returns user-friendly formatted date string (e.g. "15th October 2026")
 */
export function getFreePromoEndDateFormatted() {
  return '15th October 2026';
}

/**
 * Returns remaining days in the free promo
 */
export function getFreePromoRemainingDays() {
  const diff = FREE_PROMO_END_DATE - new Date();
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
