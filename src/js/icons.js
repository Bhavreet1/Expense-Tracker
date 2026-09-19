/**
 * Professional Lucide / React-Icons SVG Icon Registry
 * Standardized 24x24 viewBox, stroke-width=2, stroke="currentColor", stroke-linecap="round", stroke-linejoin="round"
 */

export const createSvg = (svgContent, size = 16, className = '') => {
  const classAttr = className ? ` class="${className}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${classAttr}>${svgContent}</svg>`;
};

// Lucide SVG Path Definitions
export const ICON_PATHS = {
  utensils: `<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M18 20v-9"/><path d="M6 2v6a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2"/><path d="M6 20v-9"/>`,
  shoppingCart: `<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>`,
  car: `<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>`,
  zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  receipt: `<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v.5"/><path d="M12 6v.5"/>`,
  shoppingBag: `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
  film: `<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>`,
  heartPulse: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>`,
  graduationCap: `<path d="M21.42 10.922a1 1 0 0 0-.019-.838L12.83 2.18a2 2 0 0 0-1.66 0L2.6 10.08a1 1 0 0 0 0 1.832l8.57 7.908a2 2 0 0 0 1.66 0l8.57-7.908a1 1 0 0 0 .02-.99z"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>`,
  home: `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  plane: `<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>`,
  repeat: `<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>`,
  trendingUp: `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>`,
  gift: `<polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7" rx="1"/><path d="M12 7v15"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>`,
  sparkles: `<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>`,
  tag: `<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>`,
  wallet: `<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2"/><path d="M3 11h3c.8 0 1.6.3 2.1.9l1.1 1.1c.6.6 1.4.9 2.2.9h4.6a2 2 0 0 0 2-2V9"/><circle cx="16" cy="14" r="1"/>`,
  sliders: `<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/>`,
  checkCircle: `<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>`,
  alertCircle: `<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>`,
  infoCircle: `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`,
  alertTriangle: `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>`,
  trash: `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
  pencil: `<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>`,
  plus: `<path d="M5 12h14"/><path d="M12 5v14"/>`,
  sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`,
  moon: `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`,
  close: `<line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>`,
  search: `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
};

/**
 * Map of category names to their Lucide SVG path key
 */
export const CATEGORY_ICON_MAP = {
  Food: 'utensils',
  Groceries: 'shoppingCart',
  Transport: 'car',
  Transportation: 'car',
  Bills: 'receipt',
  Utilities: 'zap',
  Shopping: 'shoppingBag',
  Entertainment: 'film',
  Fun: 'film',
  Health: 'heartPulse',
  Healthcare: 'heartPulse',
  Medical: 'heartPulse',
  Education: 'graduationCap',
  Learning: 'graduationCap',
  Rent: 'home',
  Housing: 'home',
  Travel: 'plane',
  Subscriptions: 'repeat',
  Investment: 'trendingUp',
  Investments: 'trendingUp',
  'Gifts & Donations': 'gift',
  Gifts: 'gift',
  Donations: 'gift',
  'Personal Care': 'sparkles',
  Beauty: 'sparkles',
  Miscellaneous: 'tag',
  Other: 'tag',
};

/**
 * Returns an SVG icon string for any category name with fallback to Tag icon
 */
export function getCategoryIcon(categoryName, size = 15, className = 'cat-icon') {
  if (!categoryName) return createSvg(ICON_PATHS.tag, size, className);
  const normalized = String(categoryName).trim();
  const iconKey = CATEGORY_ICON_MAP[normalized] || 'tag';
  const path = ICON_PATHS[iconKey] || ICON_PATHS.tag;
  return createSvg(path, size, className);
}

/**
 * Common App Icons
 */
export const ICONS = {
  edit: createSvg(ICON_PATHS.pencil, 15, 'icon-edit'),
  delete: createSvg(ICON_PATHS.trash, 15, 'icon-delete'),
  close: createSvg(ICON_PATHS.close, 14, 'icon-close'),
  plus: createSvg(ICON_PATHS.plus, 16, 'icon-plus'),
  sun: createSvg(ICON_PATHS.sun, 18, 'icon-sun'),
  moon: createSvg(ICON_PATHS.moon, 18, 'icon-moon'),
  search: createSvg(ICON_PATHS.search, 16, 'icon-search'),
  sliders: createSvg(ICON_PATHS.sliders, 15, 'icon-sliders'),
  wallet: createSvg(ICON_PATHS.wallet, 20, 'icon-wallet'),
  toastSuccess: createSvg(ICON_PATHS.checkCircle, 18, 'toast-icon toast-icon--success'),
  toastError: createSvg(ICON_PATHS.alertCircle, 18, 'toast-icon toast-icon--error'),
  toastInfo: createSvg(ICON_PATHS.infoCircle, 18, 'toast-icon toast-icon--info'),
  toastWarning: createSvg(ICON_PATHS.alertTriangle, 18, 'toast-icon toast-icon--warning'),
};
