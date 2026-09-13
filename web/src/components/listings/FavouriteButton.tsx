import { useSavedIds, useToggleSaved } from '@/hooks/useSaved';
import { cn } from '@/lib/cn';
import type { Listing } from '@/api/types';

interface FavouriteButtonProps {
  listing: Listing;
  className?: string;
  withLabel?: boolean;
}

export function FavouriteButton({ listing, className, withLabel = false }: FavouriteButtonProps) {
  const savedIds = useSavedIds();
  const toggle = useToggleSaved();

  const saved = savedIds.has(listing.listing_id);
  const pending = toggle.isPending && toggle.variables?.listing.listing_id === listing.listing_id;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle.mutate({ listing, saved });
      }}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${listing.apartment_name} from saved` : `Save ${listing.apartment_name}`}
      title={saved ? 'Remove from saved' : 'Save this property'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border bg-white/95 text-sm font-medium transition-all',
        'hover:scale-[1.03] active:scale-95 disabled:opacity-60',
        withLabel ? 'h-10 px-3.5' : 'size-9 justify-center',
        saved ? 'border-red-200 text-red-600' : 'border-sand-300 text-sand-500 hover:text-red-500',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
        className={cn('size-[18px] transition-transform', pending && 'animate-pulse')}
      >
        <path
          d="M12 20.5s-7.5-4.6-7.5-9.6a4.3 4.3 0 0 1 7.5-2.9 4.3 4.3 0 0 1 7.5 2.9c0 5-7.5 9.6-7.5 9.6Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withLabel && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
