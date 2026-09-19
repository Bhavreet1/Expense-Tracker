/**
 * Form Validation Module for Expense Tracker
 */

/**
 * Validates an expense object before creating/updating
 * @param {Object} data
 * @param {string|number} data.amount
 * @param {string} data.category
 * @param {string} data.date
 * @param {string} [data.note]
 * @returns {{ isValid: boolean, errors: { [key: string]: string }, values: Object }}
 */
export function validateExpense({ amount, category, date, note = '' }) {
  const errors = {};
  const rawAmount = typeof amount === 'number' ? amount : parseFloat(amount);

  // Amount validation
  if (isNaN(rawAmount)) {
    errors.amount = 'Amount is required and must be a number';
  } else if (rawAmount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  } else if (rawAmount > 1000000000) {
    errors.amount = 'Amount is unrealistically large';
  }
  const parsedAmount = Math.round(rawAmount * 100) / 100;

  // Category validation
  if (!category || typeof category !== 'string' || category.trim() === '') {
    errors.category = 'Please select a valid category';
  }

  // Date validation with century boundaries
  if (!date || typeof date !== 'string' || date.trim() === '') {
    errors.date = 'Date is required';
  } else {
    const parsedDate = new Date(date);
    const year = parsedDate.getFullYear();
    if (isNaN(parsedDate.getTime()) || year < 1970 || year > 2100) {
      errors.date = 'Please enter a valid date between 1970 and 2100';
    }
  }

  // Note validation (optional, max 150 chars, strip invisible control characters)
  const sanitizedNote = (note || '').replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (sanitizedNote.length > 150) {
    errors.note = 'Note must be 150 characters or less';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: {
      amount: parsedAmount,
      category: category ? category.trim() : '',
      date: date ? date.trim() : '',
      note: sanitizedNote,
    },
  };
}

/**
 * Validates a custom category name
 * @param {string} name
 * @param {string[]} existingCategories
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateCategoryName(name, existingCategories = []) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return { isValid: false, error: 'Category name cannot be empty' };
  }
  const trimmed = name.trim();
  if (trimmed.length > 30) {
    return { isValid: false, error: 'Category name must be under 30 characters' };
  }
  const exists = existingCategories.some(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (exists) {
    return { isValid: false, error: 'Category with this name already exists' };
  }
  return { isValid: true };
}
