/**
 * UI Rendering and DOM Interaction Controller
 */

import { formatCurrency, formatDate, escapeHTML, truncate, getTodayString, getYesterdayString } from './utils.js';
import { validateExpense, validateCategoryName } from './validation.js';
import { computeMonthlyStats, renderCategoryChart, renderTrendChart, MODERN_CHART_COLORS } from './charts.js';
import { exportToJSON, exportToCSV, previewImportJSON } from './export.js';
import { ICONS, getCategoryIcon } from './icons.js';

export { ICONS, getCategoryIcon };

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

    let iconSvg = ICONS.toastInfo;
    if (type === 'success') iconSvg = ICONS.toastSuccess;
    if (type === 'error') iconSvg = ICONS.toastError;
    if (type === 'warning') iconSvg = ICONS.toastWarning;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast__icon';
    iconSpan.innerHTML = iconSvg;
    toast.appendChild(iconSpan);

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
    this.bindQuickCategoryChips();
    this.bindDatePresets();
    this.bindBudgetControls();
    this.bindSearchAndFilters();
    this.bindTableSorting();
    this.bindEditModal();
    this.bindDeleteModal();
    this.bindImportModal();
    this.bindSettingsModal();
    this.bindShortcutsModal();
    this.bindKeyboardShortcuts();
    this.bindThemeToggle();
    this.applyTheme(this.state.getState().settings.theme);

    // Subscribe to state changes to re-render UI
    this.state.subscribe((snapshot) => {
      this.render(snapshot);
    });

    // Initial render
    this.render(this.state.getState());
  }

  /**
   * Accessible Modal Helpers (Focus trap, Inert background, Focus return)
   */
  openModal(modalId, triggerElement = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal._triggerElement = triggerElement || document.activeElement;
    modal.classList.add('modal--open');

    // Invert inert on background landmarks for screen readers
    document.querySelector('.app-header')?.setAttribute('inert', '');
    document.getElementById('main-content')?.setAttribute('inert', '');

    // Trap focus & focus first interactive element
    const focusables = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    modal._keyHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeModal(modalId);
        return;
      }
      if (e.key === 'Tab') {
        const items = Array.from(
          modal.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', modal._keyHandler);
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal || !modal.classList.contains('modal--open')) return;

    modal.classList.remove('modal--open');
    document.querySelector('.app-header')?.removeAttribute('inert');
    document.getElementById('main-content')?.removeAttribute('inert');

    if (modal._keyHandler) {
      window.removeEventListener('keydown', modal._keyHandler);
      modal._keyHandler = null;
    }

    if (modal._triggerElement && typeof modal._triggerElement.focus === 'function') {
      modal._triggerElement.focus();
      modal._triggerElement = null;
    }
  }

  /**
   * Main render loop
   */
  render(snapshot) {
    const { filteredExpenses, expenses, categories, settings, totalAllAmount, totalFilteredAmount, hasActiveFilters, sort } = snapshot;

    this.renderCategoryOptions(categories);
    this.renderExpenseTable(filteredExpenses, settings.currencySymbol, hasActiveFilters, expenses.length === 0);
    this.renderExecutiveStats(snapshot);
    this.renderBudgetProgress(snapshot);
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
            <div class="empty-state__icon" aria-hidden="true">${ICONS.sparkleEmpty}</div>
            <h3>No expenses logged yet</h3>
            <p>Add your first expense on the right or tap a quick category chip to start tracking.</p>
          `;
        } else {
          emptyStateContainer.innerHTML = `
            <div class="empty-state__icon" aria-hidden="true">${ICONS.searchEmpty}</div>
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

    const categoriesList = this.state.getState().categories || [];

    tbody.innerHTML = expenses
      .map((exp) => {
        const hasNote = Boolean(exp.note && exp.note.trim());
        const catIdx = Math.max(0, categoriesList.indexOf(exp.category));
        const catColor = MODERN_CHART_COLORS[catIdx % MODERN_CHART_COLORS.length];

        return `
          <tr data-id="${exp.id}">
            <td class="col-amount">
              <span class="amount-value">${formatCurrency(exp.amount, currencySymbol)}</span>
            </td>
            <td class="col-category">
              <span class="category-badge">
                <span class="category-icon" style="color: ${catColor};">${getCategoryIcon(exp.category, 13)}</span>
                <span class="category-name">${escapeHTML(exp.category)}</span>
              </span>
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
                <button class="action-btn action-btn--edit" data-action="edit" data-id="${exp.id}" aria-label="Edit expense: ${escapeHTML(exp.category)}, ${formatCurrency(exp.amount, currencySymbol)}">
                  ${ICONS.edit}
                </button>
                <button class="action-btn action-btn--delete" data-action="delete" data-id="${exp.id}" aria-label="Delete expense: ${escapeHTML(exp.category)}, ${formatCurrency(exp.amount, currencySymbol)}">
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
        if (action === 'edit') this.openEditModal(id, btn);
        if (action === 'delete') this.openDeleteModal(id, btn);
      };
    });
  }

  /**
   * Render Top Executive Stats Cards
   */
  renderExecutiveStats(snapshot) {
    const { expenses, settings } = snapshot;
    const symbol = settings.currencySymbol || '₹';
    const totalAll = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const stats = computeMonthlyStats(expenses);
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // 1. Total Spent
    const totalCardVal = document.getElementById('card-stat-total');
    const totalCardSub = document.getElementById('card-stat-total-sub');
    if (totalCardVal) totalCardVal.textContent = formatCurrency(totalAll, symbol);
    if (totalCardSub) totalCardSub.textContent = `${expenses.length} ${expenses.length === 1 ? 'transaction' : 'transactions'}`;

    // 2. This Month
    const monthCardVal = document.getElementById('card-stat-month');
    const monthCardSub = document.getElementById('card-stat-month-sub');
    const monthCardTitle = document.getElementById('card-stat-month-title');
    if (monthCardTitle) monthCardTitle.textContent = stats.currentMonthName;
    if (monthCardVal) monthCardVal.textContent = formatCurrency(stats.currentMonthTotal, symbol);
    if (monthCardSub) {
      if (stats.percentChange === null) {
        monthCardSub.textContent = 'No prior data';
      } else {
        const sign = stats.percentChange > 0 ? '+' : '';
        monthCardSub.textContent = `${sign}${stats.percentChange}% vs last month`;
      }
    }

    // 3. Monthly Budget & Remaining
    const budgetRemainingVal = document.getElementById('card-stat-remaining');
    const budgetRemainingSub = document.getElementById('card-stat-remaining-sub');
    const budget = settings.monthlyBudget || 0;
    if (budgetRemainingVal && budgetRemainingSub) {
      if (budget > 0) {
        const remaining = budget - stats.currentMonthTotal;
        if (remaining >= 0) {
          budgetRemainingVal.textContent = formatCurrency(remaining, symbol);
          budgetRemainingSub.textContent = `of ${formatCurrency(budget, symbol)} budget`;
        } else {
          budgetRemainingVal.textContent = `-${formatCurrency(Math.abs(remaining), symbol)}`;
          budgetRemainingSub.textContent = `Over limit by ${formatCurrency(Math.abs(remaining), symbol)}`;
        }
      } else {
        budgetRemainingVal.textContent = 'Not set';
        budgetRemainingSub.textContent = 'Tap to set monthly budget';
      }
    }

    // 4. Daily Average this month
    const dailyVal = document.getElementById('card-stat-daily');
    const dailySub = document.getElementById('card-stat-daily-sub');
    if (dailyVal) {
      const avg = currentDay > 0 ? Math.round(stats.currentMonthTotal / currentDay) : 0;
      dailyVal.textContent = `${formatCurrency(avg, symbol)}/day`;
    }
    if (dailySub) {
      const avg = currentDay > 0 ? stats.currentMonthTotal / currentDay : 0;
      const projected = Math.round(avg * daysInMonth);
      dailySub.textContent = `Projected: ${formatCurrency(projected, symbol)}`;
    }
  }

  /**
   * Render Monthly Budget Progress Widget
   */
  renderBudgetProgress(snapshot) {
    const { expenses, settings } = snapshot;
    const symbol = settings.currencySymbol || '₹';
    const stats = computeMonthlyStats(expenses);
    const budget = settings.monthlyBudget || 0;
    const spent = stats.currentMonthTotal;

    const spentEl = document.getElementById('budget-spent-display');
    const targetEl = document.getElementById('budget-target-display');
    const fillEl = document.getElementById('budget-progress-fill');
    const badgeEl = document.getElementById('budget-status-badge');
    const allowanceEl = document.getElementById('budget-daily-allowance');

    if (spentEl) spentEl.textContent = formatCurrency(spent, symbol);

    if (!budget || budget <= 0) {
      if (targetEl) targetEl.textContent = '/ No limit';
      if (fillEl) {
        fillEl.style.width = '0%';
        fillEl.className = 'budget-progress-fill';
      }
      if (badgeEl) {
        badgeEl.textContent = 'No budget set';
        badgeEl.className = 'budget-badge budget-badge--neutral';
      }
      if (allowanceEl) allowanceEl.textContent = 'Click Edit to set target';
      return;
    }

    if (targetEl) targetEl.textContent = `/ ${formatCurrency(budget, symbol)}`;

    const pct = Math.round((spent / budget) * 100);
    const remaining = Math.max(0, budget - spent);

    if (fillEl) {
      fillEl.style.width = `${Math.min(100, pct)}%`;
      if (pct > 90) {
        fillEl.className = 'budget-progress-fill budget-progress-fill--danger';
      } else if (pct >= 75) {
        fillEl.className = 'budget-progress-fill budget-progress-fill--warning';
      } else {
        fillEl.className = 'budget-progress-fill';
      }
    }

    if (badgeEl) {
      if (spent > budget) {
        badgeEl.textContent = `Over budget by ${formatCurrency(spent - budget, symbol)}`;
        badgeEl.className = 'budget-badge budget-badge--danger';
      } else if (pct >= 75) {
        badgeEl.textContent = `Near Limit (${pct}%)`;
        badgeEl.className = 'budget-badge budget-badge--caution';
      } else {
        badgeEl.textContent = `On Track (${pct}%)`;
        badgeEl.className = 'budget-badge budget-badge--safe';
      }
    }

    if (allowanceEl) {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysRemaining = Math.max(1, daysInMonth - now.getDate());
      if (remaining > 0) {
        const dailyAllowance = Math.round(remaining / daysRemaining);
        allowanceEl.textContent = `${formatCurrency(dailyAllowance, symbol)}/day left (${daysRemaining}d)`;
      } else {
        allowanceEl.textContent = '0 remaining';
      }
    }
  }

  /**
   * Render total summary numbers and announce to live region
   */
  renderTotals(totalAll, totalFiltered, currencySymbol, totalCount, filteredCount) {
    const totalDisplay = document.getElementById('total-amount-display');
    const filteredSubtitle = document.getElementById('total-amount-subtitle');
    const a11yStatus = document.getElementById('a11y-status');

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

    // Dynamic Accessibility Live Region announcement
    if (a11yStatus) {
      a11yStatus.textContent =
        filteredCount === 0
          ? 'No matching expenses found.'
          : `Showing ${filteredCount} of ${totalCount} expenses. Total: ${formatCurrency(totalFiltered, currencySymbol)}.`;
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

    const filterSort = document.getElementById('filter-sort');
    if (filterSort) {
      filterSort.value = `${sort.field}-${sort.order}`;
    }
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
      dateInput.value = getTodayString();
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
      const symbol = this.state.getState().settings.currencySymbol || '₹';
      toast.show({
        message: `Added ${formatCurrency(added.amount, symbol)} (${added.category})`,
        type: 'success',
      });

      // Reset fields
      if (amountInput) amountInput.value = '';
      if (noteInput) noteInput.value = '';
      if (dateInput) dateInput.value = getTodayString();

      // Reset chip states
      document.querySelectorAll('#quick-category-pills .category-chip-btn').forEach((b) => b.classList.remove('is-active'));
      document.querySelectorAll('#date-presets .date-preset-btn').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.preset === 'today');
      });

      if (amountInput) amountInput.focus();
    };

    // Mobile FAB and Quick Jump buttons
    const jumpToAdd = () => {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (amountInput) {
        setTimeout(() => {
          amountInput.focus();
          amountInput.select();
        }, 300);
      }
    };

    const fabBtn = document.getElementById('fab-add-expense');
    if (fabBtn) fabBtn.onclick = jumpToAdd;

    const jumpBtn = document.getElementById('btn-jump-to-add');
    if (jumpBtn) jumpBtn.onclick = jumpToAdd;
  }

  /**
   * Bind Quick 1-Tap Category Selection Chips
   */
  bindQuickCategoryChips() {
    const pillsContainer = document.getElementById('quick-category-pills');
    const categorySelect = document.getElementById('category');
    const amountInput = document.getElementById('amount');
    if (!pillsContainer || !categorySelect) return;

    pillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-chip-btn');
      if (!btn) return;
      const cat = btn.dataset.category;
      if (!cat) return;

      // Update select
      categorySelect.value = cat;

      // Update active styling
      pillsContainer.querySelectorAll('.category-chip-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      // Focus and select amount input for seamless fast typing
      if (amountInput) {
        amountInput.focus();
        amountInput.select();
      }
    });

    categorySelect.addEventListener('change', () => {
      const val = categorySelect.value;
      pillsContainer.querySelectorAll('.category-chip-btn').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.category === val);
      });
    });
  }

  /**
   * Bind Date Presets (Today, Yesterday)
   */
  bindDatePresets() {
    const presetsContainer = document.getElementById('date-presets');
    const dateInput = document.getElementById('date');
    if (!presetsContainer || !dateInput) return;

    presetsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.date-preset-btn');
      if (!btn) return;
      const preset = btn.dataset.preset;

      if (preset === 'today') {
        dateInput.value = getTodayString();
      } else if (preset === 'yesterday') {
        dateInput.value = getYesterdayString();
      }

      presetsContainer.querySelectorAll('.date-preset-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });

    dateInput.addEventListener('change', () => {
      const val = dateInput.value;
      const today = getTodayString();
      const yesterday = getYesterdayString();
      presetsContainer.querySelectorAll('.date-preset-btn').forEach((b) => {
        if (b.dataset.preset === 'today') b.classList.toggle('is-active', val === today);
        if (b.dataset.preset === 'yesterday') b.classList.toggle('is-active', val === yesterday);
      });
    });
  }

  /**
   * Bind Shortcuts Modal
   */
  bindShortcutsModal() {
    const openBtn = document.getElementById('btn-open-shortcuts');
    const closeBtn = document.getElementById('btn-close-shortcuts-modal');
    const footerCloseBtn = document.getElementById('btn-close-shortcuts');
    const modal = document.getElementById('shortcuts-modal');

    if (openBtn) {
      openBtn.onclick = () => this.openModal('shortcuts-modal', openBtn);
    }
    if (closeBtn) {
      closeBtn.onclick = () => this.closeModal('shortcuts-modal');
    }
    if (footerCloseBtn) {
      footerCloseBtn.onclick = () => this.closeModal('shortcuts-modal');
    }
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) this.closeModal('shortcuts-modal');
      };
    }
  }

  /**
   * Bind Budget Controls
   */
  bindBudgetControls() {
    const editBudgetBtn = document.getElementById('btn-edit-budget');
    const budgetStatCard = document.getElementById('stat-card-budget-box');
    const totalStatCard = document.getElementById('stat-card-total-box');
    const budgetInput = document.getElementById('setting-budget');
    const searchInput = document.getElementById('search-input');

    const openBudgetEditor = (triggerEl) => {
      this.openModal('settings-modal', triggerEl || editBudgetBtn);
      if (budgetInput) {
        setTimeout(() => {
          budgetInput.focus();
          budgetInput.select();
        }, 100);
      }
    };

    if (editBudgetBtn) {
      editBudgetBtn.onclick = () => openBudgetEditor(editBudgetBtn);
    }
    if (budgetStatCard) {
      budgetStatCard.onclick = () => openBudgetEditor(budgetStatCard);
    }
    if (totalStatCard) {
      totalStatCard.onclick = () => {
        const tableCard = document.getElementById('main-content');
        if (tableCard) {
          tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (searchInput) {
          setTimeout(() => {
            searchInput.focus();
            searchInput.select();
          }, 300);
        }
      };
    }
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

    const filterSort = document.getElementById('filter-sort');
    if (filterSort) {
      filterSort.onchange = () => {
        const [field, order] = filterSort.value.split('-');
        if (field && order) {
          this.state.setSort(field, order);
        }
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
   * Bind Table Header Sorting with Keyboard Navigation
   */
  bindTableSorting() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach((th) => {
      th.setAttribute('tabindex', '0');
      th.setAttribute('role', 'columnheader');

      const doSort = () => {
        const field = th.getAttribute('data-sort');
        if (field) this.state.setSort(field);
      };

      th.onclick = doSort;
      th.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          doSort();
        }
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
      this.closeModal('edit-modal');
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

  openEditModal(id, triggerElement = null) {
    const exp = this.state.getState().expenses.find((e) => e.id === id);
    if (!exp) return;

    this.currentEditId = id;
    const amountInput = document.getElementById('edit-amount');
    const categorySelect = document.getElementById('edit-category');
    const dateInput = document.getElementById('edit-date');
    const noteInput = document.getElementById('edit-note');

    if (amountInput) amountInput.value = exp.amount;
    if (categorySelect) categorySelect.value = exp.category;
    if (dateInput) dateInput.value = exp.date;
    if (noteInput) noteInput.value = exp.note || '';

    this.openModal('edit-modal', triggerElement);
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
      this.closeModal('delete-modal');
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
            message: `Deleted "${deleted.category}" (${formatCurrency(deleted.amount, this.state.getState().settings.currencySymbol)})`,
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

  openDeleteModal(id, triggerElement = null) {
    const exp = this.state.getState().expenses.find((e) => e.id === id);
    if (!exp) return;

    this.currentDeleteId = id;
    const details = document.getElementById('delete-item-preview');
    if (details) {
      details.textContent = `${exp.category} — ${formatCurrency(exp.amount, this.state.getState().settings.currencySymbol)} on ${formatDate(exp.date)}`;
    }
    this.openModal('delete-modal', triggerElement);
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
    // Monthly budget input
    const budgetInput = document.getElementById('setting-budget');

    // Export Buttons
    const exportJsonBtn = document.getElementById('btn-export-json');
    const exportCsvBtn = document.getElementById('btn-export-csv');

    // Clear all data button
    const clearAllBtn = document.getElementById('btn-clear-all-data');

    // Custom Category Add
    const addCatForm = document.getElementById('form-add-custom-cat');
    const addCatInput = document.getElementById('custom-cat-input');

    if (!modal) return;

    const closeModal = () => this.closeModal('settings-modal');

    if (openBtn) {
      openBtn.onclick = () => {
        const settings = this.state.getState().settings;
        if (currencySelect) currencySelect.value = settings.currencySymbol;
        if (themeSelect) themeSelect.value = settings.theme;
        if (budgetInput) budgetInput.value = settings.monthlyBudget ? settings.monthlyBudget : '';
        this.renderCustomCategoryList();
        this.openModal('settings-modal', openBtn);
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

    if (budgetInput) {
      budgetInput.onchange = () => {
        const budgetVal = parseFloat(budgetInput.value) || 0;
        this.state.setMonthlyBudget(budgetVal);
        toast.show({
          message: budgetVal > 0 
            ? `Monthly budget set to ${formatCurrency(budgetVal, this.state.getState().settings.currencySymbol)}` 
            : 'Monthly budget disabled',
          type: 'success'
        });
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
        <span class="category-chip__icon" aria-hidden="true">${getCategoryIcon(c, 13)}</span>
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
      this.closeModal('import-modal');
      this.stagedImportData = null;
      if (fileInput) fileInput.value = '';
      if (previewContainer) previewContainer.style.display = 'none';
    };

    if (openBtn) openBtn.onclick = () => this.openModal('import-modal', openBtn);
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
      dropzone.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput?.click();
        }
      };
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
   * Theme Application & Dynamic Color Syncing
   */
  applyTheme(theme) {
    const validTheme = ['dark', 'light', 'system'].includes(theme) ? theme : 'dark';
    document.documentElement.setAttribute('data-theme', validTheme);

    // Calculate effective visual mode
    const isSystem = validTheme === 'system';
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveTheme = isSystem ? (systemPrefersDark ? 'dark' : 'light') : validTheme;

    // Update theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'light' ? '#f8fafc' : '#0d0f14');
    }

    // Update header toggle button icon & label
    const toggleBtn = document.getElementById('btn-theme-toggle');
    const iconSpan = document.getElementById('theme-toggle-icon');
    if (toggleBtn && iconSpan) {
      if (effectiveTheme === 'light') {
        iconSpan.innerHTML = ICONS.moon;
        toggleBtn.setAttribute('title', 'Switch to Dark Mode (T)');
        toggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
      } else {
        iconSpan.innerHTML = ICONS.sun;
        toggleBtn.setAttribute('title', 'Switch to Light Mode (T)');
        toggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
      }
    }

    // Re-render charts with matching contrast colors if already initialized
    try {
      const expenses = this.state.getFilteredExpenses ? this.state.getFilteredExpenses() : this.state.getState().expenses;
      const currency = this.state.getState().settings.currencySymbol || '₹';
      this.renderCharts(expenses, currency);
    } catch {
      // Ignored during early initialization
    }

    // Attach system theme change listener once
    if (!this.systemThemeListenerAttached && window.matchMedia) {
      this.systemThemeListenerAttached = true;
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.state.getState().settings.theme === 'system') {
          this.applyTheme('system');
        }
      });
    }
  }

  /**
   * 1-Click Theme Toggle Button Handler
   */
  bindThemeToggle() {
    const toggleBtn = document.getElementById('btn-theme-toggle');
    if (!toggleBtn) return;

    toggleBtn.onclick = () => {
      const currentTheme = this.state.getState().settings.theme || 'dark';
      let nextTheme = 'light';

      if (currentTheme === 'light') {
        nextTheme = 'dark';
      } else if (currentTheme === 'dark') {
        nextTheme = 'light';
      } else {
        const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        nextTheme = isSystemDark ? 'light' : 'dark';
      }

      this.state.updateSettings({ theme: nextTheme });
      this.applyTheme(nextTheme);

      // Sync settings modal dropdown if open/rendered
      const themeSelect = document.getElementById('setting-theme');
      if (themeSelect) themeSelect.value = nextTheme;

      toast.show({
        message: `Switched to ${nextTheme === 'light' ? 'Light' : 'Dark'} mode`,
        type: 'info',
        duration: 2500,
      });
    };
  }

  /**
   * Keyboard shortcuts
   */
  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Escape closes open modals
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal--open');
        if (openModal) {
          this.closeModal(openModal.id);
          return;
        }
      }

      // Check if user is actively interacting with an editable field
      const activeEl = document.activeElement;
      const isInput = activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName);

      // Cmd/Ctrl + K or / focuses search (even if in input for Cmd+K, but / only outside input)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === '/')) {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Cmd/Ctrl + Z triggers undo delete
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          const restored = this.state.undoDelete();
          if (restored) {
            toast.show({
              message: `Restored "${restored.category}" (${formatCurrency(restored.amount, this.state.getState().settings.currencySymbol)})`,
              type: 'success',
            });
          } else {
            toast.show({ message: 'Nothing to undo', type: 'info' });
          }
          return;
        }
      }

      // Single-letter hotkeys only when NOT focused on form input
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '/') {
          e.preventDefault();
          const searchInput = document.getElementById('search-input');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        } else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          const amountInput = document.getElementById('amount');
          if (amountInput) {
            amountInput.focus();
            amountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          const filtersPanel = document.getElementById('advanced-filters-panel');
          const toggleFilterBtn = document.getElementById('btn-toggle-filters');
          if (filtersPanel && filtersPanel.classList.contains('is-collapsed')) {
            filtersPanel.classList.remove('is-collapsed');
            if (toggleFilterBtn) {
              toggleFilterBtn.classList.add('is-active');
              toggleFilterBtn.setAttribute('aria-expanded', 'true');
            }
          }
          const filterCat = document.getElementById('filter-category');
          if (filterCat) {
            filterCat.focus();
            filterCat.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          const openBtn = document.getElementById('btn-open-settings');
          const budgetInput = document.getElementById('setting-budget');
          this.openModal('settings-modal', openBtn);
          if (budgetInput) {
            setTimeout(() => {
              budgetInput.focus();
              budgetInput.select();
            }, 120);
          }
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          const toggleBtn = document.getElementById('btn-theme-toggle');
          if (toggleBtn) toggleBtn.click();
        } else if (e.key === '?') {
          e.preventDefault();
          const shortcutsBtn = document.getElementById('btn-open-shortcuts');
          this.openModal('shortcuts-modal', shortcutsBtn);
        }
      }
    });
  }

  displayFormErrors(formElement, errors) {
    let firstInvalidInput = null;

    Object.entries(errors).forEach(([field, msg]) => {
      const input = formElement.querySelector(`[name="${field}"], #${field}, #edit-${field}`);
      if (input) {
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');

        const errorId = `error-${input.id || field}`;
        let errorEl = input.parentElement.querySelector('.form-error-msg');
        if (!errorEl) {
          errorEl = document.createElement('div');
          errorEl.className = 'form-error-msg';
          errorEl.id = errorId;
          errorEl.setAttribute('role', 'alert');
          input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = msg;
        input.setAttribute('aria-describedby', errorId);

        if (!firstInvalidInput) {
          firstInvalidInput = input;
        }

        // Real-time clearance when user modifies the invalid field
        const clearListener = () => {
          input.classList.remove('is-invalid');
          input.removeAttribute('aria-invalid');
          input.removeAttribute('aria-describedby');
          const err = input.parentElement.querySelector('.form-error-msg');
          if (err) err.remove();
          input.removeEventListener('input', clearListener);
          input.removeEventListener('change', clearListener);
        };
        input.addEventListener('input', clearListener);
        input.addEventListener('change', clearListener);
      }
    });

    if (firstInvalidInput) {
      firstInvalidInput.focus();
    }
  }

  clearFormErrors(formElement) {
    formElement.querySelectorAll('.is-invalid').forEach((el) => {
      el.classList.remove('is-invalid');
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    });
    formElement.querySelectorAll('.form-error-msg').forEach((el) => el.remove());
  }
}
