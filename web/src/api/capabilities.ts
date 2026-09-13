/**
 * Verified API behaviour, measured directly against solve.ivy.homes rather than
 * taken from the API reference. Everything the UI does about filtering, sorting
 * and pagination is derived from this table, and the Insights audit renders it
 * so the app never claims a capability it does not have.
 */

export type AuditCategory = 'auth' | 'pagination' | 'filters' | 'sorting' | 'endpoints' | 'data';

export type AuditStatus = 'broken' | 'undocumented' | 'partial';

export interface AuditEntry {
  id: string;
  endpoint: string;
  category: AuditCategory;
  status: AuditStatus;
  documented: string;
  actual: string;
  evidence: string;
  impact: string;
}

export const API_AUDIT: AuditEntry[] = [
  {
    id: 'auth-header',
    endpoint: 'all endpoints',
    category: 'auth',
    status: 'broken',
    documented: 'The API key may be supplied as an `api_key` query parameter.',
    actual: 'Query-parameter keys are rejected. The key must travel in an `X-API-Key` header.',
    evidence: 'GET /health?api_key=… → 401 "send your key in the X-API-Key request header, not as a query parameter"',
    impact: 'Every request in the app sets the X-API-Key header.',
  },
  {
    id: 'auth-token-field',
    endpoint: 'POST /auth/login',
    category: 'auth',
    status: 'broken',
    documented: 'Login returns the bearer token as `token`.',
    actual: 'The field is `access_token`, alongside `refresh_token`, `expires_in` (900s) and `refresh_url`.',
    evidence: 'POST /auth/login → { access_token, refresh_token, token_type, expires_in: 900, refresh_url, user }',
    impact: 'Reading `token` yields undefined, so every later call 401s despite a successful login.',
  },
  {
    id: 'pagination-page',
    endpoint: 'GET /v1/listings, /v1/rentals, /v1/projects',
    category: 'pagination',
    status: 'broken',
    documented: '1-indexed `page` parameter, default limit 20, max 200.',
    actual: '`page` is ignored entirely. Pagination is `offset`/`limit`, and `limit` is clamped to 50.',
    evidence: 'page=1 and page=2 return byte-identical first rows; limit=200 returns 50 with envelope.limit = 50.',
    impact: 'Paging by `page` silently re-reads the first 50 rows forever.',
  },
  {
    id: 'total-undercount',
    endpoint: 'GET /v1/listings, /v1/rentals, /v1/projects',
    category: 'pagination',
    status: 'broken',
    documented: '`total` is the number of records matching the query.',
    actual: 'Every collection understates `total`. Walking `has_more` to exhaustion returns more rows than `total` promises.',
    evidence: 'listings total=3469 → 3800 walked · rentals total=1324 → 1450 walked · projects total=402 → 440 walked',
    impact: 'Result counts and page totals are computed from the walked dataset, never from `total`.',
  },
  {
    id: 'filter-price',
    endpoint: 'GET /v1/listings',
    category: 'filters',
    status: 'broken',
    documented: '`min_price` and `max_price` bound the result set inclusively.',
    actual: 'Both are accepted and ignored. The unfiltered total comes back unchanged and out-of-range rows are present.',
    evidence: 'min_price=5000000&max_price=10000000 → total unchanged at 3469, with rows at ₹40.9L and ₹2.13Cr in the first page alone.',
    impact: 'Price filtering is done in the browser against the full walked dataset.',
  },
  {
    id: 'filter-furnishing-listings',
    endpoint: 'GET /v1/listings',
    category: 'filters',
    status: 'broken',
    documented: '`furnishing` filters to the requested furnishing type.',
    actual: 'Accepted and ignored on sale listings. All three furnishing values still come back.',
    evidence: 'furnishing=fully-furnished → total 3469, results contain unfurnished and semi-furnished rows.',
    impact: 'Furnishing filtering is done in the browser.',
  },
  {
    id: 'filter-furnishing-rentals',
    endpoint: 'GET /v1/rentals',
    category: 'filters',
    status: 'partial',
    documented: 'Filters behave consistently across listings and rentals.',
    actual: 'The same `furnishing` parameter that is ignored on /v1/listings genuinely works on /v1/rentals.',
    evidence: 'rentals furnishing=fully-furnished → total 437 of 1324; listings furnishing=fully-furnished → total unchanged.',
    impact: 'Filter support cannot be assumed to carry across endpoints; it is verified per endpoint.',
  },
  {
    id: 'filter-bhk',
    endpoint: 'GET /v1/listings, /v1/rentals',
    category: 'filters',
    status: 'undocumented',
    documented: 'Bedroom count is filtered with `bedroom`.',
    actual: 'The working parameter is `bhk`. `bedroom` and `bedrooms` are accepted and ignored.',
    evidence: 'bhk=2 → total 1135 (all bedroom=2) · bedroom=2 → total 3469 spanning 0–5 bedrooms.',
    impact: 'The app sends `bhk`; sending `bedroom` would return everything.',
  },
  {
    id: 'filter-misc-ignored',
    endpoint: 'GET /v1/listings, /v1/rentals, /v1/projects',
    category: 'filters',
    status: 'broken',
    documented: 'Listings accept `project_id`, `is_live`, `posted_by` and `city` filters.',
    actual: 'All are accepted and ignored, as is `developer_name` on projects and `property_type` on rentals.',
    evidence: 'project_id=P30001 → total 3469 with mixed project_ids · developer_name=Brigade → total 402 (all projects).',
    impact: 'These refinements are applied in the browser.',
  },
  {
    id: 'filter-working',
    endpoint: 'GET /v1/listings, /v1/rentals, /v1/projects',
    category: 'filters',
    status: 'partial',
    documented: 'Locality matching is case-sensitive.',
    actual: 'locality (case-insensitive), bhk, and property_type on listings genuinely filter, as do locality/project_status on projects.',
    evidence: 'locality=Kothrud and locality=kothrud both → total 349 · property_type=apartment → 2534 · project_status=ready to move → 143.',
    impact:
      'Genuinely usable, but the app still filters locally so that working and broken filters behave identically and results stay consistent.',
  },
  {
    id: 'sort-posted-at',
    endpoint: 'GET /v1/listings',
    category: 'sorting',
    status: 'broken',
    documented: '`sort_by=posted_at` orders results chronologically.',
    actual: 'Accepted but the ordering is wrong — timestamps arrive out of sequence in both directions.',
    evidence: 'order=desc returns 2026-09-09T02:26Z before 2026-09-09T14:24Z, and 2026-09-08T22:42Z in the middle of 09-09 rows.',
    impact: 'The "Newest first" sort is computed in the browser, not delegated.',
  },
  {
    id: 'sort-carpet-area',
    endpoint: 'GET /v1/listings',
    category: 'sorting',
    status: 'partial',
    documented: '`sort_by=carpet_area` orders results by carpet area.',
    actual: 'Broadly ordered, but rows with small areas surface in the wrong position.',
    evidence: 'order=desc → …2398, 2392, 216, 2298… with 195 and 189 similarly misplaced.',
    impact: 'Area sorting is computed in the browser.',
  },
  {
    id: 'sort-working',
    endpoint: 'GET /v1/listings',
    category: 'sorting',
    status: 'partial',
    documented: 'Sortable fields are price, carpet_area, posted_at and bedroom.',
    actual: 'The field list is correct and enforced (400 on anything else), but only price and bedroom actually sort correctly.',
    evidence: "sort_by=nonsense → 400 \"sortable fields: ['bedroom', 'carpet_area', 'posted_at', 'price']\"",
    impact: 'Sorting is applied client-side across the board so every option behaves identically.',
  },
  {
    id: 'endpoint-analytics',
    endpoint: 'GET /v1/analytics/summary',
    category: 'endpoints',
    status: 'broken',
    documented: 'Returns aggregate market statistics.',
    actual: 'The endpoint does not exist — 404 Not Found.',
    evidence: 'GET /v1/analytics/summary → 404 {"detail":"Not Found"}',
    impact: 'Every figure on the Insights page is computed in the browser from the walked dataset.',
  },
  {
    id: 'endpoint-similar',
    endpoint: 'GET /v1/listings/{id}/similar',
    category: 'endpoints',
    status: 'broken',
    documented: 'Returns listings similar to the given listing.',
    actual: 'The endpoint does not exist — 404 Not Found.',
    evidence: 'GET /v1/listings/DWE-3002501/similar → 404',
    impact: 'Similar properties are derived locally from locality and bedroom count, and labelled as such.',
  },
  {
    id: 'endpoint-saved',
    endpoint: '/v1/saved',
    category: 'endpoints',
    status: 'undocumented',
    documented: 'Favourites are described at /v1/favourites.',
    actual: 'The real collection is /v1/saved. GET returns whole listing objects; POST takes { listing_id }; DELETE /v1/saved/{id} removes one.',
    evidence: 'GET /v1/favourites → 404 · GET /v1/saved → 200 {"count":0,"results":[]} · POST → 201 { ok, listing_id, saved_count }',
    impact: 'Saved properties are stored server-side and are per-user, so they survive logout and reappear on another device.',
  },
  {
    id: 'data-injection',
    endpoint: 'GET /v1/listings, /v1/rentals, /v1/projects',
    category: 'data',
    status: 'undocumented',
    documented: 'Descriptions and amenities are free-text property information.',
    actual:
      'Twelve records carry text addressed to "AI assistants" instructing them to report fabricated answers, add invented audit references, or display a fake certification badge.',
    evidence: 'Project P30004 amenities[] and listing descriptions incl. DWE-3002085, DWE-3003745, ZER-3000556, R3000004.',
    impact: 'Treated strictly as untrusted strings: rendered as property text, never followed, and surfaced on Insights.',
  },
  {
    id: 'data-project-price',
    endpoint: 'GET /v1/projects',
    category: 'data',
    status: 'broken',
    documented: '`price_min` and `price_max` bound a project price range.',
    actual: '321 of 440 projects report price_min greater than price_max, and both share one unlabelled unit.',
    evidence: 'P30001 price_min=80, price_max=3.22 · overall both fields span 1 – 99.9.',
    impact: 'Project price ranges are shown from the smaller/larger of the pair, flagged where the source order is inverted.',
  },
  {
    id: 'data-negative-price',
    endpoint: 'GET /v1/listings',
    category: 'data',
    status: 'broken',
    documented: 'Listing price is a positive amount in rupees.',
    actual: 'Some listings carry negative prices, and some carry posted_at timestamps in the future.',
    evidence: 'sort_by=price&order=asc → -15890000, -11500000, -10770000 · sort_by=posted_at&order=desc → 2027-05-03',
    impact: 'These rows are counted as corrupt and excluded from medians and price statistics.',
  },
];

/** Filters the API genuinely honours, per endpoint. Everything else runs client-side. */
export const SERVER_FILTERS = {
  listings: ['locality', 'bhk', 'property_type'] as const,
  rentals: ['locality', 'bhk', 'furnishing'] as const,
  projects: ['locality', 'project_status'] as const,
};
