# Expense Tracker — Production Plan & Feature List

*Based on the current live app at bhavreet1.github.io/Expense-Tracker — a 3-card layout (Expenses List, Add Expenses, Total Expenses) with amount/category/date fields, a fixed category dropdown, add/remove only, no notes field, no mobile layout, and no data portability.*

---

## 1. Guiding Principles

1. **Local-first, always.** No backend, no server, no account. Every byte of data lives in the user's own browser — that's the product's core promise, not just a feature.
2. **Never lose a user's data.** Every future release — new fields, new storage format, new categories — must be backward-compatible with what's already sitting in someone's browser.
3. **Same stack, better organized.** Vanilla HTML/SCSS/JS is fine for an app this size. The goal is structure and polish, not a framework rewrite.
4. **Mobile-first.** The current "phone view under development" gap is the single biggest thing standing between this and "production-grade."
5. **Accessible and forgiving by default** — clear errors, confirmations before destructive actions, undo where possible.

---

## 2. Data & Storage Architecture (do this before anything else)

This section matters most because it's the part that can silently destroy a user's data if done carelessly — and it's the foundation everything else (edit, import/export, categories) sits on.

- **Versioned storage envelope.** Instead of storing a bare array of expenses, store an object like `{ schemaVersion, updatedAt, expenses: [...], categories: [...], settings: {...} }`. A version number lets every future release know exactly how to read old data.
- **Non-destructive migration on load.** On startup, detect the stored format. If it's the old bare-array format (what the current app likely uses), transform it into the new envelope *without deleting anything*, then write it back once. Every future schema bump gets its own small migration step (v1→v2, v2→v3…) that only adds/transforms fields — it never drops data it doesn't recognize.
- **Backup before you touch anything.** Before any migration or import runs, snapshot the existing raw value into a separate backup key. If a migration or import goes wrong, there's a way back.
- **Defensive reads/writes.** Wrap all storage access in error handling — corrupted/non-JSON values, storage quota exceeded, and private-browsing modes (some browsers throw on write) should show a friendly recovery message, never a silent data wipe or a crash.
- **Multi-tab safety.** Listen for the browser's `storage` event so that if the user has the app open in two tabs, edits in one don't get silently overwritten by the other.

---

## 3. Full Feature List

### P0 — Must-have (core usefulness + data safety)
- **Edit an existing expense** — right now only add/remove exist, which is a basic gap
- **Custom note / description field** on each expense (free text, e.g. up to 150 characters) — the feature you specifically asked for
- **Non-destructive storage migration** (see Section 2)
- **Inline form validation** — amount must be a positive number, date and category required, clear inline error messages instead of silent failure
- **Delete confirmation + "Undo" toast** — deleting should never be a single accidental click with no recovery
- **Mobile-responsive layout** — stacked cards, touch-friendly inputs, table that adapts to narrow screens
- **Empty state** — a friendly message/prompt when there are zero expenses instead of a blank table
- **Toast/snackbar feedback** for add, edit, delete, import, and export actions

