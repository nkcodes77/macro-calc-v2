# Macro Calc

Personal macro tracker for one user (Neil), installed on iPhone as a home-screen web app. Its two jobs are accurate
calorie and protein tracking, and suggesting meals from what is in the pantry to finish the day's remaining macros.
The development plan lives in the "Macro Calc development plan" doc; this file is the short version every session and
agent must follow.

## Working stance

Act as a senior engineer on this codebase. Prefer small, tested, reversible changes. Never weaken a check to make it
pass. If a request conflicts with the rules below, say so before doing it.

## Stack

- React 19 + TypeScript (strict, `noUncheckedIndexedAccess`) + Vite, deployed to GitHub Pages by `.github/workflows/ci.yml`
- PWA via `vite-plugin-pwa` (update prompt, offline precache)
- Tests: Vitest + Testing Library (unit), Playwright on WebKit at iPhone 13 size (end to end)
- Lint: oxlint. Format: Prettier.
- Storage: Dexie (IndexedDB), schema in `src/db/db.ts`, all access through `src/db/repo.ts`. Screens read with `useLiveQuery`.
- Validation: Zod schemas in `src/core/schemas.ts` for foods, entries, goals and backups
- Routing: React Router with hash URLs (works on GitHub Pages and offline)
- No global state library yet; add Zustand only when live queries stop being enough

## Commands

- `npm run dev` local dev server
- `npm run check` typecheck + lint + format check + unit tests with coverage + build (must pass before any commit)
- `npm run e2e` Playwright (WebKit). Use `PW_BROWSER=chromium npm run e2e` only if WebKit is not installed locally.

## Code rules

- `src/core/` holds pure logic only (nutrition math, unit conversion, meal solver, migrations). No React, DOM or
  storage imports there. Coverage on `src/core/` must stay at or above 90%.
- All nutrition math is in grams at full precision. Foods are stored per 100g with named portions. Round only for display.
- Every food carries a source (`label`, `usda`, `off`, `manual`) and a `verified` flag. Never invent nutrition values;
  if a value cannot be sourced, leave the food unverified and say so.
- Any change to stored data shape ships with a versioned migration and a migration test. Never reset user data.
- Every bug fix starts with a failing test that reproduces it.
- Components use CSS Modules and tokens from `src/index.css`. No hard-coded colors, font sizes or spacing.

## Design rules

- Direction is the Nutrition Facts panel: heavy ink rules, condensed bold numbers, sentence-case labels.
- Cobalt (`--protein`) means protein and nothing else. `--over` only marks being over a goal.
- No all-caps labels, no dot-separated meta strings, no progress rings, no decorative gradients or shadows.
- Touch targets at least 44px. Main actions sit in the bottom half of the screen. AA contrast in light and dark.
- Copy is plain and specific: buttons say what happens ("Log food", "Save goals").

## Agents

Specialist subagents live in `.claude/agents/`. Use them proactively:
test-writer after adding logic, nutrition-checker after any food data change, design-reviewer after any UI change,
code-reviewer before merging, release-checker before calling a phase done.
