# WhatDatBird?

A bird photo (and call) identification quiz. Pick any place in the world and test your bird ID skills against the species that actually occur there.

**Live:** https://rutherfordecology.github.io/WhatDatBird/

## How it works

1. Pick a place — search, drop a pin on the map, or choose from the quiz library.
2. The species pool for that place is built dynamically from GBIF/iNaturalist occurrence data (no hardcoded regional lists).
3. Identify the bird from a photo (or, in audio mode, from its call) by picking the correct name from a set of close relatives.
4. Score +1 for a correct answer, -2 for a wrong one; reach 10 points to win. Missed birds come back after a 3-bird gap so you get another shot.

### Difficulty modes

- **Common** — top 25 species by observation count
- **Birder** — top 90% by observation count
- **Complete** — every species, served in progressively harder chunks
- **Rarity** — bottom 15% by observation count (disabled if the pool has fewer than 8 species)

Any mode can be toggled to **audio-only**, where you listen to a Xeno-canto recording instead of seeing a photo.

## Architecture

| File | Purpose |
|---|---|
| `index.html` | Landing page — search, map picker, quiz library cards, species browser |
| `quiz.html` | The quiz itself, for any place |
| `about.html` | Standalone about page |
| `engine.js` | Shared engine: data loading, quiz logic, rendering, leaderboard |
| `version.js` | Single source of truth for `APP_VERSION`; every page loads this first and derives its `engine.js?v=` cache-busting query string from it |
| `quizzes.json` | Quiz library, written via the GitHub API |
| `leaderboard.json` | Per-place, per-mode leaderboards, written via the GitHub API |
| `place-names/*.json` | Indigenous/local bird name lookups for specific places (e.g. Samoan names for `8504.json`) |
| `sw.js` / `manifest.json` | PWA support — installable, offline fallback page |
| `beta/` | Mirrors the root files; used to test changes before they're promoted to production. **Served from the same `main` branch** — GitHub Pages serves the whole repo, so `beta/` is live at `/beta/` immediately. |

A `beta` branch also exists and is kept in sync on push, but it's not what GitHub Pages deploys from — production is `main`.

### Data sources

- **Species pool:** GBIF occurrence search first (by country/bounding box), falling back to iNaturalist's `species_counts` endpoint.
- **Photos:** iNaturalist curated taxon photos preferred, falling back to the most-favourited research-grade observation photos. Filtered to `iconic_taxa=Aves` so a loose name match can't pull in a non-bird photo.
- **Bird calls:** Xeno-canto, via a Cloudflare Worker proxy (`whatdatbird-xc-proxy`) that keeps the Xeno-canto API key off the client. Pools up to 10 quality A/B recordings under 10s per species.
- **Field notes / "How to identify":** Wikipedia REST API extracts, fetched by Latin name.
- **Local/indigenous names:** iNaturalist locale-aware name lookups, supplemented by the `place-names/` JSON files for specific places.
- **Distractors:** built from taxonomic closeness — one of the 3 wrong options comes from the 5 closest relatives by shared ancestor, the other two from the next 5.

### Leaderboard

Stored in `leaderboard.json`, keyed by `placeId_mode` (or `coord_lat_lng_mode` for arbitrary map points), top 10 entries per board. Writes go through the GitHub API using a token scoped to this repo; a duplicate/conflicting write returns a 409 with a friendly message instead of failing silently.

## Making changes

- Edit `version.js` (root) **and** `beta/version.js` — bump the `vX.XX` string on every change, in the same commit as the fix/feature. Nothing else needs touching for versioning; every page derives its cache-busting query string from this file automatically.
- Test against `beta/` first, then mirror the change into the root files (or vice versa) before pushing — both are live simultaneously once pushed to `main`.
- When copying `beta/index.html` to the root, fix the `quizzes.json` path: `beta/` needs `../quizzes.json`, root needs `quizzes.json`.
- Push with:
  ```
  git fetch origin && git rebase origin/main
  git push origin main
  git push origin main:beta
  ```

## PWA

Installable as a standalone app (manifest + service worker with an offline fallback page). Icons and splash colours are in `manifest.json`.

## License

MIT — see [LICENSE](LICENSE).
