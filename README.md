# Personal Wealth OS

A personal financial planning dashboard — portfolio, retirement, education, marriage, risk, and recommendations — built from the "Personal Wealth OS" Claude Design canvas.

## Stack

- React 18 + TypeScript + Vite, Tailwind CSS for layout utilities
- Supabase (Postgres + Auth + Storage) — single-user, email/password login
- Netlify Functions (serverless) — proxy market data, FX rates, and Gemini AI calls so third-party API keys never reach the browser
- Financial engine (`src/financial/`) — a self-contained, framework-agnostic Monte Carlo retirement/education/marriage model, pure functions/classes with no UI dependency

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in real values (see comments in that file for where each key comes from: Supabase, Finnhub, ExchangeRate-API, Gemini).
3. Run the SQL in `supabase/schema.sql` once, in your Supabase project's SQL Editor, to create the tables and Row-Level Security policies.
4. `npm run dev` — starts the Vite dev server *and* a local stand-in for Netlify Functions together (see note below).
5. Open http://localhost:5173, create an account, and go.

### Why a local functions stand-in instead of `netlify dev`?

`netlify-cli` currently has a compatibility issue with newer Node versions on this machine (`TypeError: Cannot read properties of undefined (reading 'Intrinsic')`). `scripts/functions-server.mjs` is a small Node HTTP server that runs the exact same files in `netlify/functions/` locally, proxied through Vite at `/.netlify/functions/*`. In production, Netlify serves those functions natively — no code difference, just a different local dev transport. If `netlify-cli` starts working on your machine, `npx netlify dev` should work as a drop-in alternative.

## Project structure

```
src/
  financial/    pure calculation engine (Model class, view-model builder, types, demo data)
  hooks/        React state: auth, cloud-synced plan data, uploads, the main app hook
  components/   small shared UI pieces (style-string helper, hover-state wrapper)
  layouts/      header, floating nav rail, what-if drawer
  pages/        the 9 screens (Overview, Portfolio, Retirement, Education, Marriage, Risk,
                Recommendations, Assumptions, Upload)
  lib/          Supabase client, upload-file parsing (spreadsheet + Gemini vision)
netlify/functions/   fx-rates, market-quotes, parse-statement, narrate-recommendation
supabase/schema.sql  database schema + Row-Level Security policies
```

## Notes on data & AI

- Demo data is clearly labeled throughout the UI (`DEMO DATA` banner) until you upload your own holdings.
- The Recommendations engine is rule-based and deterministic — it decides *what* to recommend and computes every number. "AI Advisor" mode only rewrites the narrative prose around those already-computed facts (via Gemini); it never introduces new figures, and falls back instantly to the standard wording if the AI call fails.
- Uploaded PDFs/screenshots are parsed via Gemini vision into structured holdings with a confidence level per field — nothing is silently guessed. Anything uncertain is queued for your review instead of being merged automatically.
