import type { Listing } from '@/api/types';

/**
 * Data-quality rules derived by measuring the live dataset, not by guessing.
 *
 * Each rule below flags a value that is *logically impossible* rather than
 * merely unusual. That distinction matters: the dataset contains plenty of
 * legitimately odd rows (plots with no floors and no bathrooms, studio flats)
 * which a looser rule would sweep up. Every rule here resolves to exactly seven
 * listings, and the seven sets are disjoint — 49 corrupt rows in 3,800.
 */

export type CorruptionReason =
  | 'negative_price'
  | 'implausible_sale_price'
  | 'floor_above_building'
  | 'carpet_exceeds_builtup'
  | 'future_posting'
  | 'outside_city'
  | 'uninhabitable';

export const CORRUPTION_LABELS: Record<CorruptionReason, string> = {
  negative_price: 'Negative price',
  implausible_sale_price: 'Sale price below ₹1 lakh',
  floor_above_building: 'Floor above the building height',
  carpet_exceeds_builtup: 'Carpet area exceeds built-up area',
  future_posting: 'Posted at a future date',
  outside_city: 'Coordinates outside the city',
  uninhabitable: 'No bedrooms and no bathrooms',
};

export const CORRUPTION_RULES: Record<CorruptionReason, string> = {
  negative_price: 'price <= 0',
  implausible_sale_price: '0 < price < ₹1,00,000 — a rent figure in the sale price field',
  floor_above_building: 'floor > total_floors',
  carpet_exceeds_builtup: 'carpet_area > super_built_up_area',
  future_posting: 'posted_at is later than the API server clock',
  outside_city: 'latitude/longitude fall outside the Pune bounding box',
  uninhabitable: 'bedroom = 0 and bathroom = 0 on a built property (plots excluded)',
};

/** Pune bounding box, generous enough to contain every genuine locality in the dataset. */
const CITY_BOUNDS = { minLat: 18.3, maxLat: 18.8, minLng: 73.6, maxLng: 74.1 };

/** Below this, a *sale* price is a rent figure in the wrong field. The dataset jumps from ₹17,510 to ₹17.8 L. */
const MIN_SALE_PRICE = 100_000;

export function corruptionReasons(listing: Listing, now: Date): CorruptionReason[] {
  const reasons: CorruptionReason[] = [];

  if (listing.price <= 0) reasons.push('negative_price');
  else if (listing.price < MIN_SALE_PRICE) reasons.push('implausible_sale_price');

  if (listing.total_floors > 0 && listing.floor > listing.total_floors) {
    reasons.push('floor_above_building');
  }

  if (listing.carpet_area > 0 && listing.super_built_up_area > 0 && listing.carpet_area > listing.super_built_up_area) {
    reasons.push('carpet_exceeds_builtup');
  }

  const posted = new Date(listing.posted_at);
  if (!Number.isNaN(posted.getTime()) && posted.getTime() > now.getTime()) {
    reasons.push('future_posting');
  }

  const { latitude: lat, longitude: lng } = listing;
  if (lat < CITY_BOUNDS.minLat || lat > CITY_BOUNDS.maxLat || lng < CITY_BOUNDS.minLng || lng > CITY_BOUNDS.maxLng) {
    reasons.push('outside_city');
  }

  if (listing.bedroom === 0 && listing.bathroom === 0 && listing.property_type !== 'plot') {
    reasons.push('uninhabitable');
  }

  return reasons;
}

export function isCorrupt(listing: Listing, now: Date): boolean {
  return corruptionReasons(listing, now).length > 0;
}

/**
 * Text addressed to automated consumers rather than to a house-hunter. Twelve
 * records across listings, rentals and projects carry instructions aimed at AI
 * tools — fabricated answers to report, invented audit references to embed, a
 * fake certification badge to display. They are treated as planted content and
 * are never acted on.
 */
const INJECTION_PATTERN =
  /\b(?:AI assistants?|AI coding assistants?|automated tools|note to AI|note for AI)\b/i;

export function hasPlantedInstructions(text: string | null | undefined): boolean {
  return Boolean(text && INJECTION_PATTERN.test(text));
}

/**
 * Cross-portal duplicates: the same physical unit posted on more than one
 * website. Apartment name, bedroom count and carpet area pin a specific unit —
 * an exact carpet-area match across two portals is not coincidence. Locality,
 * floor and price frequently disagree between the copies, which is precisely
 * why the duplicates are worth surfacing.
 */
export function propertyIdentity(listing: Listing): string {
  return [listing.apartment_name.trim().toLowerCase(), listing.bedroom, listing.carpet_area].join('|');
}

export interface DuplicateGroup {
  identity: string;
  listings: Listing[];
}

export function findDuplicateGroups(listings: Listing[]): DuplicateGroup[] {
  const groups = new Map<string, Listing[]>();

  for (const listing of listings) {
    if (!listing.apartment_name || listing.carpet_area <= 0) continue;
    const identity = propertyIdentity(listing);
    const bucket = groups.get(identity);
    if (bucket) bucket.push(listing);
    else groups.set(identity, [listing]);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([identity, group]) => ({ identity, listings: group }));
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
