import { useMemo, useState } from 'react';
import { ApiError } from '@/api/client';
import { useRentals } from '@/hooks/useDataset';
import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/ui/Primitives';
import { PropertyGlyph } from '@/components/ui/PropertyGlyph';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { facetValues, pageCount, paginate } from '@/lib/filterListings';
import {
  formatArea,
  formatBhk,
  formatCount,
  formatRelativeDate,
  formatRent,
  formatRupees,
  formatFloor,
  titleCase,
} from '@/lib/format';
import type { Rental } from '@/api/types';

const PAGE_SIZE = 24;

type RentSort = 'default' | 'rent_asc' | 'rent_desc' | 'area_desc' | 'newest';

function RentalCard({ rental }: { rental: Rental }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[--radius-card] border border-sand-200 bg-white transition-all hover:border-sand-300 hover:shadow-[0_8px_24px_-12px_rgba(26,23,20,0.22)]">
      <div className="relative">
        <PropertyGlyph seed={rental.listing_id} propertyType={rental.property_type} className="h-28 w-full" />
        {/* The amber rent chip is the constant that separates rentals from sale cards at a glance. */}
        <span className="absolute top-3 left-3 rounded-md bg-accent-500 px-2 py-1 text-xs font-semibold text-white shadow-sm">
          For rent
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="tnum text-lg leading-tight font-semibold tracking-tight text-sand-900">{formatRent(rental.price)}</p>

        <h3 className="mt-2.5 truncate text-sm font-semibold text-sand-900" title={rental.title}>
          {rental.title || rental.apartment_name}
        </h3>
        <p className="truncate text-sm text-sand-500">
          {rental.apartment_name} · {titleCase(rental.locality)}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="neutral">{formatBhk(rental.bedroom)}</Badge>
          <Badge tone="neutral">{rental.bathroom} bath</Badge>
          <Badge tone="neutral">{titleCase(rental.furnishing)}</Badge>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-sand-100 pt-3 text-sm">
          <div>
            <dt className="text-[11px] tracking-wide text-sand-400 uppercase">Deposit</dt>
            <dd className="tnum font-medium text-sand-800">{formatRupees(rental.deposit)}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-wide text-sand-400 uppercase">Maintenance</dt>
            <dd className="tnum font-medium text-sand-800">
              {rental.maintenance > 0 ? `${formatRupees(rental.maintenance)}/mo` : 'None'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-wide text-sand-400 uppercase">Carpet area</dt>
            <dd className="font-medium text-sand-800">{formatArea(rental.carpet_area)}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-wide text-sand-400 uppercase">Floor</dt>
            <dd className="font-medium text-sand-800">
              {rental.total_floors > 0 ? formatFloor(rental.floor, rental.total_floors) : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-sand-400">
          <span className="truncate">
            {titleCase(rental.posted_by)} · {rental.posted_by_name}
          </span>
          <span className="shrink-0">{formatRelativeDate(rental.posted_at)}</span>
        </div>
      </div>
    </article>
  );
}

export function RentalsPage() {
  const { data, isPending, isError, error, refetch, isFetching, progress } = useRentals();
  const [locality, setLocality] = useState('');
  const [bhk, setBhk] = useState('');
  const [furnishing, setFurnishing] = useState('');
  const [sort, setSort] = useState<RentSort>('default');
  const [page, setPage] = useState(1);

  const rentals = useMemo(() => data ?? [], [data]);

  const facets = useMemo(
    () => ({
      localities: facetValues(rentals, 'locality') as string[],
      bedrooms: (facetValues(rentals, 'bedroom') as number[]).sort((a, b) => a - b),
      furnishings: facetValues(rentals, 'furnishing') as string[],
    }),
    [rentals],
  );

  const filtered = useMemo(() => {
    const rows = rentals.filter((rental) => {
      if (locality && rental.locality !== locality) return false;
      if (bhk && rental.bedroom !== Number(bhk)) return false;
      if (furnishing && rental.furnishing !== furnishing) return false;
      return true;
    });

    switch (sort) {
      case 'rent_asc':
        return [...rows].sort((a, b) => a.price - b.price);
      case 'rent_desc':
        return [...rows].sort((a, b) => b.price - a.price);
      case 'area_desc':
        return [...rows].sort((a, b) => b.carpet_area - a.carpet_area);
      case 'newest':
        return [...rows].sort((a, b) => Date.parse(b.posted_at) - Date.parse(a.posted_at));
      default:
        return rows;
    }
  }, [rentals, locality, bhk, furnishing, sort]);

  const totalPages = pageCount(filtered.length, PAGE_SIZE);
  const safePage = Math.min(page, totalPages);
  const visible = paginate(filtered, safePage, PAGE_SIZE);
  const activeCount = [locality, bhk, furnishing].filter(Boolean).length;

  function clear() {
    setLocality('');
    setBhk('');
    setFurnishing('');
    setPage(1);
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Header />
        <ErrorState
          title="Could not load rentals"
          message={error instanceof ApiError ? error.message : 'Something went wrong.'}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      <div className="rounded-[--radius-card] border border-sand-200 bg-white p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Locality" value={locality} onChange={(e) => { setLocality(e.target.value); setPage(1); }}>
            <option value="">All localities</option>
            {facets.localities.map((value) => (
              <option key={value} value={value}>
                {titleCase(value)}
              </option>
            ))}
          </Select>

          <Select label="Bedrooms" value={bhk} onChange={(e) => { setBhk(e.target.value); setPage(1); }}>
            <option value="">Any</option>
            {facets.bedrooms.map((count) => (
              <option key={count} value={String(count)}>
                {count === 0 ? 'Studio' : `${count} BHK`}
              </option>
            ))}
          </Select>

          <Select label="Furnishing" value={furnishing} onChange={(e) => { setFurnishing(e.target.value); setPage(1); }}>
            <option value="">Any</option>
            {facets.furnishings.map((value) => (
              <option key={value} value={value}>
                {titleCase(value)}
              </option>
            ))}
          </Select>

          <Select label="Sort" value={sort} onChange={(e) => { setSort(e.target.value as RentSort); setPage(1); }}>
            <option value="default">Default order</option>
            <option value="rent_asc">Rent: low to high</option>
            <option value="rent_desc">Rent: high to low</option>
            <option value="area_desc">Carpet area: largest first</option>
            <option value="newest">Newest first</option>
          </Select>
        </div>

        {activeCount > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-sand-100 pt-4">
            <p className="text-sm text-sand-500">
              {activeCount} filter{activeCount === 1 ? '' : 's'} applied
            </p>
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-sand-600" role="status" aria-live="polite">
        {isPending ? (
          <span className="text-sand-400">
            Loading rentals{progress.total > 0 && ` — ${progress.loaded} of ~${progress.total}`}…
          </span>
        ) : (
          <span className="tnum font-semibold text-sand-900">{formatCount(filtered.length, 'rental')}</span>
        )}
      </p>

      {isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No rentals match your current filters"
          description="Try a different locality or configuration, or clear the filters to see every available rental."
          action={
            activeCount > 0 ? (
              <Button variant="secondary" onClick={clear}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((rental) => (
              <RentalCard key={rental.listing_id} rental={rental} />
            ))}
          </div>
          <div className="flex flex-col items-center gap-3 pt-2">
            <Pagination page={safePage} pageCount={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
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
      <h1 className="text-2xl font-semibold tracking-tight text-sand-900">Homes for rent</h1>
      <p className="mt-1 text-sm text-sand-500">
        Monthly rent, deposit and maintenance exactly as the API reports them. Rent filters run locally, since the API
        ignores its own price bounds here too.
      </p>
    </div>
  );
}
