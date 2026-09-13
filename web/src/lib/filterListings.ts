import type { Furnishing, Listing, PropertyType } from '@/api/types';

export type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'area_desc' | 'newest' | 'bedrooms_desc';

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'relevance', label: 'Default order' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'area_desc', label: 'Carpet area: largest first' },
  { value: 'newest', label: 'Newest first' },
  { value: 'bedrooms_desc', label: 'Most bedrooms' },
];

export interface ListingFilters {
  locality: string;
  bhk: string;
  furnishing: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  verifiedOnly: boolean;
  hideCorrupt: boolean;
}

export const EMPTY_FILTERS: ListingFilters = {
  locality: '',
  bhk: '',
  furnishing: '',
  propertyType: '',
  minPrice: '',
  maxPrice: '',
  verifiedOnly: false,
  hideCorrupt: true,
};

export function countActiveFilters(filters: ListingFilters): number {
  let count = 0;
  if (filters.locality) count++;
  if (filters.bhk) count++;
  if (filters.furnishing) count++;
  if (filters.propertyType) count++;
  if (filters.minPrice) count++;
  if (filters.maxPrice) count++;
  if (filters.verifiedOnly) count++;
  if (!filters.hideCorrupt) count++;
  return count;
}

function toNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface FilterInput {
  listings: Listing[];
  filters: ListingFilters;
  corruptIds: ReadonlySet<string>;
}

export function filterListings({ listings, filters, corruptIds }: FilterInput): Listing[] {
  const minPrice = toNumber(filters.minPrice);
  const maxPrice = toNumber(filters.maxPrice);
  const bhk = toNumber(filters.bhk);
  const locality = filters.locality.trim().toLowerCase();

  return listings.filter((listing) => {
    if (filters.hideCorrupt && corruptIds.has(listing.listing_id)) return false;
    if (locality && listing.locality?.toLowerCase() !== locality) return false;
    if (bhk !== null && listing.bedroom !== bhk) return false;
    if (filters.furnishing && listing.furnishing !== (filters.furnishing as Furnishing)) return false;
    if (filters.propertyType && listing.property_type !== (filters.propertyType as PropertyType)) return false;
    if (filters.verifiedOnly && !listing.is_verified) return false;
    if (minPrice !== null && listing.price < minPrice) return false;
    if (maxPrice !== null && listing.price > maxPrice) return false;
    return true;
  });
}

export function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  if (sort === 'relevance') return listings;

  const sorted = [...listings];

  switch (sort) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'area_desc':
      return sorted.sort((a, b) => b.carpet_area - a.carpet_area);
    case 'bedrooms_desc':
      return sorted.sort((a, b) => b.bedroom - a.bedroom);
    case 'newest':
      return sorted.sort((a, b) => Date.parse(b.posted_at) - Date.parse(a.posted_at));
    default:
      return sorted;
  }
}

export function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function pageCount(totalRows: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalRows / pageSize));
}

/** Collects the distinct values actually present, so no filter offers a dead option. */
export function facetValues<T, K extends keyof T>(rows: T[], key: K): Array<T[K]> {
  return [...new Set(rows.map((row) => row[key]).filter((v) => v !== null && v !== undefined && v !== ''))].sort(
    (a, b) => String(a).localeCompare(String(b)),
  );
}
