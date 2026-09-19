# Changelog

All notable changes to the Expense Tracker project are documented here.

## [2.0.0] - 2026-09-11

### Added
- **Versioned Storage Envelope**: Added schema versioning (`schemaVersion: 2`) with non-destructive backward compatibility and automated backups.
- **Multi-Tab Sync**: Synchronize state across multiple open tabs in real-time via `storage` event listeners.
- **Expense Editing**: Added modal-based editing for existing expenses with pencil action icons.
- **Notes / Description Field**: Added optional note field (up to 150 chars) displayed on table and search.
- **Delete Confirmation with 5s Undo**: Added modal confirmation with temporary undo buffer and snackbar action.
- **Search & Filters**: Added debounced search matching notes/categories/amounts, date range picker, and category filter.
- **Sortable Columns**: Table headers for Amount, Category, Date, and Note are now clickable to sort in ascending or descending order.
- **Chart.js Visualizations**: Interactive Category Donut breakdown and 6-Month Spending Trend bar chart.
- **Monthly Spending Insights**: Current month vs. last month comparison widget with % change badges.
- **Data Portability**: Full JSON backup export and import (with preview, validation, Merge/Replace modes) and CSV export.
- **Dark Mode**: System-aware and manual dark mode theme switch.
- **Custom Categories**: Add and remove custom categories directly in Settings.
- **Currency Switcher**: Support for ₹, $, €, £, ¥, AED, C$, A$, and international currency formatting.
- **PWA & Offline Support**: Web App Manifest and Service Worker with cache fallback.
- **Vite & Modular SCSS 7-1 Architecture**: Built with Vite and modular SCSS design system.
- **Automated Test Suite**: Unit tests for storage, migration, validation, and analytics calculations.

### Changed
- Refactored monolithic `app.js` and `style.scss` into modular JS/SCSS files.
- Replaced text "remove" button with SVG action icons.
- Enhanced mobile layout with responsive stacked cards.

---

## [1.0.0] - Initial Release
- Basic 3-card layout (Expenses List, Add Expenses, Total Expenses).
- Add and delete expense operations with bare localStorage array.
