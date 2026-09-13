import { Link } from 'react-router-dom';
import { Badge, Skeleton } from '@/components/ui/Primitives';
import { PropertyGlyph } from '@/components/ui/PropertyGlyph';
import { FavouriteButton } from './FavouriteButton';
import { formatArea, formatBhk, formatPrice, formatPricePerSqft, formatRelativeDate, titleCase } from '@/lib/format';
import type { Listing } from '@/api/types';

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] tracking-wide text-sand-400 uppercase">{label}</dt>
      <dd className="truncate text-sm font-medium text-sand-800">{value}</dd>
    </div>
  );
}

export function ListingCard({ listing, flagged }: { listing: Listing; flagged?: string[] }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[--radius-card] border border-sand-200 bg-white transition-all hover:border-sand-300 hover:shadow-[0_8px_24px_-12px_rgba(26,23,20,0.22)]">
      <div className="relative">
        <PropertyGlyph
          seed={listing.listing_id}
          propertyType={listing.property_type}
          className="h-36 w-full"
          label={`${titleCase(listing.property_type)} in ${titleCase(listing.locality)}`}
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge tone="neutral" className="bg-white/95 backdrop-blur">
            {titleCase(listing.property_type)}
          </Badge>
          {listing.is_verified && (
            <Badge tone="brand" className="bg-white/95 backdrop-blur">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="size-3">
                <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Verified
            </Badge>
          )}
          {!listing.is_live && (
            <Badge tone="warning" className="bg-white/95 backdrop-blur">
              Inactive
            </Badge>
          )}
        </div>

        <FavouriteButton listing={listing} className="absolute top-3 right-3 shadow-sm" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="tnum text-lg leading-tight font-semibold tracking-tight text-sand-900">
              {formatPrice(listing.price)}
            </p>
            <p className="tnum mt-0.5 text-xs text-sand-500">
              {formatPricePerSqft(listing.price, listing.carpet_area)}
            </p>
          </div>
          <p className="shrink-0 rounded-md bg-sand-100 px-2 py-1 text-xs font-semibold text-sand-700">
            {formatBhk(listing.bedroom)}
          </p>
        </div>

        <h3 className="mt-3 truncate text-sm font-semibold text-sand-900" title={listing.apartment_name}>
          {listing.apartment_name || 'Unnamed property'}
        </h3>
        <p className="truncate text-sm text-sand-500">{titleCase(listing.locality)}</p>

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-sand-100 pt-3">
          <Spec label="Carpet" value={formatArea(listing.carpet_area)} />
          <Spec label="Baths" value={listing.bathroom > 0 ? String(listing.bathroom) : '—'} />
          <Spec label="Furnishing" value={titleCase(listing.furnishing)} />
        </dl>

        {flagged && flagged.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
            <p className="text-[11px] font-medium text-amber-800">Flagged: {flagged.join(', ')}</p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="truncate text-xs text-sand-400">{formatRelativeDate(listing.posted_at)}</span>
          <Link
            to={`/listings/${encodeURIComponent(listing.listing_id)}`}
            className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
          >
            View details
            <span className="absolute inset-0" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[--radius-card] border border-sand-200 bg-white">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-2/5" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-3 gap-3 border-t border-sand-100 pt-3">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </div>
    </div>
  );
}
