/**
 * UI Rendering and DOM Interaction Controller
 */

import { formatCurrency, formatDate, escapeHTML, truncate } from './utils.js';
import { validateExpense, validateCategoryName } from './validation.js';
import { computeMonthlyStats, renderCategoryChart, renderTrendChart } from './charts.js';
import { exportToJSON, exportToCSV, previewImportJSON } from './export.js';

// SVG Icons
export const ICONS = {
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
  delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
  sortAsc: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
  sortDesc: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
  sortNone: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  plus: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  sparkle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
  upload: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
};

/**
 * Toast notification manager
 */
export class ToastManager {
  constructor(containerId = 'toast-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show toast
   * @param {Object} options
   * @param {string} options.message
   * @param {'success'|'error'|'info'|'warning'} [options.type='info']
   * @param {number} [options.duration=3500]
   * @param {string} [options.actionLabel]
   * @param {Function} [options.onAction]
   */
  show({ message, type = 'info', duration = 3500, actionLabel, onAction }) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');

    const msgSpan = document.createElement('span');
    msgSpan.className = 'toast__message';
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    if (actionLabel && onAction) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast__action-btn';
      actionBtn.textContent = actionLabel;
      actionBtn.onclick = (e) => {
        e.stopPropagation();
        onAction();
        this.dismiss(toast);
      };
      toast.appendChild(actionBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast__close-btn';
    closeBtn.setAttribute('aria-label', 'Close toast');
    closeBtn.innerHTML = ICONS.close;
    closeBtn.onclick = () => this.dismiss(toast);
    toast.appendChild(closeBtn);

    this.container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    if (duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(toast);
      }, duration);
      toast._timer = timer;
    }

    return toast;
  }

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    if (toast._timer) clearTimeout(toast._timer);
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--leaving');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

export const toast = new ToastManager();

/**
 * UI Renderer Class
 */
export class UIRenderer {
  constructor(state) {
    this.state = state;
    this.currentEditId = null;
    this.currentDeleteId = null;
    this.stagedImportData = null;
  }

  /**
   * Initial mount: attaches all DOM listeners
   */
  init() {
    this.bindAddForm();
    this.bindSearchAndFilters();
    this.bindTableSorting();
    this.bindEditModal();
    this.bindDeleteModal();
    this.bindImportModal();
    this.bindSettingsModal();
    this.bindKeyboardShortcuts();
    this.applyTheme(this.state.getState().settings.theme);

    // Subscribe to state changes to re-render UI
    this.state.subscribe((snapshot) => {
      this.render(snapshot);
    });

    // Initial render
    this.render(this.state.getState());
  }

  /**
   * Main render loop
   */
  render(snapshot) {
    const { filteredExpenses, expenses, categories, settings, totalAllAmount, totalFilteredAmount, hasActiveFilters, sort } = snapshot;

    this.renderCategoryOptions(categories);
    this.renderExpenseTable(filteredExpenses, settings.currencySymbol, hasActiveFilters, expenses.length === 0);
    this.renderTotals(totalAllAmount, totalFilteredAmount, settings.currencySymbol, expenses.length, filteredExpenses.length);
    this.renderMonthlySummary(expenses, settings.currencySymbol);
    this.renderSortHeaders(sort);
    this.renderCharts(expenses, settings.currencySymbol);
    this.renderActiveFilterPills(snapshot.filters);
  }

