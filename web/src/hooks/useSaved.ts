import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSaved, saveListing, unsaveListing } from '@/api/resources';
import type { Listing } from '@/api/types';

const SAVED_KEY = ['saved'] as const;

export function useSavedListings(enabled = true) {
  return useQuery<Listing[]>({
    queryKey: SAVED_KEY,
    queryFn: ({ signal }) => fetchSaved(signal),
    enabled,
    staleTime: 30_000,
  });
}

export function useSavedIds(enabled = true) {
  const { data } = useSavedListings(enabled);
  return new Set((data ?? []).map((listing) => listing.listing_id));
}

/**
 * Optimistic toggle with a full rollback path: the previous list is snapshotted
 * before the cache is touched and restored verbatim if the request fails, so a
 * failed save can never leave the heart filled.
 */
export function useToggleSaved() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listing, saved }: { listing: Listing; saved: boolean }) =>
      saved ? unsaveListing(listing.listing_id) : saveListing(listing.listing_id),

    onMutate: async ({ listing, saved }) => {
      await queryClient.cancelQueries({ queryKey: SAVED_KEY });
      const previous = queryClient.getQueryData<Listing[]>(SAVED_KEY);

      queryClient.setQueryData<Listing[]>(SAVED_KEY, (current = []) =>
        saved
          ? current.filter((row) => row.listing_id !== listing.listing_id)
          : [listing, ...current.filter((row) => row.listing_id !== listing.listing_id)],
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(SAVED_KEY, context.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_KEY });
    },
  });
}
