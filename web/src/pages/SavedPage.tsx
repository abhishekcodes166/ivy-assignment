import { Link } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { useSavedListings } from '@/hooks/useSaved';
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard';
import { EmptyState, ErrorState } from '@/components/ui/Primitives';
import { formatCount } from '@/lib/format';

export function SavedPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useSavedListings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-sand-900">Saved properties</h1>
        <p className="mt-1 text-sm text-sand-500">
          Stored against your Ivy Homes account, so this list follows you across devices and survives signing out.
        </p>
      </div>

      {isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load your saved properties"
          message={error instanceof ApiError ? error.message : 'Something went wrong.'}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : data.length === 0 ? (
        <EmptyState
          title="You have not saved any properties yet"
          description="Tap the heart on any listing to keep it here. Saved properties are stored on your account rather than in this browser."
          action={
            <Link
              to="/buy"
              className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Browse properties
            </Link>
          }
        />
      ) : (
        <>
          <p className="tnum text-sm text-sand-600">{formatCount(data.length, 'saved property', 'saved properties')}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((listing) => (
              <ListingCard key={listing.listing_id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