  /**
   * Render category dropdown options for add & edit forms, and filter dropdown
   */
  renderCategoryOptions(categories) {
    const addCatSelect = document.getElementById('category');
    const editCatSelect = document.getElementById('edit-category');
    const filterCatSelect = document.getElementById('filter-category');

    if (addCatSelect) {
      const currentVal = addCatSelect.value;
      addCatSelect.innerHTML = categories
        .map((c) => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`)
        .join('');
      if (currentVal && categories.includes(currentVal)) {
        addCatSelect.value = currentVal;
      }
    }

    if (editCatSelect) {
      const currentVal = editCatSelect.value;
      editCatSelect.innerHTML = categories
        .map((c) => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`)
        .join('');
      if (currentVal && categories.includes(currentVal)) {
        editCatSelect.value = currentVal;
      }
    }

    if (filterCatSelect) {
      const currentFilter = this.state.getState().filters.category;
      filterCatSelect.innerHTML = [
        '<option value="all">All Categories</option>',
        ...categories.map((c) => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`),
      ].join('');
      filterCatSelect.value = currentFilter || 'all';
    }
  }

  /**
   * Render the expenses list or empty state
   */
  renderExpenseTable(expenses, currencySymbol, hasActiveFilters, isCompletelyEmpty) {
    const tbody = document.getElementById('tbody');
    const emptyStateContainer = document.getElementById('empty-state');
    const tableElement = document.getElementById('expense-table');

    if (!tbody) return;

    if (expenses.length === 0) {
      if (tableElement) tableElement.style.display = 'none';
      if (emptyStateContainer) {
        emptyStateContainer.style.display = 'flex';
        if (isCompletelyEmpty) {
          emptyStateContainer.innerHTML = `
            <div class="empty-state__icon">✨</div>
            <h3>No expenses logged yet</h3>
            <p>Add your first expense on the right to start tracking your spending.</p>
          `;
        } else {
          emptyStateContainer.innerHTML = `
            <div class="empty-state__icon">🔍</div>
            <h3>No matching expenses found</h3>
            <p>Try adjusting your search query or clearing active filters.</p>
            <button class="btn btn--outline btn--sm" id="btn-reset-empty-filters">Clear all filters</button>
          `;
          const resetBtn = document.getElementById('btn-reset-empty-filters');
          if (resetBtn) {
            resetBtn.onclick = () => this.state.resetFilters();
          }
        }
      }
      return;
    }

    if (emptyStateContainer) emptyStateContainer.style.display = 'none';
    if (tableElement) tableElement.style.display = 'table';

    tbody.innerHTML = expenses
      .map((exp) => {
        const hasNote = Boolean(exp.note && exp.note.trim());
        return `
          <tr data-id="${exp.id}">
            <td class="col-amount">
              <span class="amount-value">${formatCurrency(exp.amount, currencySymbol)}</span>
            </td>
            <td class="col-category">
              <span class="category-badge">${escapeHTML(exp.category)}</span>
            </td>
            <td class="col-date">
              <span class="date-value">${formatDate(exp.date)}</span>
            </td>
            <td class="col-note">
              ${
                hasNote
                  ? `<span class="note-text" title="${escapeHTML(exp.note)}">${escapeHTML(truncate(exp.note, 32))}</span>`
                  : `<span class="note-empty">—</span>`
              }
            </td>
            <td class="col-actions">
              <div class="table-actions">
                <button class="action-btn action-btn--edit" data-action="edit" data-id="${exp.id}" aria-label="Edit expense">
                  ${ICONS.edit}
                </button>
                <button class="action-btn action-btn--delete" data-action="delete" data-id="${exp.id}" aria-label="Delete expense">
                  ${ICONS.delete}
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    // Attach row action event delegation
    tbody.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (action === 'edit') this.openEditModal(id);
        if (action === 'delete') this.openDeleteModal(id);
      };
    });
  }

  /**
   * Render total summary numbers
   */
  renderTotals(totalAll, totalFiltered, currencySymbol, totalCount, filteredCount) {
    const totalDisplay = document.getElementById('total-amount-display');
    const filteredSubtitle = document.getElementById('total-amount-subtitle');

    if (totalDisplay) {
      totalDisplay.textContent = formatCurrency(totalFiltered, currencySymbol);
    }

    if (filteredSubtitle) {
      if (filteredCount < totalCount) {
        filteredSubtitle.textContent = `Showing ${filteredCount} of ${totalCount} expenses (Total: ${formatCurrency(totalAll, currencySymbol)})`;
      } else {
        filteredSubtitle.textContent = `${totalCount} ${totalCount === 1 ? 'expense' : 'expenses'} recorded`;
      }
    }
  }

