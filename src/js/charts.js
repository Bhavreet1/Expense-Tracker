import Chart from 'chart.js/auto';
import { formatCurrency } from './utils.js';

let categoryChartInstance = null;
let trendChartInstance = null;

// Curated luminous palette for charts
export const MODERN_CHART_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#eab308', // Yellow
];
const MINIMAL_DARK_COLORS = MODERN_CHART_COLORS;

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
export function renderCategoryChart(canvasElement, expenses, currencySymbol = '₹') {
  if (!canvasElement || !Chart) return;

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

  const isLight = document.documentElement.getAttribute('data-theme') === 'light' ||
    (document.documentElement.getAttribute('data-theme') === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
  const textColor = isLight ? '#64748b' : '#94a3b8';
  const borderColor = isLight ? '#ffffff' : '#151821';
  const tooltipBg = isLight ? 'rgba(15, 23, 42, 0.92)' : 'rgba(15, 23, 42, 0.95)';
  const tooltipBorder = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';

  categoryChartInstance = new Chart(canvasElement, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: MODERN_CHART_COLORS.slice(0, labels.length),
          borderWidth: 2,
          borderColor: borderColor,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 50,
      layout: {
        padding: { top: 4, bottom: 4, left: 4, right: 4 }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            font: { family: "'Inter', sans-serif", size: 10 },
            boxWidth: 8,
            boxHeight: 8,
            padding: 8,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 8,
          cornerRadius: 6,
          boxPadding: 4,
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
      cutout: '70%',
    },
  });
}

/**
 * Render Spending-Over-Time Bar Chart (Last 6 Months)
 */
export function renderTrendChart(canvasElement, expenses, currencySymbol = '₹') {
  if (!canvasElement || !Chart) return;

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

  const isLight = document.documentElement.getAttribute('data-theme') === 'light' ||
    (document.documentElement.getAttribute('data-theme') === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
  const textColor = isLight ? '#64748b' : '#94a3b8';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';
  const barColor = isLight ? '#4f46e5' : '#6366f1';
  const barHoverColor = isLight ? '#4338ca' : '#818cf8';
  const tooltipBg = isLight ? 'rgba(15, 23, 42, 0.92)' : 'rgba(15, 23, 42, 0.95)';
  const tooltipBorder = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';

  trendChartInstance = new Chart(canvasElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Spending',
          data,
          backgroundColor: barColor,
          hoverBackgroundColor: barHoverColor,
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false,
          maxBarThickness: 28,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 50,
      layout: {
        padding: { left: 0, right: 6, top: 4, bottom: 0 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 8,
          cornerRadius: 6,
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
          ticks: {
            color: textColor,
            font: { family: "'Inter', sans-serif", size: 10 },
            maxRotation: 0,
            autoSkip: true,
          },
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: "'Inter', sans-serif", size: 9 },
            maxTicksLimit: 5,
            callback: (val) => `${currencySymbol}${val >= 1000 ? (val / 1000) + 'k' : val}`,
          },
          beginAtZero: true,
        },
      },
    },
  });
}
