import { request } from './client';
import { fetchAll, type FetchAllOptions } from './paginate';
import type { Envelope, Listing, Project, Rental, SavedMutationResponse } from './types';

export function fetchAllListings(options?: FetchAllOptions) {
  return fetchAll<Listing>('/v1/listings', 'listing_id', options);
}

export function fetchAllRentals(options?: FetchAllOptions) {
  return fetchAll<Rental>('/v1/rentals', 'listing_id', options);
}

export function fetchAllProjects(options?: FetchAllOptions) {
  return fetchAll<Project>('/v1/projects', 'project_id', options);
}

export function fetchListing(listingId: string, signal?: AbortSignal) {
  return request<Listing>(`/v1/listings/${encodeURIComponent(listingId)}`, { signal });
}

export function fetchProject(projectId: string, signal?: AbortSignal) {
  return request<Project>(`/v1/projects/${encodeURIComponent(projectId)}`, { signal });
}

export async function fetchSaved(signal?: AbortSignal): Promise<Listing[]> {
  const body = await request<Envelope<Listing>>('/v1/saved', { signal });
  return body.results ?? [];
}

export function saveListing(listingId: string) {
  return request<SavedMutationResponse>('/v1/saved', {
    method: 'POST',
    body: { listing_id: listingId },
  });
}

export function unsaveListing(listingId: string) {
  return request<SavedMutationResponse>(`/v1/saved/${encodeURIComponent(listingId)}`, {
    method: 'DELETE',
  });
}