  /**
   * Render monthly statistics widget
   */
  renderMonthlySummary(expenses, currencySymbol) {
    const stats = computeMonthlyStats(expenses);
    const monthNameEl = document.getElementById('stat-month-name');
    const currentMonthEl = document.getElementById('stat-current-month');
    const changeBadgeEl = document.getElementById('stat-change-badge');
    const topCatEl = document.getElementById('stat-top-cat');

    if (monthNameEl) monthNameEl.textContent = `${stats.currentMonthName} Summary`;
    if (currentMonthEl) currentMonthEl.textContent = formatCurrency(stats.currentMonthTotal, currencySymbol);
    if (topCatEl) topCatEl.textContent = stats.topCategory;

    if (changeBadgeEl) {
      if (stats.percentChange === null) {
        changeBadgeEl.textContent = 'No prior data';
        changeBadgeEl.className = 'stat-badge stat-badge--neutral';
      } else if (stats.percentChange > 0) {
        changeBadgeEl.textContent = `+${stats.percentChange}% vs last month`;
        changeBadgeEl.className = 'stat-badge stat-badge--up';
      } else if (stats.percentChange < 0) {
        changeBadgeEl.textContent = `${stats.percentChange}% vs last month`;
        changeBadgeEl.className = 'stat-badge stat-badge--down';
      } else {
        changeBadgeEl.textContent = `0% vs last month`;
        changeBadgeEl.className = 'stat-badge stat-badge--neutral';
      }
    }
  }

  /**
   * Update sort header indicators
   */
  renderSortHeaders(sort) {
    const thElements = document.querySelectorAll('th[data-sort]');
    thElements.forEach((th) => {
      const field = th.getAttribute('data-sort');
      const iconSpan = th.querySelector('.sort-icon');
      if (!iconSpan) return;

      if (sort.field === field) {
        th.classList.add('is-sorted');
        iconSpan.innerHTML = sort.order === 'asc' ? ICONS.sortAsc : ICONS.sortDesc;
      } else {
        th.classList.remove('is-sorted');
        iconSpan.innerHTML = ICONS.sortNone;
      }
    });
  }

  /**
   * Render charts
   */
  renderCharts(expenses, currencySymbol) {
    const categoryCanvas = document.getElementById('chart-category');
    const trendCanvas = document.getElementById('chart-trend');

    if (categoryCanvas) {
      renderCategoryChart(categoryCanvas, expenses, currencySymbol);
    }
    if (trendCanvas) {
      renderTrendChart(trendCanvas, expenses, currencySymbol);
    }
  }

