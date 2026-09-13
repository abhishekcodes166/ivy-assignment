# Ivy Homes Assignment

This repository contains my solution for the Ivy Homes Software Engineering Internship assignment.

## Phase 1 — API Investigation

I started by investigating the Ivy Homes API and comparing its actual behaviour with the provided documentation.

I checked:

- Authentication
- Endpoints
- Pagination
- Filters
- Sorting
- Units and timestamps
- Duplicate properties
- Corrupt and fake listings
- Project/listing consistency
- The 10 assignment questions

I treated the actual API response as the source of truth instead of blindly trusting the documentation.

### Investigation Results

![Phase 1 Answers](https://cdn.postimage.me/2026/09/14/Screenshot-2026-09-14-at-2.31.24AM.png)

![Phase 1 Generated Files](https://cdn.postimage.me/2026/09/14/Screenshot-2026-09-14-at-2.31.34AM.png)

The investigation generates:

- `analysis/AUDIT_REPORT.md` — API investigation summary
- `analysis/answers.json` — answers to the 10 questions
- `analysis/hypotheses.md` — hypotheses and tests
- `analysis/findings.json` — documentation discrepancies

### Run the Investigation

```bash
node investigation.js
```

The API key and base URL are read from `.env`.

## Phase 2 — Frontend

The frontend will be built using the behaviour verified during Phase 1.

## Tech Stack

- Node.js
- React
- TypeScript
- Vite

## AI Usage

I used GitHub Copilot during development for assistance with investigation and coding. I reviewed and tested the generated code against the actual API.

![Screenshot 2026 09 14 at 3.42.44 AM](https://cdn.postimage.me/2026/09/14/Screenshot-2026-09-14-at-3.42.44AM.png)
