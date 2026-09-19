# 💰 Expense Tracker — Local-First Personal Finance

A modern, privacy-focused, local-first web application for tracking personal expenses. No servers, no accounts, zero tracking — all data is preserved locally in your browser with full backup, export/import capabilities, rich interactive analytics, and responsive design.

![Expense Tracker](public/expenses.png)

---

## 🌟 Key Features

### 🛡️ Local-First & Data Safety
- **Versioned Envelope Architecture**: Data is stored with schema versioning (`schemaVersion: 2`) and timestamps.
- **Non-Destructive Migrations**: Automatically detects and upgrades legacy storage formats without data loss.
- **Automatic Snapshots & Backups**: Snapshots data before destructive operations or imports.
- **Multi-Tab Sync**: Real-time synchronization across multiple open browser tabs.
- **Defensive Error Handling**: Graceful fallback when private browsing mode or storage quotas limit localStorage.

### ✏️ Core Experience
- **Add / Edit / Delete Expenses**: Edit any expense with pre-filled forms; modal delete confirmation with a **5-second Undo** toast.
- **Custom Note / Description**: Add contextual details (up to 150 characters) to each expense.
- **Instant Search & Filters**: Debounced search matching notes, categories, and amounts; date range and category filters.
- **Sortable Columns**: Click table headers to sort by Amount, Category, Date, or Notes.
- **Friendly Empty States**: Helpful prompts when no items exist or when filters match 0 results.

### 📊 Insights & Analytics
- **Category Donut Chart**: Powered by Chart.js with percentage and formatted currency tooltips.
- **6-Month Spending Trend Bar Chart**: Visualize spending patterns over time.
- **Monthly Comparison Metrics**: Automatically compares current month vs. last month with % change indicator and top spending category.

### 🔄 Data Portability
- **JSON Export & Import**: Download full versioned JSON backups; inspect import file previews with choice of **Merge** or **Replace**.
- **CSV Export**: Export flattened rows ready for Excel, Google Sheets, or Numbers.

### 🎨 Design & Polish
- **Pastel Card Identity**: Modern aesthetic with soft coral, teal, and lavender cards.
- **Dark Mode**: System-aware or manual Dark Mode toggle.
- **Mobile-First Responsive Layout**: Converts to mobile cards on narrow screens.
- **Custom Categories**: Add and delete custom categories via settings.
- **Currency Customization**: Select between ₹, $, €, £, ¥, AED, C$, A$, etc.
- **PWA & Offline Ready**: Service worker and web app manifest for installable offline use.
- **Keyboard Shortcuts**: `Ctrl+/` or `Cmd+/` to search, `Escape` to close modals.

---

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server with hot-reload
npm run dev
```

### Production Build
```bash
# Build optimized production bundle to dist/
npm run build

# Preview production build locally
npm run preview
```

### Automated Tests
```bash
# Run unit & migration tests
npm test
```

---

## 📁 Architecture Overview

```
Expense-Tracker/
├── index.html                # Main application markup & modal dialogs
├── package.json              # Project dependencies and npm scripts
├── vite.config.js            # Vite build configuration
├── test/
│   └── storage-and-validation.test.js # Storage, migration & validation tests
├── public/
│   ├── expenses.png          # App icon
│   ├── manifest.json         # PWA Manifest
│   └── sw.js                 # Offline service worker
└── src/
    ├── main.js               # Application bootstrap
    ├── js/
    │   ├── storage.js        # Versioned localStorage, backups, migrations, multi-tab sync
    │   ├── state.js          # In-memory reactive state manager & observer pattern
    │   ├── ui.js             # DOM manipulation, toasts, modals, and event bindings
    │   ├── validation.js     # Form & category validation
    │   ├── charts.js         # Chart.js donut and spending trend visualizations
    │   ├── export.js         # JSON & CSV portability handlers
    │   └── utils.js          # Currency/date formatting, ID generator, debounce
    └── scss/
        ├── main.scss         # SCSS master bundle
        ├── abstracts/        # _variables.scss, _mixins.scss
        ├── base/             # _reset.scss, _typography.scss
        ├── components/       # _card, _table, _form, _button, _toast, _modal, _charts, _filters, _empty-state
        ├── layout/           # _header, _grid
        └── themes/           # _dark.scss
```

---

## 📄 License
MIT