  /**
   * Render active filter badges
   */
  renderActiveFilterPills(filters) {
    const container = document.getElementById('active-filters-container');
    if (!container) return;

    const pills = [];
    if (filters.search) {
      pills.push({ label: `"${filters.search}"`, key: 'search', resetVal: '' });
    }
    if (filters.category && filters.category !== 'all') {
      pills.push({ label: `Category: ${filters.category}`, key: 'category', resetVal: 'all' });
    }
    if (filters.startDate || filters.endDate) {
      const dateRange = `${filters.startDate || 'Any'} → ${filters.endDate || 'Any'}`;
      pills.push({ label: `Date: ${dateRange}`, key: 'dateRange' });
    }
    if (filters.minAmount !== null || filters.maxAmount !== null) {
      const amtRange = `${filters.minAmount ?? '0'} - ${filters.maxAmount ?? '∞'}`;
      pills.push({ label: `Amount: ${amtRange}`, key: 'amountRange' });
    }

    if (pills.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = `
      <div class="filter-pills-list">
        ${pills
          .map(
            (p, idx) => `
          <span class="filter-pill" data-pill-idx="${idx}">
            ${escapeHTML(p.label)}
            <button type="button" class="filter-pill__remove" data-key="${p.key}" aria-label="Remove filter">${ICONS.close}</button>
          </span>
        `
          )
          .join('')}
        <button type="button" class="btn-clear-filters" id="btn-clear-all-pills">Clear all</button>
      </div>
    `;

    container.querySelectorAll('.filter-pill__remove').forEach((btn) => {
      btn.onclick = () => {
        const key = btn.getAttribute('data-key');
        if (key === 'search') {
          const searchInput = document.getElementById('search-input');
          if (searchInput) searchInput.value = '';
          this.state.setFilters({ search: '' });
        } else if (key === 'category') {
          this.state.setFilters({ category: 'all' });
        } else if (key === 'dateRange') {
          const s = document.getElementById('filter-start-date');
          const e = document.getElementById('filter-end-date');
          if (s) s.value = '';
          if (e) e.value = '';
          this.state.setFilters({ startDate: '', endDate: '' });
        } else if (key === 'amountRange') {
          const min = document.getElementById('filter-min-amount');
          const max = document.getElementById('filter-max-amount');
          if (min) min.value = '';
          if (max) max.value = '';
          this.state.setFilters({ minAmount: null, maxAmount: null });
        }
      };
    });

    const clearAll = document.getElementById('btn-clear-all-pills');
    if (clearAll) {
      clearAll.onclick = () => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        this.state.resetFilters();
      };
    }
  }

  /**
   * Bind Add Expense Form
   */
  bindAddForm() {
    const form = document.getElementById('add-expense-form');
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');
    const dateInput = document.getElementById('date');
    const noteInput = document.getElementById('note');

    // Set default date to today
    if (dateInput && !dateInput.value) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }

    if (!form) return;

