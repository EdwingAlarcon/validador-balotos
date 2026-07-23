# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Start server (production mode)
npm run dev      # Start with nodemon (auto-reload on changes)
npm test         # Run endpoint tests via tests/test-endpoints.js
```

To populate the SQLite database with historical draw data:
```bash
node src/services/initialScraping.js
```

The app runs on `http://localhost:3000` by default (`PORT` env var overrides).

## Architecture

This is a Node.js/Express web app that validates Colombian lottery tickets (Baloto, Miloto, Colorloto) using live and historical data from web scraping.

**Entry point:** `src/server.js` — Express server with all API routes defined inline.

**Services (`src/services/`):**
- `database.js` — `better-sqlite3` wrapper; single SQLite file at `data/historical.db`. Table: `historical_results` with columns `game`, `sorteo`, `fecha`, `numeros` (comma-separated), `superBalota`, `colorNumberPairs` (JSON). `initDatabase()` is called at server startup.
- `intelligentGenerator.js` — Position-aware frequency analysis using Walker's Alias Method. Falls back to pure random if fewer than `MIN_SORTEOS_FOR_STATISTICS` (20) draws are in DB. Caches frequency tables for 5 minutes.
- `acumuladosOficiales.js` — Scrapes current jackpot amounts from `baloto.com`; 10-minute cache. Used as a data enrichment fallback in lottery result endpoints.
- `initialScraping.js` — Seeds/refreshes the DB (called at startup and every 6h by `autoScrape()` in `server.js`). Tries `baloto.com` official (via Firecrawl, only if `FIRECRAWL_API_KEY` is set) first, falls back to `resultadobaloto.com` on failure or if no key is configured. Can be `require()`d or run directly.
- `officialScraper.js` — Pure parsers for `baloto.com`'s listing pages (Baloto/Revancha share one page, Miloto and Colorloto each have their own). No network I/O.
- `firecrawlClient.js` — Thin wrapper around the Firecrawl REST API (`POST /v2/scrape`), used because `baloto.com`'s result pages are JS-rendered and `axios`+`cheerio` can't read them directly.

**Frontend:** Single-page app in `public/`. `public/js/app.js` is the main client script (vanilla JS). `public/index.html` is the only page. Must be served through Express — do not open directly in browser (CORS).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server status + DB record count |
| GET | `/api/baloto-combined` | Baloto + Revancha in one HTTP fetch (preferred) |
| GET | `/api/baloto` | Latest Baloto result |
| GET | `/api/baloto-revancha` | Latest Baloto Revancha result |
| GET | `/api/miloto` | Latest Miloto result |
| GET | `/api/colorloto` | Latest Colorloto result |
| GET | `/api/generate/baloto` | Intelligent number generator |
| GET | `/api/generate/miloto` | Intelligent number generator |
| GET | `/api/generate/colorloto` | Intelligent number generator |
| GET | `/api/statistics` | Frequency stats from DB |
| GET | `/api/history/:game` | Historical draws (max 200, `?limit=N`) |
| GET | `/api/history/:game/:sorteoId` | Single draw by sorteo number |
| POST | `/api/validate-historical` | Validate ticket against historical draw |

Valid `:game` values: `Baloto`, `Baloto Revancha`, `Miloto`, `Colorloto`.

Rate limiting: 30 requests per 10 minutes on scraping endpoints.

## Scraping Details

- **Primary source**: `baloto.com` (official), read via Firecrawl (`firecrawlClient.js`) since its result pages are JS-rendered. Requires `FIRECRAWL_API_KEY` (see `.env.example`); without it, this path is skipped entirely.
- **Backup source**: `resultadobaloto.com`, read directly with `axios`+`cheerio` (server-rendered, no JS needed). Used automatically when the official source isn't configured, fails, or returns no data. `baloto.com` is also used directly (non-Firecrawl) for current jackpots in `acumuladosOficiales.js`.
- Every scraping run (either source) is logged to the `scraping_log` table (`database.js`: `logScrapingRun`/`getRecentScrapingLogs`) — game, source URL, status, counts, duration, error.
- HTML cache in-memory (backup path only): 10-minute TTL per URL, shared across requests.
- Backup source: Baloto Revancha numbers are embedded in the same panel as Baloto: indices 5–9 of `.label-baloto` elements, second `.label-comple` as its Súper Balota. Colorloto uses `.circulo` spans with CSS classes (`bolaamarilla`, `bolaazul`, etc.) to identify colors; numbers 1–7.
- `UNIQUE(game, sorteo)` on `historical_results` (not `fecha` — its text format varies between scraping runs) makes re-scraping idempotent regardless of source.
- `scripts/backfill-official.js` — manual maintenance tool (not run by the server) to fill historical gaps by fetching individual `baloto.com` detail pages via Firecrawl.

## Game Rules

- **Baloto**: 5 numbers (1–43) + Súper Balota (1–16)
- **Baloto Revancha**: same format as Baloto, drawn simultaneously
- **Miloto**: 5 numbers (1–39), no Súper Balota
- **Colorloto**: 6 color-number pairs; 6 colors (amarillo, azul, rojo, verde, blanco, negro), numbers 1–7 per color

## Code Style

Prettier config (`.prettierrc.js`): 4-space indent, single quotes, 120-char line width, trailing commas in ES5 positions, LF line endings.
