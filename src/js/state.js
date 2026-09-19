/**
 * State Management with Observer Pattern
 */

import {
  loadData,
  saveData,
  createBackup,
  setupMultiTabSync,
  createDefaultData,
} from './storage.js';
import { generateId } from './utils.js';

class StateManager {
  constructor() {
    this.data = createDefaultData();
    this.filters = {
      search: '',
      category: 'all',
      startDate: '',
      endDate: '',
      minAmount: null,
      maxAmount: null,
    };
    this.sort = {
      field: 'date', // 'date' | 'amount' | 'category' | 'note'
      order: 'desc', // 'asc' | 'desc'
    };
    this.undoBuffer = null;
    this.undoTimer = null;
    this.listeners = [];
  }

  /**
   * Initialize state from storage
   */
  init() {
    this.data = loadData();
    setupMultiTabSync((updatedData) => {
      this.data = updatedData;
      this.notify();
    });
  }

  /**
   * Register a subscriber
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  notify() {
    const currentState = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(currentState);
      } catch (err) {
        console.error('Subscriber notification error:', err);
      }
    });
  }

  /**
   * Get filtered and sorted expenses
   */
  getFilteredExpenses() {
    let result = [...this.data.expenses];

    // Filter by search term (note, category, amount)
    if (this.filters.search.trim() !== '') {
      const q = this.filters.search.toLowerCase().trim();
      result = result.filter((exp) => {
        const noteMatch = (exp.note || '').toLowerCase().includes(q);
        const catMatch = (exp.category || '').toLowerCase().includes(q);
        const amtMatch = String(exp.amount).includes(q);
        const dateMatch = (exp.date || '').includes(q);
        return noteMatch || catMatch || amtMatch || dateMatch;
      });
    }

    // Filter by category
    if (this.filters.category && this.filters.category !== 'all') {
      result = result.filter((exp) => exp.category === this.filters.category);
    }

    // Filter by date range
    if (this.filters.startDate) {
      result = result.filter((exp) => exp.date >= this.filters.startDate);
    }
    if (this.filters.endDate) {
      result = result.filter((exp) => exp.date <= this.filters.endDate);
    }

    // Filter by min/max amount
    if (this.filters.minAmount !== null && !isNaN(this.filters.minAmount)) {
      result = result.filter((exp) => exp.amount >= this.filters.minAmount);
    }
    if (this.filters.maxAmount !== null && !isNaN(this.filters.maxAmount)) {
      result = result.filter((exp) => exp.amount <= this.filters.maxAmount);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (this.sort.field === 'date') {
        const dateA = a.date || '';
        const dateB = b.date || '';
        comparison = dateA.localeCompare(dateB);
        if (comparison === 0) {
          comparison = (a.createdAt || '').localeCompare(b.createdAt || '');
        }
      } else if (this.sort.field === 'amount') {
        comparison = (a.amount || 0) - (b.amount || 0);
      } else if (this.sort.field === 'category') {
        comparison = (a.category || '').localeCompare(b.category || '');
      } else if (this.sort.field === 'note') {
        comparison = (a.note || '').localeCompare(b.note || '');
      }
      return this.sort.order === 'asc' ? comparison : -comparison;
    });

