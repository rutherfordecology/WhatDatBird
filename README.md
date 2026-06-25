# WhatDatBird?

A bird photo (and call) identification quiz. Pick any place in the world and test your ID skills against the species that actually occur there — no curated regional lists, no hardcoded species sets.

**Live:** https://rutherfordecology.github.io/WhatDatBird/

This started as a quick way to learn the birds of Samoa ahead of a family holiday, then kept growing into the dynamic, any-place-in-the-world quiz it is today. Built entirely with [Claude Code](https://claude.com/claude-code), and a lot of learning along the way.

## How it works

Pick a place — search by name, drop a pin on the map, or choose from the quiz library — and the app builds a species pool for it on the spot, querying GBIF occurrence data first (by country or bounding box) and falling back to iNaturalist's `species_counts` endpoint where GBIF's coverage is thin. That pool is split into four difficulty modes: **Common** (the top 25 species by observation count), **Birder** (the top 90%, a realistic trip-level challenge), **Complete** (every recorded species, served in progressively harder chunks), and **Rarity** (the bottom 15%, disabled if fewer than 8 species qualify). Any mode can be switched to audio-only, swapping the photo for a Xeno-canto call recording.

Each question shows a photo or call, and a set of multiple-choice names drawn from the bird's closest relatives — distractors come from the 5 nearest species by shared ancestor, plus two more from the next 5, so the wrong answers are genuinely confusable rather than random. A correct guess scores +1, a wrong one costs -2, and the target is 10 points to win; missed birds aren't dropped, they come back after a 3-bird gap so there's another shot at learning them. Alongside each bird, the app also surfaces a locale-aware common name (plus indigenous names for a few specific places), a short Wikipedia-derived "how to identify" note, and additional photos. Finishing a round lets you save your score to that place's leaderboard and see how you rank for that place and mode.

## Data sources

| Use | Source |
|---|---|
| Species pool & occurrence frequency | GBIF occurrence search, with iNaturalist `species_counts` as a fallback |
| Photos | iNaturalist curated taxon photos, falling back to the most-favourited research-grade observation photos (filtered to `iconic_taxa=Aves`) |
| Bird calls | Xeno-canto, via a Cloudflare Worker proxy (`whatdatbird-xc-proxy`) that keeps the API key off the client; up to 10 quality A/B recordings under 10s pooled per species |
| Field notes | Wikipedia REST API extracts, fetched by Latin name |
| Local/indigenous names | iNaturalist locale-aware lookups, supplemented by `place-names/*.json` for specific places |
| Quiz library & leaderboards | Static JSON (`quizzes.json`, `leaderboard.json`) written back to this repo via the GitHub API |

The leaderboard is keyed by `placeId_mode` (or `coord_lat_lng_mode` for arbitrary map points), keeps the top 10 entries per board, and returns a friendly 409 message on a conflicting write rather than failing silently.

## Architecture

The app is a static site with no backend: `index.html` is the landing page (search, map picker, library, species browser), `quiz.html` runs the quiz for any place, and `about.html` is a standalone about page. All three share `engine.js`, which handles data loading, quiz logic, rendering, and the leaderboard. `version.js` is the single source of truth for `APP_VERSION` — every page loads it first and derives its `engine.js?v=` cache-busting query string from it automatically.

`beta/` mirrors the root files and is used to test changes before they're promoted to production. It's served from the same `main` branch — GitHub Pages serves the whole repo, so `beta/` is live at `/beta/` immediately, not on a separate branch. It's also a full PWA: installable via `manifest.json`, with `sw.js` providing offline fallback.

## Making changes

Bump the `vX.XX` string in `version.js` **and** `beta/version.js` on every change, in the same commit as the fix or feature — nothing else needs touching for versioning. Test against `beta/` first, then mirror the change into the root files (or vice versa) before pushing, since both are live simultaneously once pushed to `main`. When copying `beta/index.html` to the root, fix the `quizzes.json` path: `beta/` needs `../quizzes.json`, root needs `quizzes.json`. Then push:

```
git fetch origin && git rebase origin/main
git push origin main
```

## License

MIT — see [LICENSE](LICENSE).
