/**
 * Indian-market formatting. Prices are shown in lakh/crore because that is how
 * property prices are read in India; a plain ₹ grouping is kept for rents, which
 * are quoted in thousands.
 */

const LAKH = 100_000;
const CRORE = 10_000_000;

function trim(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, '');
}

/** ₹1.25 Cr / ₹85 L / ₹4,500 — the compact form used on cards and headings. */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'Price unavailable';

  const negative = value < 0;
  const abs = Math.abs(value);

  let text: string;
  if (abs >= CRORE) text = `₹${trim(abs / CRORE)} Cr`;
  else if (abs >= LAKH) text = `₹${trim(abs / LAKH)} L`;
  else text = `₹${new Intl.NumberFormat('en-IN').format(Math.round(abs))}`;

  return negative ? `-${text}` : text;
}

/** ₹31,600 — exact rupees, for rent, deposit and maintenance. */
export function formatRupees(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `₹${new Intl.NumberFormat('en-IN').format(Math.round(value))}`;
}

export function formatRent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'Rent unavailable';
  return `${formatRupees(value)}/mo`;
}

/**
 * Areas come from the API as bare numbers with no unit field. Every cross-check
 * against carpet vs super-built-up ratios and project min/max_area_sqft is
 * consistent with square feet, so sq ft is what gets rendered.
 */
export function formatArea(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '—';
  return `${new Intl.NumberFormat('en-IN').format(Math.round(value))} sq ft`;
}

export function formatPricePerSqft(price: number, area: number): string {
  if (!Number.isFinite(price) || !Number.isFinite(area) || area <= 0 || price <= 0) return '—';
  return `${formatRupees(price / area)}/sq ft`;
}

/** 0 BHK is a studio in this dataset, not missing data. */
export function formatBhk(bedroom: number | null | undefined): string {
  if (bedroom == null || !Number.isFinite(bedroom)) return '—';
  return bedroom === 0 ? 'Studio' : `${bedroom} BHK`;
}

export function formatFloor(floor: number, totalFloors: number): string {
  const name = floor === 0 ? 'Ground' : `${floor}`;
  if (!Number.isFinite(totalFloors) || totalFloors <= 0) return name;
  return `${name} of ${totalFloors}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

/**
 * The API serves timestamps with a `Z` suffix while the assignment's reference
 * clock is IST, so relative ages are computed against the Asia/Kolkata day.
 */
export function formatRelativeDate(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const days = Math.round((now.getTime() - date.getTime()) / 86_400_000);

  if (days < 0) return `Dated ${formatDate(iso)}`;
  if (days === 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days} days ago`;
  if (days < 60) return 'Posted last month';
  if (days < 365) return `Posted ${Math.round(days / 30)} months ago`;
  return `Posted ${formatDate(iso)}`;
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  const formatted = new Intl.NumberFormat('en-IN').format(value);
  return `${formatted} ${value === 1 ? singular : plural}`;
}
