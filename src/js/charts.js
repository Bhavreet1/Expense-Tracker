/**
 * Charts and Analytics Module using Chart.js
 */

import { formatCurrency } from './utils.js';

let categoryChartInstance = null;
let trendChartInstance = null;

// Muted harmonious palette for minimal dark theme
const MINIMAL_DARK_COLORS = [
  '#6366f1', // Indigo
  '#38bdf8', // Sky
  '#34d399', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#14b8a6', // Teal
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#94a3b8', // Slate
];

/**
 * Helper to dynamically load Chart.js if not available globally
 */
async function getChartConstructor() {
  if (window.Chart) return window.Chart;
  try {
    const chartModule = await import('chart.js/auto');
    return chartModule.default || chartModule.Chart;
  } catch (err) {
    console.warn('Could not import chart.js/auto directly:', err);
    return window.Chart || null;
  }
}

/**
 * Compute monthly comparison statistics
 * @param {Array} expenses
 * @returns {{ currentMonthTotal: number, lastMonthTotal: number, percentChange: number | null, topCategory: string, currentMonthName: string }}
 */
export function computeMonthlyStats(expenses) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // Last month calculation
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthIndex = lastMonthDate.getMonth();

  let currentMonthTotal = 0;
  let lastMonthTotal = 0;
  const currentMonthCategories = {};

  expenses.forEach((exp) => {
    if (!exp.date) return;
    const parts = exp.date.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const amt = exp.amount || 0;

      if (year === currentYear && month === currentMonth) {
        currentMonthTotal += amt;
        currentMonthCategories[exp.category] = (currentMonthCategories[exp.category] || 0) + amt;
      } else if (year === lastMonthYear && month === lastMonthIndex) {
        lastMonthTotal += amt;
      }
    }
  });

  // Calculate top category for current month
  let topCategory = 'None';
  let maxCatAmount = 0;
  Object.entries(currentMonthCategories).forEach(([cat, amt]) => {
    if (amt > maxCatAmount) {
      maxCatAmount = amt;
      topCategory = cat;
    }
  });

  // Percentage change
  let percentChange = null;
  if (lastMonthTotal > 0) {
    percentChange = Math.round(((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
  } else if (currentMonthTotal > 0) {
    percentChange = 100;
  }

  const currentMonthName = now.toLocaleString('default', { month: 'long' });

  return {
    currentMonthTotal,
    lastMonthTotal,
    percentChange,
    topCategory: topCategory !== 'None' ? `${topCategory} (${maxCatAmount})` : 'No expenses yet',
    currentMonthName,
  };
}

/**
 * Render Category Breakdown Donut Chart
 */
export async function renderCategoryChart(canvasElement, expenses, currencySymbol = '₹') {
  if (!canvasElement) return;

  const Chart = await getChartConstructor();
  if (!Chart) return;

  // Aggregate by category
  const categoryTotals = {};
  expenses.forEach((exp) => {
    const cat = exp.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (exp.amount || 0);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
    categoryChartInstance = null;
  }

  if (labels.length === 0) {
    // Draw empty placeholder on canvas
    const ctx = canvasElement.getContext('2d');
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    return;
  }

  const textColor = '#a1a1aa';
  const borderColor = '#18181b';

  categoryChartInstance = new Chart(canvasElement, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: MINIMAL_DARK_COLORS.slice(0, labels.length),
          borderWidth: 2,
          borderColor: borderColor,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            font: { family: "'Inter', sans-serif", size: 11 },
            boxWidth: 12,
            padding: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const val = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${formatCurrency(val, currencySymbol)} (${pct}%)`;
            },
          },
        },
      },
      cutout: '62%',
    },
  });
}

/**
 * Render Spending-Over-Time Bar Chart (Last 6 Months or Current Month by Week)
 */
export async function renderTrendChart(canvasElement, expenses, currencySymbol = '₹') {
  if (!canvasElement) return;

  const Chart = await getChartConstructor();
  if (!Chart) return;

  // Group by last 6 months
  const monthsMap = {};
  const monthLabels = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short' });
    monthsMap[key] = 0;
    monthLabels.push({ key, label });
  }

  expenses.forEach((exp) => {
    if (!exp.date) return;
    const key = exp.date.substring(0, 7); // YYYY-MM
    if (monthsMap[key] !== undefined) {
      monthsMap[key] += exp.amount || 0;
    }
  });

  const labels = monthLabels.map((m) => m.label);
  const data = monthLabels.map((m) => monthsMap[m.key]);

  if (trendChartInstance) {
    trendChartInstance.destroy();
    trendChartInstance = null;
  }

  const textColor = '#a1a1aa';
  const gridColor = 'rgba(255, 255, 255, 0.06)';

  trendChartInstance = new Chart(canvasElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Spending',
          data,
          backgroundColor: '#6366f1',
          hoverBackgroundColor: '#4f46e5',
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return ` Spending: ${formatCurrency(context.parsed.y || 0, currencySymbol)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: "'Inter', sans-serif", size: 11 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: "'Inter', sans-serif", size: 10 },
            callback: (val) => `${currencySymbol}${val}`,
          },
          beginAtZero: true,
        },
      },
    },
  });
}