### P0 — Data portability (explicitly requested)
- **Export to JSON** — includes schema version, export timestamp, all expenses, categories, and settings, downloaded as a `.json` file
- **Import from JSON** — validates file structure *before* touching existing data, shows a preview ("Found 42 expenses, dated Jan–Sep 2026"), then lets the user choose **Merge** (add to existing, de-duplicated) or **Replace** (behind a strong confirmation, since it's destructive)
- **Export to CSV** — near-zero extra work once JSON export exists, and opens directly in Excel/Google Sheets

### P1 — Should-have (turns it from a logger into something useful)
- Search box (matches note text, category, amount)
- Filters — by category, date range, amount range
- Sortable table columns — date, amount, category
- Category breakdown chart (donut/pie) — where the money is actually going
- Spending-over-time chart (weekly/monthly bar or line)
- Monthly summary — this month vs. last month, % change
- User-defined custom categories, not just the fixed dropdown list
- Proper currency formatting (₹1,000 not ₹1000)
- Settings panel — currency symbol, date format, theme, and a dedicated "Data" tab (export/import/clear-all-with-confirmation)

### P2 — Nice-to-have
- Budgets per category or per month, with a progress bar and a gentle warning near the limit
- Recurring expenses (rent, subscriptions) that auto-log on a schedule
- Dark mode
- PWA support — installable, works fully offline (a natural fit since everything is already local)
- Keyboard shortcuts for power users
- Print-friendly monthly report view

### Stretch / future
- Multi-currency support
- Optional password-protected export, for people who back the JSON file up to cloud storage they control
- "Connect your own Google Drive/Dropbox" backup — still no server of yours involved, just the user's own storage

---

## 4. UX/UI Redesign Plan

- **Keep the pastel, card-based identity** — it's friendly and distinctive. Refine it by defining a real design system in SCSS (color, spacing on a 4/8px scale, radius, shadow, type scale) so every component pulls from shared tokens instead of one-off values.
- **Row actions as icons** (pencil/trash) instead of text buttons like "remove," with inline or modal-based editing.
- **Restyle the date input deliberately** — the native browser date picker looks inconsistent across browsers; give it consistent styling in both light and dark themes.
- **Loading and empty states everywhere** data is read from storage, not just the table.
- **Micro-interactions** — hover/focus/active states on every interactive element, subtle transitions for cards and toasts.
- **One consistent icon set**, inlined as SVG — no icon-font or framework dependency needed.
- **Mobile-first breakpoints** — stack the three cards vertically on small screens, collapse the add-expense form to one column, and either make the table horizontally scrollable or convert rows into stacked "cards" on narrow viewports.
- **Accessibility pass** — proper label/input associations, an ARIA live region for toasts, focus trapping in modals, visible focus rings, WCAG AA color contrast.

---

## 5. Technical Architecture

- Stay with vanilla HTML/SCSS/JS, but **split the JS into small modules by responsibility**: storage (read/write/migrate), state (in-memory expense list + subscribers), UI rendering, validation, and chart/analytics helpers.
- **Organize SCSS with the 7-1 pattern** (abstracts for variables/mixins, base, components, layout, pages, themes) instead of one flat stylesheet — it'll scale much better as features are added.
- **Add a lightweight build step** (e.g. Vite) purely for SCSS compilation, minification, and a dev server with hot reload. Optional, but pays off once the codebase grows past a single file.
- **Add automated tests specifically for the storage/migration logic** — that's the part that can silently destroy user data if it has a bug, so it deserves the most test coverage even if nothing else does.
- **Set up GitHub Actions** to lint (ESLint + Stylelint) and auto-deploy to GitHub Pages on merge to `main`, so every release is consistent.

---

## 6. Production-Readiness Checklist

- Cross-browser testing (Chrome, Firefox, Safari, mobile Safari/Chrome)
- Graceful degradation when localStorage is unavailable (e.g. strict private-browsing mode) — show a clear message instead of failing silently
- Performance: debounce the search input, avoid full-table re-renders on every keystroke, consider simple pagination once the list grows long
- Favicon, page title, and basic meta tags — even a utility app benefits from this for bookmarking and sharing
- A README covering setup, architecture, and how the storage/migration system works — important so a future update doesn't accidentally break it
- `CHANGELOG.md` and semantic versioning for releases — "never lose user data across updates" only holds up if you can trace exactly what changed between versions

---

## 7. Suggested Delivery Order

| Phase | Focus | Why this order |
|---|---|---|
| 1 | Storage foundation — versioned schema, migration safety net, SCSS reorg, JS modularization | No visible UI change, but everything below depends on this being solid first |
| 2 | Core UX gaps — edit, notes field, validation, delete confirm + undo, responsive layout, empty/loading states, toasts | Fixes the biggest usability and functionality gaps in the current app |
| 3 | Data portability — JSON export, JSON import (merge/replace), CSV export | Your explicitly requested features, built on a stable data layer |
| 4 | Insights — search, filter, sort, category chart, monthly trend chart | Turns raw logging into something actually useful |
| 5 | Polish — settings panel, dark mode, PWA/offline support, accessibility audit | Production-grade finishing touches |
| 6 | Stretch — budgets, recurring expenses, multi-currency | Only after the core is solid and stable |
