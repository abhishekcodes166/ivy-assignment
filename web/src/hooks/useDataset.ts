import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllListings, fetchAllProjects, fetchAllRentals } from '@/api/resources';
import type { Listing, Project, Rental } from '@/api/types';

/**
 * Collections are walked once in full and then cached for the session.
 *
 * This is a deliberate consequence of the API's verified behaviour: `min_price`,
 * `max_price` and `furnishing` are accepted but ignored on listings, and `total`
 * undercounts every collection. Filtering server-side would therefore produce
 * wrong results and wrong counts. Holding the dataset locally makes filtering,
 * sorting, counting and pagination exact, and makes every subsequent filter
 * change instant instead of a round trip.
 */

const DATASET_OPTIONS = {
  staleTime: Infinity,
  gcTime: 30 * 60 * 1000,
  retry: 1,
} as const;

export interface DatasetProgress {
  loaded: number;
  total: number;
}

function useProgress() {
  const [progress, setProgress] = useState<DatasetProgress>({ loaded: 0, total: 0 });
  const onProgress = useCallback((loaded: number, total: number) => setProgress({ loaded, total }), []);
  return { progress, onProgress };
}

export function useListings() {
  const { progress, onProgress } = useProgress();
  const query = useQuery<Listing[]>({
    queryKey: ['dataset', 'listings'],
    queryFn: ({ signal }) => fetchAllListings({ signal, onProgress }),
    ...DATASET_OPTIONS,
  });
  return { ...query, progress };
}

export function useRentals() {
  const { progress, onProgress } = useProgress();
  const query = useQuery<Rental[]>({
    queryKey: ['dataset', 'rentals'],
    queryFn: ({ signal }) => fetchAllRentals({ signal, onProgress }),
    ...DATASET_OPTIONS,
  });
  return { ...query, progress };
}

export function useProjects() {
  const { progress, onProgress } = useProgress();
  const query = useQuery<Project[]>({
    queryKey: ['dataset', 'projects'],
    queryFn: ({ signal }) => fetchAllProjects({ signal, onProgress }),
    ...DATASET_OPTIONS,
  });
  return { ...query, progress };
}
