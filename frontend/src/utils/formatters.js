/**
 * Utility Functions
 * Formatting, calculations, and helper functions
 */

/**
 * Format number with commas (e.g., 1000 → 1,000)
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format date to readable string
 */
export function formatDate(dateString) {
  if (!dateString) return 'No due date';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Overdue (${Math.abs(diffDays)} days)`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

/**
 * Check if a quest is overdue
 */
export function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity) {
  const colors = {
    common: '#9ca3af',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
    mythic: '#ef4444'
  };
  return colors[rarity] || colors.common;
}

/**
 * Get difficulty color
 */
export function getDifficultyColor(difficulty) {
  const colors = {
    'E': '#94a3b8',
    'D': '#60a5fa',
    'C': '#34d399',
    'B': '#fbbf24',
    'A': '#f97316',
    'S': '#dc2626'
  };
  return colors[difficulty] || colors.E;
}

/**
 * Get difficulty name
 */
export function getDifficultyName(difficulty) {
  const names = {
    'E': 'Easy',
    'D': 'Normal',
    'C': 'Challenging',
    'B': 'Hard',
    'A': 'Critical',
    'S': 'Catastrophic'
  };
  return names[difficulty] || 'Unknown';
}

/**
 * Calculate time ago (e.g., "2 hours ago")
 */
export function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    
    if (interval >= 1) {
      return interval === 1 
        ? `1 ${unit} ago` 
        : `${interval} ${unit}s ago`;
    }
  }

  return 'Just now';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate random ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sort items by rarity (mythic first)
 */
export function sortByRarity(items) {
  const rarityOrder = {
    mythic: 5,
    legendary: 4,
    epic: 3,
    rare: 2,
    common: 1
  };

  return [...items].sort((a, b) => {
    const orderDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
    if (orderDiff !== 0) return orderDiff;
    
    // If same rarity, sort by obtained date (newest first)
    return new Date(b.obtainedAt) - new Date(a.obtainedAt);
  });
}

/**
 * Group items by type
 */
export function groupByType(items) {
  return items.reduce((acc, item) => {
    const type = item.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {});
}

/**
 * Calculate completion rate
 */
export function calculateCompletionRate(completed, total) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}