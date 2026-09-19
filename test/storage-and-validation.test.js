/**
 * Automated Test Suite for Storage, Migration, Validation, Portability, and Analytics
 */

import assert from 'node:assert';
import {
  CURRENT_SCHEMA_VERSION,
  createDefaultData,
  sanitizeEnvelope,
  DEFAULT_CATEGORIES,
} from '../src/js/storage.js';
import { validateExpense, validateCategoryName } from '../src/js/validation.js';
import { formatCurrency, formatDate, generateId, getYesterdayString } from '../src/js/utils.js';
import { previewImportJSON } from '../src/js/export.js';
import { computeMonthlyStats } from '../src/js/charts.js';

console.log('🧪 Starting Automated Tests...\n');

// 1. Validation Tests
console.log('▶ Testing Expense Validation:');
{
  const valid = validateExpense({ amount: '120.505', category: 'Food', date: '2026-09-11', note: 'Coffee\x00' });
  assert.strictEqual(valid.isValid, true);
  assert.strictEqual(valid.values.amount, 120.51); // 2-decimal rounded
  assert.strictEqual(valid.values.category, 'Food');
  assert.strictEqual(valid.values.note, 'Coffee'); // Control char removed

  const invalidYearPast = validateExpense({ amount: 50, category: 'Food', date: '1960-01-01' });
  assert.strictEqual(invalidYearPast.isValid, false);
  assert.ok(invalidYearPast.errors.date);

  const invalidYearFuture = validateExpense({ amount: 50, category: 'Food', date: '2150-01-01' });
  assert.strictEqual(invalidYearFuture.isValid, false);
  assert.ok(invalidYearFuture.errors.date);

  const zeroAmt = validateExpense({ amount: 0, category: 'Food', date: '2026-09-11' });
  assert.strictEqual(zeroAmt.isValid, false);
  assert.ok(zeroAmt.errors.amount);

  const negAmt = validateExpense({ amount: -50, category: 'Food', date: '2026-09-11' });
  assert.strictEqual(negAmt.isValid, false);

  const emptyCat = validateExpense({ amount: 50, category: '', date: '2026-09-11' });
  assert.strictEqual(emptyCat.isValid, false);
  assert.ok(emptyCat.errors.category);

  const emptyDate = validateExpense({ amount: 50, category: 'Food', date: '' });
  assert.strictEqual(emptyDate.isValid, false);
  assert.ok(emptyDate.errors.date);

  const longNote = validateExpense({
    amount: 50,
    category: 'Food',
    date: '2026-09-11',
    note: 'A'.repeat(151),
  });
  assert.strictEqual(longNote.isValid, false);
  assert.ok(longNote.errors.note);

  console.log('  ✓ Expense validation passed');
}

// 2. Category Validation
console.log('▶ Testing Custom Category Validation:');
{
  const ok = validateCategoryName('Freelance', ['Food', 'Bills']);
  assert.strictEqual(ok.isValid, true);

  const duplicate = validateCategoryName('Food', ['Food', 'Bills']);
  assert.strictEqual(duplicate.isValid, false);

  const empty = validateCategoryName('   ', ['Food']);
  assert.strictEqual(empty.isValid, false);

  console.log('  ✓ Category validation passed');
}

// 3. Schema Sanitization & Migration
console.log('▶ Testing Schema Sanitization and Legacy Transformation:');
{
  // Simulating bare array from legacy app
  const legacyItems = [
    { id: 1712345678, amount: '450', category: 'Food', date: '2026-05-10' },
    { id: 1712345679, amount: 1200, category: 'Transport', date: '2026-05-12' },
  ];

  const envelope = sanitizeEnvelope({
    expenses: legacyItems,
  });

  assert.strictEqual(envelope.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.strictEqual(envelope.expenses.length, 2);
  assert.strictEqual(envelope.expenses[0].amount, 450);
  assert.strictEqual(envelope.expenses[0].note, '');
  assert.strictEqual(envelope.expenses[1].amount, 1200);
  assert.ok(envelope.categories.includes('Food'));
  assert.ok(envelope.settings.currencySymbol);
  assert.strictEqual(envelope.settings.monthlyBudget, 0);

  const envelopeWithBudget = sanitizeEnvelope({
    settings: { monthlyBudget: 5000 },
  });
  assert.strictEqual(envelopeWithBudget.settings.monthlyBudget, 5000);

  console.log('  ✓ Non-destructive envelope sanitization passed');
}

// 4. Import / Export JSON Parsing & Validation
console.log('▶ Testing JSON Portability Preview:');
{
  const sampleExportJSON = JSON.stringify({
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
    expenses: [
      { id: 'exp_1', amount: 300, category: 'Groceries', date: '2026-08-01', note: 'Milk, Bread' },
      { id: 'exp_2', amount: 700, category: 'Utilities', date: '2026-08-15', note: 'Electricity' },
    ],
    categories: DEFAULT_CATEGORIES,
    settings: { currencySymbol: '₹' },
  });

  const preview = previewImportJSON(sampleExportJSON);
  assert.strictEqual(preview.valid, true);
  assert.strictEqual(preview.preview.count, 2);
  assert.strictEqual(preview.preview.totalAmount, 1000);
  assert.ok(preview.preview.categories.includes('Groceries'));

  // Corrupted JSON test
  const badJSON = previewImportJSON('{ invalid json ...');
  assert.strictEqual(badJSON.valid, false);

  // Empty array JSON
  const emptyJSON = previewImportJSON('[]');
  assert.strictEqual(emptyJSON.valid, false);

  console.log('  ✓ Import preview and validation passed');
}

// 5. Monthly Stats Analytics
console.log('▶ Testing Monthly Statistics Calculation:');
{
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-05`;

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 5);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-05`;

  const sampleExpenses = [
    { amount: 500, category: 'Food', date: currentMonthStr },
    { amount: 300, category: 'Food', date: currentMonthStr },
    { amount: 200, category: 'Shopping', date: currentMonthStr },
    { amount: 500, category: 'Bills', date: lastMonthStr },
  ];

  const stats = computeMonthlyStats(sampleExpenses);
  assert.strictEqual(stats.currentMonthTotal, 1000);
  assert.strictEqual(stats.lastMonthTotal, 500);
  assert.strictEqual(stats.percentChange, 100); // 100% increase from 500 to 1000
  assert.ok(stats.topCategory.includes('Food'));

  console.log('  ✓ Monthly stats calculations passed');
}

// 6. Formatting Utilities
console.log('▶ Testing Formatting Utils:');
{
  assert.strictEqual(formatCurrency(1500, '₹'), '₹1,500');
  assert.strictEqual(formatCurrency(1500.5, '$'), '$1,500.5');
  assert.ok(formatDate('2026-09-11').includes('2026'));
  assert.ok(generateId().startsWith('exp_'));
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(getYesterdayString()));

  console.log('  ✓ Formatting utils passed');
}

console.log('\n✅ All automated tests passed successfully!\n');
