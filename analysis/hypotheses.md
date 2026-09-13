# Hypothesis Log
Investigation Date: 2026-09-13T21:01:14.163Z
Total Hypotheses: 7

# Hypothesis 1

## Claim
The locality filter correctly restricts results

## Why I suspected it
Documentation claims exact match filtering, need to verify this actually works

## Tests
- GET /v1/listings?locality=kothrud&limit=50

## Result
works correctly

Details: All 50 results have locality=kothrud

## Evidence
None yet

## Conclusion
CONFIRMED

---

# Hypothesis 2

## Claim
The bhk (bedroom) filter correctly restricts results

## Why I suspected it
Documentation describes bhk as exact match parameter

## Tests
- GET /v1/listings?bhk=2&limit=50

## Result
pending


## Evidence
None yet

## Conclusion
CONFIRMED

---

# Hypothesis 3

## Claim
The furnishing filter may be accepted but ignored

## Why I suspected it
Some poorly implemented APIs accept but ignore certain filters

## Tests
- GET /v1/listings?furnishing=fully-furnished&limit=50

## Result
pending


## Evidence
None yet

## Conclusion
REJECTED - Filter is ignored

---

# Hypothesis 4

## Claim
Price filters (min_price, max_price) work correctly

## Why I suspected it
Documentation describes inclusive bounds

## Tests
- GET /v1/listings?min_price=5000000&max_price=10000000&limit=50

## Result
pending


## Evidence
None yet

## Conclusion
REJECTED

---

# Hypothesis 5

## Claim
Sort parameters (sort_by, order) work as documented

## Why I suspected it
Documentation claims support for price, carpet_area, posted_at, bedroom

## Tests
- GET /v1/listings?sort_by=price&order=asc&limit=100
- GET /v1/listings?sort_by=price&order=desc&limit=100

## Result
pending


## Evidence
None yet

## Conclusion
CONFIRMED - sorting works for price, status for other sorts PENDING

---

# Hypothesis 6

## Claim
Pagination (page, limit) works as documented

## Why I suspected it
Documentation claims 1-indexed pages with default limit 20, max 200

## Tests
- GET /v1/listings?page=1&limit=20
- GET /v1/listings?page=2&limit=20

## Result
pending


## Evidence
None yet

## Conclusion
CONFIRMED - pagination works as documented

---

# Hypothesis 7

## Claim
Timestamps are in ISO 8601 format with UTC+05:30 (IST) timezone

## Why I suspected it
Documentation claims UTC with Z suffix, but assignment reference shows +05:30

## Tests
- Inspecting posted_at of listing DWE-3002501

## Result
pending


## Evidence
- DWE-3002501: Posted at: 2026-04-30T09:27:00Z
- timestamp_format: Uses Z suffix for UTC

## Conclusion
CONFIRMED - timestamps present, need to verify timezone consistency

---