    form.onsubmit = (e) => {
      e.preventDefault();

      const validation = validateExpense({
        amount: amountInput ? amountInput.value : '',
        category: categorySelect ? categorySelect.value : '',
        date: dateInput ? dateInput.value : '',
        note: noteInput ? noteInput.value : '',
      });

      this.clearFormErrors(form);

      if (!validation.isValid) {
        this.displayFormErrors(form, validation.errors);
        return;
      }

      const added = this.state.addExpense(validation.values);
      toast.show({
        message: `Added ₹${added.amount} (${added.category})`,
        type: 'success',
      });

      // Reset fields
      if (amountInput) amountInput.value = '';
      if (noteInput) noteInput.value = '';
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      if (amountInput) amountInput.focus();
    };
  }

  /**
   * Bind Search and Filter controls
   */
  bindSearchAndFilters() {
    const searchInput = document.getElementById('search-input');
    const filterCat = document.getElementById('filter-category');
    const filterStartDate = document.getElementById('filter-start-date');
    const filterEndDate = document.getElementById('filter-end-date');
    const toggleFilterBtn = document.getElementById('btn-toggle-filters');
    const filtersPanel = document.getElementById('advanced-filters-panel');

    if (searchInput) {
      let timeout;
      searchInput.oninput = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.state.setFilters({ search: searchInput.value });
        }, 200);
      };
    }

    if (filterCat) {
      filterCat.onchange = () => {
        this.state.setFilters({ category: filterCat.value });
      };
    }

    if (filterStartDate) {
      filterStartDate.onchange = () => {
        this.state.setFilters({ startDate: filterStartDate.value });
      };
    }

    if (filterEndDate) {
      filterEndDate.onchange = () => {
        this.state.setFilters({ endDate: filterEndDate.value });
      };
    }

    if (toggleFilterBtn && filtersPanel) {
      toggleFilterBtn.onclick = () => {
        const isHidden = filtersPanel.classList.toggle('is-collapsed');
        toggleFilterBtn.classList.toggle('is-active', !isHidden);
      };
    }
  }

  /**
   * Bind Table Header Sorting
   */
  bindTableSorting() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach((th) => {
      th.onclick = () => {
        const field = th.getAttribute('data-sort');
        if (field) this.state.setSort(field);
      };
    });
  }

  /**
   * Edit Modal Logic
   */
  bindEditModal() {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-expense-form');
    const closeBtn = document.getElementById('btn-close-edit-modal');
    const cancelBtn = document.getElementById('btn-cancel-edit');

    if (!modal || !form) return;

    const closeModal = () => {
      modal.classList.remove('modal--open');
      this.currentEditId = null;
      this.clearFormErrors(form);
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    form.onsubmit = (e) => {
      e.preventDefault();
      if (!this.currentEditId) return;

      const amountVal = document.getElementById('edit-amount')?.value;
      const catVal = document.getElementById('edit-category')?.value;
      const dateVal = document.getElementById('edit-date')?.value;
      const noteVal = document.getElementById('edit-note')?.value;

      const validation = validateExpense({
        amount: amountVal,
        category: catVal,
        date: dateVal,
        note: noteVal,
      });

      this.clearFormErrors(form);

      if (!validation.isValid) {
        this.displayFormErrors(form, validation.errors);
        return;
      }

      this.state.updateExpense(this.currentEditId, validation.values);
      toast.show({ message: 'Expense updated successfully', type: 'success' });
      closeModal();
    };
  }

  openEditModal(id) {
    const exp = this.state.getState().expenses.find((e) => e.id === id);
    if (!exp) return;

    this.currentEditId = id;
    const modal = document.getElementById('edit-modal');
    const amountInput = document.getElementById('edit-amount');
    const categorySelect = document.getElementById('edit-category');
    const dateInput = document.getElementById('edit-date');
    const noteInput = document.getElementById('edit-note');

    if (amountInput) amountInput.value = exp.amount;
    if (categorySelect) categorySelect.value = exp.category;
    if (dateInput) dateInput.value = exp.date;
    if (noteInput) noteInput.value = exp.note || '';

    if (modal) modal.classList.add('modal--open');
  }

  /**
   * Delete Confirmation Modal Logic with Undo Toast
   */
  bindDeleteModal() {
    const modal = document.getElementById('delete-modal');
    const confirmBtn = document.getElementById('btn-confirm-delete');
    const cancelBtn = document.getElementById('btn-cancel-delete');
    const closeBtn = document.getElementById('btn-close-delete-modal');

    if (!modal) return;

    const closeModal = () => {
      modal.classList.remove('modal--open');
      this.currentDeleteId = null;
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    if (confirmBtn) {
      confirmBtn.onclick = () => {
        if (!this.currentDeleteId) return;
        const deleted = this.state.deleteExpense(this.currentDeleteId);
        closeModal();

        if (deleted) {
          toast.show({
            message: `Deleted "${deleted.category}" (${deleted.amount})`,
            type: 'info',
            duration: 6000,
            actionLabel: 'Undo',
            onAction: () => {
              this.state.undoDelete();
              toast.show({ message: 'Expense restored!', type: 'success' });
            },
          });
        }
      };
    }
  }

  openDeleteModal(id) {
    const exp = this.state.getState().expenses.find((e) => e.id === id);
    if (!exp) return;

    this.currentDeleteId = id;
    const modal = document.getElementById('delete-modal');
    const details = document.getElementById('delete-item-preview');
    if (details) {
      details.textContent = `${exp.category} — ${formatCurrency(exp.amount, this.state.getState().settings.currencySymbol)} on ${formatDate(exp.date)}`;
    }
    if (modal) modal.classList.add('modal--open');
  }

  /**
   * Settings Panel & Data Tab
   */
  bindSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('btn-open-settings');
    const closeBtn = document.getElementById('btn-close-settings-modal');

    // Currency selector
    const currencySelect = document.getElementById('setting-currency');
    // Theme selector
    const themeSelect = document.getElementById('setting-theme');

    // Export Buttons
    const exportJsonBtn = document.getElementById('btn-export-json');
    const exportCsvBtn = document.getElementById('btn-export-csv');

    // Clear all data button
    const clearAllBtn = document.getElementById('btn-clear-all-data');

    // Custom Category Add
    const addCatForm = document.getElementById('form-add-custom-cat');
    const addCatInput = document.getElementById('custom-cat-input');

    if (!modal) return;

    const closeModal = () => modal.classList.remove('modal--open');

    if (openBtn) {
      openBtn.onclick = () => {
        const settings = this.state.getState().settings;
        if (currencySelect) currencySelect.value = settings.currencySymbol;
        if (themeSelect) themeSelect.value = settings.theme;
        this.renderCustomCategoryList();
        modal.classList.add('modal--open');
      };
    }

    if (closeBtn) closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    if (currencySelect) {
      currencySelect.onchange = () => {
        this.state.updateSettings({ currencySymbol: currencySelect.value });
        toast.show({ message: `Currency set to ${currencySelect.value}`, type: 'success' });
      };
    }

    if (themeSelect) {
      themeSelect.onchange = () => {
        const theme = themeSelect.value;
        this.applyTheme(theme);
        this.state.updateSettings({ theme });
      };
    }

    if (exportJsonBtn) {
      exportJsonBtn.onclick = () => {
        try {
          exportToJSON(this.state.data);
          toast.show({ message: 'JSON backup downloaded', type: 'success' });
        } catch (err) {
          toast.show({ message: `Export failed: ${err.message}`, type: 'error' });
        }
      };
    }

    if (exportCsvBtn) {
      exportCsvBtn.onclick = () => {
        try {
          exportToCSV(this.state.getState().expenses, this.state.getState().settings.currencySymbol);
          toast.show({ message: 'CSV downloaded', type: 'success' });
        } catch (err) {
          toast.show({ message: `Export failed: ${err.message}`, type: 'error' });
        }
      };
    }

    if (clearAllBtn) {
      clearAllBtn.onclick = () => {
        if (confirm('Are you absolutely sure you want to clear ALL expenses? A backup will be created in your browser.')) {
          this.state.clearAllExpenses();
          toast.show({ message: 'All expenses cleared', type: 'info' });
          closeModal();
        }
      };
    }

    if (addCatForm && addCatInput) {
      addCatForm.onsubmit = (e) => {
        e.preventDefault();
        const val = addCatInput.value;
        const validation = validateCategoryName(val, this.state.getState().categories);
        if (!validation.isValid) {
          toast.show({ message: validation.error, type: 'error' });
          return;
        }
        this.state.addCategory(val);
        addCatInput.value = '';
        this.renderCustomCategoryList();
        toast.show({ message: `Added category "${val.trim()}"`, type: 'success' });
      };
    }
  }

  renderCustomCategoryList() {
    const listEl = document.getElementById('custom-categories-list');
    if (!listEl) return;

    const cats = this.state.getState().categories;
    listEl.innerHTML = cats
      .map(
        (c) => `
      <div class="category-chip">
        <span>${escapeHTML(c)}</span>
        <button class="category-chip__remove" data-cat="${escapeHTML(c)}" title="Remove category">${ICONS.close}</button>
      </div>
    `
      )
      .join('');

    listEl.querySelectorAll('.category-chip__remove').forEach((btn) => {
      btn.onclick = () => {
        const cat = btn.getAttribute('data-cat');
        if (cat) {
          this.state.removeCategory(cat);
          this.renderCustomCategoryList();
          toast.show({ message: `Removed category "${cat}"`, type: 'info' });
        }
      };
    });
  }

  /**
   * Import Modal with Preview and Merge/Replace options
   */
  bindImportModal() {
    const modal = document.getElementById('import-modal');
    const openBtn = document.getElementById('btn-open-import');
    const closeBtn = document.getElementById('btn-close-import-modal');
    const fileInput = document.getElementById('import-file-input');
    const dropzone = document.getElementById('import-dropzone');
    const previewContainer = document.getElementById('import-preview');
    const btnMerge = document.getElementById('btn-import-merge');
    const btnReplace = document.getElementById('btn-import-replace');

    if (!modal) return;

    const closeModal = () => {
      modal.classList.remove('modal--open');
      this.stagedImportData = null;
      if (fileInput) fileInput.value = '';
      if (previewContainer) previewContainer.style.display = 'none';
    };

    if (openBtn) openBtn.onclick = () => modal.classList.add('modal--open');
    if (closeBtn) closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    const handleFile = (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const result = previewImportJSON(content);
        if (!result.valid) {
          toast.show({ message: result.error, type: 'error' });
          return;
        }

        this.stagedImportData = result.preview.parsedData;

        if (previewContainer) {
          previewContainer.style.display = 'block';
          previewContainer.innerHTML = `
            <div class="import-stats">
              <div class="import-stat-item">
                <strong>${result.preview.count}</strong>
                <span>Expenses Found</span>
              </div>
              <div class="import-stat-item">
                <strong>${formatCurrency(result.preview.totalAmount, this.state.getState().settings.currencySymbol)}</strong>
                <span>Total Amount</span>
              </div>
              <div class="import-stat-item">
                <strong>${result.preview.dateRange}</strong>
                <span>Date Range</span>
              </div>
            </div>
            <p class="import-prompt">Choose how you'd like to import this data:</p>
          `;
        }
      };
      reader.readAsText(file);
    };

    if (fileInput) {
      fileInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFile(e.target.files[0]);
        }
      };
    }

    if (dropzone) {
      dropzone.onclick = () => fileInput?.click();
      dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.classList.add('dropzone--dragover');
      };
      dropzone.ondragleave = () => dropzone.classList.remove('dropzone--dragover');
      dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.classList.remove('dropzone--dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files[0]);
        }
      };
    }

    if (btnMerge) {
      btnMerge.onclick = () => {
        if (!this.stagedImportData) {
          toast.show({ message: 'Please select a JSON backup file first', type: 'error' });
          return;
        }
        this.state.importData(this.stagedImportData, 'merge');
        toast.show({ message: 'Expenses merged successfully!', type: 'success' });
        closeModal();
      };
    }

    if (btnReplace) {
      btnReplace.onclick = () => {
        if (!this.stagedImportData) {
          toast.show({ message: 'Please select a JSON backup file first', type: 'error' });
          return;
        }
        if (confirm('Replacing will overwrite your current expenses (an automated backup will be saved). Continue?')) {
          this.state.importData(this.stagedImportData, 'replace');
          toast.show({ message: 'Expenses replaced successfully!', type: 'success' });
          closeModal();
        }
      };
    }
  }

  /**
   * Theme Application
   */
  applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // Force dark mode as primary for this specific UI design
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  /**
   * Keyboard shortcuts
   */
  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Escape closes open modals
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal--open').forEach((m) => m.classList.remove('modal--open'));
      }
      // Ctrl/Cmd + / focuses search
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      }
    });
  }

  displayFormErrors(formElement, errors) {
    Object.entries(errors).forEach(([field, msg]) => {
      const input = formElement.querySelector(`[name="${field}"], #${field}, #edit-${field}`);
      if (input) {
        input.classList.add('is-invalid');
        let errorEl = input.parentElement.querySelector('.form-error-msg');
        if (!errorEl) {
          errorEl = document.createElement('div');
          errorEl.className = 'form-error-msg';
          input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = msg;
      }
    });
  }

  clearFormErrors(formElement) {
    formElement.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    formElement.querySelectorAll('.form-error-msg').forEach((el) => el.remove());
  }
}
