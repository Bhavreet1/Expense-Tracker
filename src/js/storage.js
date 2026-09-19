/**
 * Versioned Storage Layer for Expense Tracker
 * Local-first, defensively engineered, non-destructive migrations
 */

export const CURRENT_SCHEMA_VERSION = 2;
export const STORAGE_KEY = 'expense_tracker_data_v2';
export const LEGACY_STORAGE_KEY = 'expenses';
export const BACKUP_PREFIX = 'expense_tracker_backup_';

export const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Rent',
  'Bills',
  'Travel',
  'Subscriptions',
  'Investment',
  'Gifts & Donations',
  'Personal Care',
  'Groceries',
  'Utilities',
  'Miscellaneous',
  'Other',
];

export const DEFAULT_SETTINGS = {
  currencySymbol: '₹',
  currencyCode: 'INR',
  theme: 'dark', // 'light' | 'dark' | 'system'
  dateFormat: 'YYYY-MM-DD',
  monthlyBudget: 0, // 0 indicates no budget limit configured
};

/**
 * Creates default empty envelope
 */
export function createDefaultData() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    expenses: [],
    categories: [...DEFAULT_CATEGORIES],
    settings: { ...DEFAULT_SETTINGS },
  };
}

/**
 * Creates a raw backup snapshot in localStorage
 * Keeps at most 3 recent backups to prevent exceeding quota
 */
export function createBackup(dataToBackup, tag = 'auto') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `${BACKUP_PREFIX}${tag}_${timestamp}`;
    const serialized = typeof dataToBackup === 'string' ? dataToBackup : JSON.stringify(dataToBackup);
    localStorage.setItem(backupKey, serialized);

    // Clean up old backups (keep latest 3)
    const backupKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BACKUP_PREFIX)) {
        backupKeys.push(key);
      }
    }
    backupKeys.sort();
    while (backupKeys.length > 3) {
      const oldestKey = backupKeys.shift();
      localStorage.removeItem(oldestKey);
    }
  } catch (err) {
    console.warn('Could not create storage backup:', err);
  }
}

/**
 * Defensive localStorage reader
 */
export function loadData() {
  try {
    // 1. Check if we have current version data
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return sanitizeEnvelope(parsed);
      }
    }

    // 2. Check for legacy data (bare array under 'expenses') or old storage versions
    const migrated = checkAndMigrateLegacy();
    if (migrated) {
      saveData(migrated);
      return migrated;
    }

    // 3. Fallback to default fresh structure
    const initial = createDefaultData();
    saveData(initial);
    return initial;
  } catch (err) {
    console.error('Critical storage load error:', err);
    // Return safe default so app doesn't crash
    return createDefaultData();
  }
}

/**
 * Non-destructive legacy migration
 */
export function checkAndMigrateLegacy() {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return null;

    // Snapshot legacy data first before any transformation
    createBackup(legacyRaw, 'legacy_pre_migration');

    let legacyData;
    try {
      legacyData = JSON.parse(legacyRaw);
    } catch {
      console.warn('Corrupt legacy data found in localStorage');
      return null;
    }

    // If it's a bare array from the original app
    if (Array.isArray(legacyData)) {
      const migratedExpenses = legacyData.map((item) => ({
        id: item.id ? String(item.id) : 'exp_' + Math.random().toString(36).substr(2, 9),
        amount: parseFloat(item.amount) || 0,
        category: item.category || 'Other',
        date: item.date || new Date().toISOString().split('T')[0],
        note: item.note || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }));

      const envelope = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        expenses: migratedExpenses,
        categories: [...DEFAULT_CATEGORIES],
        settings: { ...DEFAULT_SETTINGS },
      };

      console.info(`Successfully migrated ${migratedExpenses.length} legacy expenses to Schema v${CURRENT_SCHEMA_VERSION}`);
      return envelope;
    }

    // If it's an object with older schema version
    if (legacyData && typeof legacyData === 'object') {
      return sanitizeEnvelope(legacyData);
    }

    return null;
  } catch (err) {
    console.error('Error during legacy migration:', err);
    return null;
  }
}

/**
 * Sanitizes envelope to guarantee all expected fields exist
 */
export function sanitizeEnvelope(envelope) {
  const result = createDefaultData();

  if (envelope.schemaVersion) {
    result.schemaVersion = CURRENT_SCHEMA_VERSION;
  }
  if (Array.isArray(envelope.expenses)) {
    result.expenses = envelope.expenses.map((exp) => ({
      id: exp.id ? String(exp.id) : 'exp_' + Math.random().toString(36).substr(2, 9),
      amount: typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount) || 0,
      category: exp.category || 'Other',
      date: exp.date || new Date().toISOString().split('T')[0],
      note: exp.note || '',
      createdAt: exp.createdAt || new Date().toISOString(),
      updatedAt: exp.updatedAt || new Date().toISOString(),
    }));
  }
  if (Array.isArray(envelope.categories) && envelope.categories.length > 0) {
    // Merge existing categories with defaults to ensure none are missing
    const set = new Set([...DEFAULT_CATEGORIES, ...envelope.categories]);
    result.categories = Array.from(set);
  }
  if (envelope.settings && typeof envelope.settings === 'object') {
    result.settings = {
      ...DEFAULT_SETTINGS,
      ...envelope.settings,
    };
  }

  return result;
}

/**
 * Defensive localStorage writer
 */
export function saveData(data) {
  try {
    data.updatedAt = new Date().toISOString();
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Storage write error (possible quota exceeded or private mode):', err);
    return false;
  }
}

/**
 * Listen for storage events across multiple browser tabs
 */
export function setupMultiTabSync(onStorageUpdate) {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const updatedData = JSON.parse(event.newValue);
        if (updatedData && typeof onStorageUpdate === 'function') {
          onStorageUpdate(sanitizeEnvelope(updatedData));
        }
      } catch (err) {
        console.warn('Failed to parse cross-tab storage update:', err);
      }
    }
  });
}
