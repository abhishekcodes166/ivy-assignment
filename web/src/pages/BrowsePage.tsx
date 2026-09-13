import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useListings } from '@/hooks/useDataset';
import { ApiError } from '@/api/client';
import { corruptionReasons } from '@/lib/dataQuality';
import {
  countActiveFilters,
  facetValues,
  filterListings,
  pageCount,
  paginate,
  sortListings,
  SORT_OPTIONS,
  type ListingFilters,
  type SortKey,
} from '@/lib/filterListings';
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard';
import { ListingFilterBar } from '@/components/listings/ListingFilters';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { formatCount } from '@/lib/format';

const PAGE_SIZE = 24;

/** Filters live in the URL so a filtered view can be shared, bookmarked and navigated back to. */
function readFilters(params: URLSearchParams): ListingFilters {
  return {
    locality: params.get('locality') ?? '',
    bhk: params.get('bhk') ?? '',
    furnishing: params.get('furnishing') ?? '',
    propertyType: params.get('type') ?? '',
    minPrice: params.get('min') ?? '',
    maxPrice: params.get('max') ?? '',
    verifiedOnly: params.get('verified') === '1',
    hideCorrupt: params.get('corrupt') !== '1',
  };
}

const PARAM_KEYS: Record<keyof ListingFilters, string> = {
  locality: 'locality',
  bhk: 'bhk',
  furnishing: 'furnishing',
  propertyType: 'type',
  minPrice: 'min',
  maxPrice: 'max',
  verifiedOnly: 'verified',
  hideCorrupt: 'corrupt',
};

export function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const { data, isPending, isError, error, refetch, isFetching, progress } = useListings();

  const filters = readFilters(params);
  const sort = (params.get('sort') as SortKey) ?? 'relevance';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const listings = useMemo(() => data ?? [], [data]);

  // The server clock is the reference for "future" postings, not the user's device.
  const now = useMemo(() => new Date(), []);

  const corruptMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const listing of listings) {
      const reasons = corruptionReasons(listing, now);
      if (reasons.length) map.set(listing.listing_id, reasons);
    }
    return map;
  }, [listings, now]);

  const corruptIds = useMemo(() => new Set(corruptMap.keys()), [corruptMap]);

  const filtered = useMemo(
    () => sortListings(filterListings({ listings, filters, corruptIds }), sort),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listings, corruptIds, sort, params.toString()],
  );

  const totalPages = pageCount(filtered.length, PAGE_SIZE);
  const safePage = Math.min(page, totalPages);
  const visible = paginate(filtered, safePage, PAGE_SIZE);

  const update = useCallback(
    (patch: Partial<ListingFilters>) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(patch)) {
        const param = PARAM_KEYS[key as keyof ListingFilters];
        if (key === 'hideCorrupt') {
          // Default is "hidden", so only the opt-in appears in the URL.
          if (value === false) next.set(param, '1');
          else next.delete(param);
        } else if (value === true) {
          next.set(param, '1');
        } else if (value === false || value === '' || value === undefined) {
          next.delete(param);
        } else {
          next.set(param, String(value));
        }
      }
      next.delete('page');
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const next = new URLSearchParams(params);
      if (nextPage <= 1) next.delete('page');
      else next.set('page', String(nextPage));
      setParams(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [params, setParams],
  );

  const clearAll = useCallback(() => {
    const next = new URLSearchParams();
    if (sort !== 'relevance') next.set('sort', sort);
    setParams(next, { replace: true });
  }, [setParams, sort]);

  const facets = useMemo(
    () => ({
      localities: facetValues(listings, 'locality') as string[],
      bedrooms: (facetValues(listings, 'bedroom') as number[]).sort((a, b) => a - b),
      propertyTypes: facetValues(listings, 'property_type') as string[],
      furnishings: facetValues(listings, 'furnishing') as string[],
    }),
    [listings],
  );

  const activeCount = countActiveFilters(filters);

  if (isError) {
    const message = error instanceof ApiError ? error.message : 'The listings could not be loaded.';
    return (
      <div className="space-y-6">
        <Header />
        <ErrorState title="Could not load listings" message={message} onRetry={() => refetch()} retrying={isFetching} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      <ListingFilterBar
        filters={filters}
        onChange={update}
        onClear={clearAll}
        activeCount={activeCount}
        {...facets}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-sand-600" role="status" aria-live="polite">
          {isPending ? (
            <span className="text-sand-400">
              Loading properties{progress.total > 0 && ` — ${progress.loaded} of ~${progress.total}`}…
            </span>
          ) : (
            <>
              <span className="tnum font-semibold text-sand-900">{formatCount(filtered.length, 'property', 'properties')}</span>
              {activeCount > 0 && <span className="text-sand-400"> of {listings.length.toLocaleString('en-IN')}</span>}
            </>
          )}
        </p>

        <div className="w-full sm:w-56">
          <Select
            aria-label="Sort results"
            value={sort}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.value === 'relevance') next.delete('sort');
              else next.set('sort', e.target.value);
              next.delete('page');
              setParams(next, { replace: true });
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No properties match your current filters"
          description="Try widening the price range, choosing a different locality, or clearing the filters to see everything available."
          action={
            activeCount > 0 ? (
              <Button variant="secondary" onClick={clearAll}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((listing) => (
              <ListingCard
                key={listing.listing_id}
                listing={listing}
                flagged={corruptMap.get(listing.listing_id)}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <Pagination page={safePage} pageCount={totalPages} onPageChange={setPage} />
            <p className="tnum text-xs text-sand-400">
              Page {safePage} of {totalPages} · showing {visible.length} of {filtered.length.toLocaleString('en-IN')}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-sand-900">Properties for sale</h1>
      <p className="mt-1 text-sm text-sand-500">
        Filtering and sorting run against the complete dataset in your browser, because the API ignores its own price and
        furnishing filters.
      </p>
    </div>
  );
}
