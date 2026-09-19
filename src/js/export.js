/**
 * Data Portability Module (JSON / CSV Export & JSON Import)
 */

import { CURRENT_SCHEMA_VERSION, sanitizeEnvelope, createBackup } from './storage.js';

/**
 * Generates and triggers download of a file in the browser
 * @param {string} content
 * @param {string} filename
 * @param {string} contentType
 */
function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export all data to JSON
 * @param {Object} dataEnvelope
 */
export function exportToJSON(dataEnvelope) {
  const exportPayload = {
    ...dataEnvelope,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    generator: 'Expense Tracker Pro',
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const dateTag = new Date().toISOString().split('T')[0];
  downloadFile(jsonStr, `expenses_backup_${dateTag}.json`, 'application/json');
}

/**
 * Export expenses list to CSV
 * @param {Array} expenses
 * @param {string} currencySymbol
 */
export function exportToCSV(expenses, currencySymbol = '₹') {
  if (!expenses || expenses.length === 0) {
    throw new Error('No expenses to export');
  }

  const headers = ['Date', 'Category', 'Amount', 'Currency', 'Note', 'ID', 'Created At'];
  const rows = expenses.map((exp) => [
    `"${(exp.date || '').replace(/"/g, '""')}"`,
    `"${(exp.category || '').replace(/"/g, '""')}"`,
    exp.amount || 0,
    `"${currencySymbol}"`,
    `"${(exp.note || '').replace(/"/g, '""')}"`,
    `"${exp.id || ''}"`,
    `"${exp.createdAt || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const dateTag = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `expenses_${dateTag}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Inspects and validates an imported JSON file before committing
 * Returns preview metadata
 * @param {string} jsonString
 * @returns {{ valid: boolean, preview?: { count: number, totalAmount: number, dateRange: string, categories: string[], schemaVersion: number, parsedData: Object }, error?: string }}
 */
export function previewImportJSON(jsonString) {
  try {
    const raw = JSON.parse(jsonString);
    if (!raw) {
      return { valid: false, error: 'Empty JSON file' };
    }

    let expenses = [];
    let categories = [];
    let settings = {};
    let schemaVersion = 1;

    // Case 1: Versioned envelope
    if (raw && typeof raw === 'object' && Array.isArray(raw.expenses)) {
      expenses = raw.expenses;
      categories = Array.isArray(raw.categories) ? raw.categories : [];
      settings = raw.settings || {};
      schemaVersion = raw.schemaVersion || 2;
    }
    // Case 2: Bare array of expenses
    else if (Array.isArray(raw)) {
      expenses = raw;
      schemaVersion = 1;
    } else {
      return { valid: false, error: 'Invalid expense tracker data format' };
    }

    if (expenses.length === 0) {
      return { valid: false, error: 'JSON file contains 0 expenses' };
    }

    // Sanitize and calculate summary stats
    let totalAmount = 0;
    const dates = [];
    const foundCategories = new Set();

    const sanitizedExpenses = expenses.map((exp, idx) => {
      const amt = typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount) || 0;
      totalAmount += amt;
      const cat = exp.category || 'Other';
      foundCategories.add(cat);
      if (exp.date) dates.push(exp.date);

      return {
        id: exp.id ? String(exp.id) : `exp_imp_${Date.now()}_${idx}`,
        amount: amt,
        category: cat,
        date: exp.date || new Date().toISOString().split('T')[0],
        note: exp.note || '',
        createdAt: exp.createdAt || new Date().toISOString(),
        updatedAt: exp.updatedAt || new Date().toISOString(),
      };
    });

    dates.sort();
    const dateRange = dates.length > 0
      ? `${dates[0]} to ${dates[dates.length - 1]}`
      : 'No dates specified';

    const envelope = sanitizeEnvelope({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      expenses: sanitizedExpenses,
      categories: categories.length > 0 ? categories : Array.from(foundCategories),
      settings,
    });

    return {
      valid: true,
      preview: {
        count: sanitizedExpenses.length,
        totalAmount,
        dateRange,
        categories: Array.from(foundCategories),
        schemaVersion,
        parsedData: envelope,
      },
    };
  } catch (err) {
    return { valid: false, error: `Invalid JSON syntax: ${err.message}` };
  }
}