    return result;
  }

  /**
   * Returns snapshot of the full state
   */
  getState() {
    const filteredExpenses = this.getFilteredExpenses();
    const totalAllAmount = this.data.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    return {
      expenses: this.data.expenses,
      filteredExpenses,
      categories: this.data.categories,
      settings: this.data.settings,
      totalAllAmount,
      totalFilteredAmount,
      filters: { ...this.filters },
      sort: { ...this.sort },
      hasActiveFilters: this.checkHasActiveFilters(),
      undoAvailable: Boolean(this.undoBuffer),
      undoExpenseName: this.undoBuffer ? `${this.undoBuffer.category} (${this.undoBuffer.amount})` : null,
    };
  }

  checkHasActiveFilters() {
    return (
      Boolean(this.filters.search) ||
      (this.filters.category && this.filters.category !== 'all') ||
      Boolean(this.filters.startDate) ||
      Boolean(this.filters.endDate) ||
      this.filters.minAmount !== null ||
      this.filters.maxAmount !== null
    );
  }

  /**
   * Add a new expense
   */
  addExpense({ amount, category, date, note = '' }) {
    const newExpense = {
      id: generateId(),
      amount: parseFloat(amount) || 0,
      category: category.trim(),
      date: date.trim(),
      note: (note || '').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.expenses.unshift(newExpense);
    saveData(this.data);
    this.notify();
    return newExpense;
  }

  /**
   * Update an existing expense
   */
  updateExpense(id, { amount, category, date, note }) {
    const idx = this.data.expenses.findIndex((exp) => exp.id === id);
    if (idx === -1) return null;

    const existing = this.data.expenses[idx];
    const updated = {
      ...existing,
      amount: amount !== undefined ? parseFloat(amount) || 0 : existing.amount,
      category: category !== undefined ? category.trim() : existing.category,
      date: date !== undefined ? date.trim() : existing.date,
      note: note !== undefined ? (note || '').trim() : existing.note,
      updatedAt: new Date().toISOString(),
    };

    this.data.expenses[idx] = updated;
    saveData(this.data);
    this.notify();
    return updated;
  }

  /**
   * Delete expense with 5-second undo buffer
   */
  deleteExpense(id) {
    const idx = this.data.expenses.findIndex((exp) => exp.id === id);
    if (idx === -1) return null;

    const [deleted] = this.data.expenses.splice(idx, 1);

    // Save into undo buffer
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoBuffer = { ...deleted, originalIndex: idx };
    this.undoTimer = setTimeout(() => {
      this.undoBuffer = null;
      this.undoTimer = null;
      this.notify();
    }, 6000);

    saveData(this.data);
    this.notify();
    return deleted;
  }

  /**
   * Undo the last deletion
   */
  undoDelete() {
    if (!this.undoBuffer) return false;

    const { originalIndex, ...expenseToRestore } = this.undoBuffer;
    if (this.undoTimer) {
      clearTimeout(this.undoTimer);
      this.undoTimer = null;
    }

    // Insert back
    const targetIdx = typeof originalIndex === 'number' && originalIndex <= this.data.expenses.length
      ? originalIndex
      : 0;
    this.data.expenses.splice(targetIdx, 0, expenseToRestore);
    this.undoBuffer = null;

    saveData(this.data);
    this.notify();
    return true;
  }

  /**
   * Set filter properties
   */
  setFilters(partial) {
    this.filters = {
      ...this.filters,
      ...partial,
    };
    this.notify();
  }

  /**
   * Reset all filters
   */
  resetFilters() {
    this.filters = {
      search: '',
      category: 'all',
      startDate: '',
      endDate: '',
      minAmount: null,
      maxAmount: null,
    };
    this.notify();
  }

  /**
   * Set sort field and order
   */
  setSort(field) {
    if (this.sort.field === field) {
      // Toggle order
      this.sort.order = this.sort.order === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort.field = field;
      this.sort.order = field === 'amount' || field === 'date' ? 'desc' : 'asc';
    }
    this.notify();
  }

  /**
   * Add custom category
   */
  addCategory(name) {
    const trimmed = name.trim();
    if (!trimmed || this.data.categories.includes(trimmed)) return false;
    this.data.categories.push(trimmed);
    saveData(this.data);
    this.notify();
    return true;
  }

  /**
   * Remove custom category
   */
  removeCategory(name) {
    this.data.categories = this.data.categories.filter((c) => c !== name);
    saveData(this.data);
    this.notify();
    return true;
  }

  /**
   * Update app settings
   */
  updateSettings(partial) {
    this.data.settings = {
      ...this.data.settings,
      ...partial,
    };
    saveData(this.data);
    this.notify();
  }

  /**
   * Set monthly budget limit
   * @param {number|string} budgetAmount
   */
  setMonthlyBudget(budgetAmount) {
    const budget = Math.max(0, parseFloat(budgetAmount) || 0);
    this.updateSettings({ monthlyBudget: budget });
  }

  /**
   * Import data (Merge or Replace)
   */
  importData(envelope, mode = 'merge') {
    createBackup(this.data, `pre_import_${mode}`);

    if (mode === 'replace') {
      this.data = {
        schemaVersion: envelope.schemaVersion || 2,
        updatedAt: new Date().toISOString(),
        expenses: envelope.expenses || [],
        categories: envelope.categories || [...this.data.categories],
        settings: { ...this.data.settings, ...(envelope.settings || {}) },
      };
    } else {
      // Merge mode: Add new expenses without duplicates (match by ID if present)
      const existingIds = new Set(this.data.expenses.map((e) => e.id));
      const incoming = envelope.expenses || [];
      const newItems = incoming.filter((e) => !existingIds.has(e.id));

      this.data.expenses = [...newItems, ...this.data.expenses];

      // Merge categories
      if (Array.isArray(envelope.categories)) {
        const catSet = new Set([...this.data.categories, ...envelope.categories]);
        this.data.categories = Array.from(catSet);
      }
    }

    saveData(this.data);
    this.notify();
  }

  /**
   * Clear all expenses
   */
  clearAllExpenses() {
    createBackup(this.data, 'pre_clear_all');
    this.data.expenses = [];
    saveData(this.data);
    this.notify();
  }
}

export const state = new StateManager();
