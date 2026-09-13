import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { fetchListing, fetchProject } from '@/api/resources';
import { useListings } from '@/hooks/useDataset';
import { corruptionReasons, CORRUPTION_LABELS, hasPlantedInstructions } from '@/lib/dataQuality';
import { Badge, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui/Primitives';
import { PropertyGlyph } from '@/components/ui/PropertyGlyph';
import { FavouriteButton } from '@/components/listings/FavouriteButton';
import { ListingCard } from '@/components/listings/ListingCard';
import {
  formatArea,
  formatBhk,
  formatDate,
  formatPrice,
  formatPricePerSqft,
  formatRelativeDate,
  formatFloor,
  titleCase,
} from '@/lib/format';
import type { Listing } from '@/api/types';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-sand-100 py-3 last:border-0">
      <dt className="text-xs tracking-wide text-sand-400 uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-sand-800">{value}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/buy"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-900"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
        <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back to properties
    </Link>
  );
}

export function ListingDetailPage() {
  const { id = '' } = useParams();

  const listingQuery = useQuery<Listing>({
    queryKey: ['listing', id],
    queryFn: ({ signal }) => fetchListing(id, signal),
    enabled: Boolean(id),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  const listing = listingQuery.data;

  const projectQuery = useQuery({
    queryKey: ['project', listing?.project_id],
    queryFn: ({ signal }) => fetchProject(listing!.project_id, signal),
    enabled: Boolean(listing?.project_id),
    retry: false,
  });

  // /v1/listings/{id}/similar does not exist, so comparable homes are derived locally.
  const { data: allListings } = useListings();
  const similar = useMemo(() => {
    if (!listing || !allListings) return [];
    return allListings
      .filter(
        (row) =>
          row.listing_id !== listing.listing_id &&
          row.locality === listing.locality &&
          row.bedroom === listing.bedroom &&
          row.price > 0,
      )
      .sort((a, b) => Math.abs(a.price - listing.price) - Math.abs(b.price - listing.price))
      .slice(0, 4);
  }, [listing, allListings]);

  const now = useMemo(() => new Date(), []);

  if (listingQuery.isPending) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  if (listingQuery.isError) {
    const err = listingQuery.error;
    const notFound = err instanceof ApiError && err.status === 404;

    return (
      <div className="space-y-6">
        <BackLink />
        {notFound ? (
          <EmptyState
            title="That property is no longer listed"
            description={`We could not find a listing with the id "${id}". It may have been removed, or the link may be incorrect.`}
            action={
              <Link
                to="/buy"
                className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
              >
                Browse all properties
              </Link>
            }
          />
        ) : (
          <ErrorState
            message={err instanceof ApiError ? err.message : 'This property could not be loaded.'}
            onRetry={() => listingQuery.refetch()}
            retrying={listingQuery.isFetching}
          />
        )}
      </div>
    );
  }

  if (!listing) return null;

  const flags = corruptionReasons(listing, now);
  const project = projectQuery.data;
  const plantedText = hasPlantedInstructions(listing.description);

  return (
    <div className="space-y-8">
      <BackLink />

      <div className="overflow-hidden rounded-[--radius-card] border border-sand-200 bg-white">
        <PropertyGlyph
          seed={listing.listing_id}
          propertyType={listing.property_type}
          className="h-48 w-full sm:h-64"
          label={`${titleCase(listing.property_type)} in ${titleCase(listing.locality)}`}
        />

        <div className="flex flex-wrap items-start justify-between gap-5 p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{titleCase(listing.property_type)}</Badge>
              {listing.is_verified ? <Badge tone="brand">Verified listing</Badge> : <Badge tone="neutral">Unverified</Badge>}
              {!listing.is_live && <Badge tone="warning">No longer active</Badge>}
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-sand-900">
              {listing.apartment_name || 'Unnamed property'}
            </h1>
            <p className="mt-1 text-sm text-sand-500">
              {formatBhk(listing.bedroom)} · {titleCase(listing.locality)} · {formatArea(listing.carpet_area)} carpet
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div>
              <p className="tnum text-3xl font-semibold tracking-tight text-sand-900">{formatPrice(listing.price)}</p>
              <p className="tnum mt-0.5 text-sm text-sand-500 sm:text-right">
                {formatPricePerSqft(listing.price, listing.carpet_area)}
              </p>
            </div>
            <FavouriteButton listing={listing} withLabel />
          </div>
        </div>
      </div>

      {flags.length > 0 && (
        <div role="alert" className="rounded-[--radius-card] border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">This listing contains impossible data</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {flags.map((flag) => (
              <li key={flag}>· {CORRUPTION_LABELS[flag]}</li>
            ))}
          </ul>
          <p className="mt-2.5 text-xs text-amber-700">
            The values below are shown exactly as the API returned them, without correction.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-sand-900">Property details</h2>
            <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
              <DetailRow label="Configuration" value={formatBhk(listing.bedroom)} />
              <DetailRow label="Bathrooms" value={listing.bathroom > 0 ? String(listing.bathroom) : 'Not applicable'} />
              <DetailRow label="Balconies" value={String(listing.balcony ?? 0)} />
              <DetailRow label="Carpet area" value={formatArea(listing.carpet_area)} />
              <DetailRow
                label="Super built-up area"
                value={
                  listing.super_built_up_area > listing.carpet_area
                    ? formatArea(listing.super_built_up_area)
                    : `${formatArea(listing.super_built_up_area)} — inconsistent with carpet area`
                }
              />
              <DetailRow
                label="Floor"
                value={listing.total_floors > 0 ? formatFloor(listing.floor, listing.total_floors) : 'Not applicable'}
              />
              <DetailRow label="Furnishing" value={titleCase(listing.furnishing)} />
              <DetailRow label="Facing" value={titleCase(listing.facing_direction)} />
              <DetailRow label="Covered parking" value={listing.covered_parking > 0 ? `${listing.covered_parking} space${listing.covered_parking === 1 ? '' : 's'}` : 'None listed'} />
              <DetailRow label="Posted" value={`${formatDate(listing.posted_at)} · ${formatRelativeDate(listing.posted_at, now)}`} />
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-sand-900">Description</h2>
            {plantedText && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This description contains text addressed to automated tools rather than to buyers. It is shown verbatim as
                property data and is not acted on.
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-sand-600">{listing.description || 'No description provided.'}</p>
          </Card>

          {similar.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-sand-900">Comparable homes nearby</h2>
              <p className="mt-1 mb-4 text-sm text-sand-500">
                Matched locally on locality and configuration — the API's <code className="font-mono text-xs">/similar</code>{' '}
                endpoint returns 404.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                {similar.map((row) => (
                  <ListingCard key={row.listing_id} listing={row} />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-sand-900">Listed by</h2>
            <dl className="mt-3">
              <DetailRow label="Contact" value={listing.posted_by_name || '—'} />
              <DetailRow label="Role" value={titleCase(listing.posted_by)} />
              <DetailRow label="Phone" value={listing.posted_by_contact || '—'} />
              <DetailRow label="Source" value={titleCase(listing.website)} />
            </dl>
            {listing.listing_url && (
              <a
                href={listing.listing_url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-sand-300 text-sm font-medium text-sand-700 transition-colors hover:bg-sand-100"
              >
                View on {titleCase(listing.website)}
              </a>
            )}
          </Card>

          {listing.project_id && (
            <Card className="p-5">
              <h2 className="text-base font-semibold text-sand-900">Project</h2>
              {projectQuery.isPending ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : project ? (
                <dl className="mt-3">
                  <DetailRow label="Name" value={project.apartment_name} />
                  <DetailRow label="Developer" value={project.developer_name} />
                  <DetailRow label="Status" value={titleCase(project.project_status)} />
                  <DetailRow label="Possession" value={formatDate(project.possession_date)} />
                  <DetailRow label="RERA" value={project.rera_number || '—'} />
                </dl>
              ) : (
                <p className="mt-3 text-sm text-sand-500">
                  Linked to project <span className="font-mono text-xs">{listing.project_id}</span>, but its details could
                  not be loaded.
                </p>
              )}
            </Card>
          )}

          <Card className="p-5">
            <h2 className="text-base font-semibold text-sand-900">Listing reference</h2>
            <dl className="mt-3">
              <DetailRow label="Listing ID" value={listing.listing_id} />
              <DetailRow label="Coordinates" value={`${listing.latitude.toFixed(5)}, ${listing.longitude.toFixed(5)}`} />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
