import { request } from './client';
import type { Envelope } from './types';

/** The API silently clamps `limit` to 50 regardless of what is requested. */
export const MAX_PAGE_SIZE = 50;

/** Guards against an unbounded loop if `has_more` never goes false. */
const MAX_PAGES = 400;

const CONCURRENCY = 6;

export interface FetchAllOptions {
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  onProgress?: (loaded: number, totalHint: number) => void;
}

async function fetchPage<T>(path: string, offset: number, opts: FetchAllOptions) {
  return request<Envelope<T>>(path, {
    query: { ...opts.query, limit: MAX_PAGE_SIZE, offset },
    signal: opts.signal,
  });
}

/**
 * Walks every page of a collection.
 *
 * Two behaviours here are driven by verified API quirks rather than preference:
 * the envelope's `total` understates the real row count (listings report 3469
 * but 3800 exist), so it is treated only as a scheduling hint and the walk
 * continues until `has_more` is false; and records are de-duplicated by id
 * because overlapping windows would otherwise inflate the result.
 */
export async function fetchAll<T>(
  path: string,
  idKey: keyof T,
  options: FetchAllOptions = {},
): Promise<T[]> {
  const first = await fetchPage<T>(path, 0, options);

  const byId = new Map<unknown, T>();
  for (const row of first.results) byId.set(row[idKey], row);

  const totalHint = Math.max(first.total, first.results.length);
  options.onProgress?.(byId.size, totalHint);

  if (!first.has_more || first.results.length === 0) return [...byId.values()];

  // Schedule the pages the total hint implies, in parallel batches.
  const plannedOffsets: number[] = [];
  for (let offset = MAX_PAGE_SIZE; offset < totalHint; offset += MAX_PAGE_SIZE) {
    plannedOffsets.push(offset);
  }

  let sawTail = false;
  for (let i = 0; i < plannedOffsets.length; i += CONCURRENCY) {
    const batch = plannedOffsets.slice(i, i + CONCURRENCY);
    const pages = await Promise.all(batch.map((offset) => fetchPage<T>(path, offset, options)));
    for (const page of pages) {
      for (const row of page.results) byId.set(row[idKey], row);
      if (!page.has_more) sawTail = true;
    }
    options.onProgress?.(byId.size, totalHint);
  }

  // `total` undercounts, so keep walking past it until the API says there is no more.
  let offset = plannedOffsets.length ? plannedOffsets[plannedOffsets.length - 1] + MAX_PAGE_SIZE : MAX_PAGE_SIZE;
  let pagesFetched = plannedOffsets.length + 1;

  while (!sawTail && pagesFetched < MAX_PAGES) {
    const page = await fetchPage<T>(path, offset, options);
    for (const row of page.results) byId.set(row[idKey], row);
    pagesFetched += 1;
    offset += MAX_PAGE_SIZE;
    options.onProgress?.(byId.size, Math.max(totalHint, byId.size));
    if (!page.has_more || page.results.length === 0) break;
  }

  return [...byId.values()];
}
