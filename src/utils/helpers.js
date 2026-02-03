/**
 * Utility Functions
 * Common helpers for formatting, validation, and data operations
 * 
 * @module utils/helpers
 */

// =============================================================================
// DATE FORMATTING
// =============================================================================

/**
 * Format date to locale string
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  try {
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format date with time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Get relative time string (e.g., "2 days ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  
  return formatDate(date);
};

/**
 * Get days since date
 * @param {string|Date} date - Date to compare
 * @returns {number} Number of days
 */
export const getDaysSince = (date) => {
  if (!date) return 0;
  const diffMs = Date.now() - new Date(date).getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
};

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

/**
 * Format currency value
 * @param {number} value - Value to format
 * @param {string} currency - Currency code
 * @param {boolean} compact - Use compact notation
 * @returns {string} Formatted currency
 */
export const formatCurrency = (value, currency = 'USD', compact = false) => {
  if (value == null || isNaN(value)) return '$0';
  
  const options = {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 1 : 0,
  };
  
  if (compact && Math.abs(value) >= 1000) {
    options.notation = 'compact';
  }
  
  return new Intl.NumberFormat('en-US', options).format(value);
};

/**
 * Format number with commas
 * @param {number} value - Value to format
 * @returns {string} Formatted number
 */
export const formatNumber = (value) => {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Format percentage
 * @param {number} value - Value (0-100 or 0-1)
 * @param {boolean} isDecimal - If value is decimal (0-1)
 * @returns {string} Formatted percentage
 */
export const formatPercent = (value, isDecimal = false) => {
  if (value == null || isNaN(value)) return '0%';
  const percent = isDecimal ? value * 100 : value;
  return `${Math.round(percent)}%`;
};

/**
 * Abbreviate large numbers (1K, 1M, 1B)
 * @param {number} value - Value to abbreviate
 * @returns {string} Abbreviated number
 */
export const abbreviateNumber = (value) => {
  if (value == null || isNaN(value)) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e9) return `${sign}${(absValue / 1e9).toFixed(1)}B`;
  if (absValue >= 1e6) return `${sign}${(absValue / 1e6).toFixed(1)}M`;
  if (absValue >= 1e3) return `${sign}${(absValue / 1e3).toFixed(1)}K`;
  
  return `${sign}${absValue}`;
};

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export const truncate = (str, maxLength = 50) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @param {number} count - Number of initials
 * @returns {string} Initials
 */
export const getInitials = (name, count = 2) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, count)
    .join('')
    .toUpperCase();
};

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to slug
 * @param {string} str - String to convert
 * @returns {string} URL-safe slug
 */
export const slugify = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate random ID
 * @param {number} length - ID length
 * @returns {string} Random ID
 */
export const generateId = (length = 8) => {
  return Math.random().toString(36).substring(2, 2 + length);
};

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone to validate
 * @returns {boolean} Is valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if value is empty (null, undefined, empty string, empty array/object)
 * @param {any} value - Value to check
 * @returns {boolean} Is empty
 */
export const isEmpty = (value) => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string|Function} key - Key to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  if (!Array.isArray(array)) return {};
  
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    (result[groupKey] = result[groupKey] || []).push(item);
    return result;
  }, {});
};

/**
 * Sort array by multiple keys
 * @param {Array} array - Array to sort
 * @param {Array} keys - Sort keys with optional direction
 * @returns {Array} Sorted array
 */
export const sortByMultiple = (array, keys) => {
  if (!Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    for (const { key, direction = 'asc' } of keys) {
      const aVal = a[key];
      const bVal = b[key];
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;
      
      if (comparison !== 0) {
        return direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
};

/**
 * Remove duplicates from array
 * @param {Array} array - Array with potential duplicates
 * @param {string} key - Optional key for objects
 * @returns {Array} Deduplicated array
 */
export const unique = (array, key) => {
  if (!Array.isArray(array)) return [];
  
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }
  
  return [...new Set(array)];
};

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
export const chunk = (array, size = 10) => {
  if (!Array.isArray(array)) return [];
  
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
};

/**
 * Pick specific keys from object
 * @param {Object} obj - Source object
 * @param {Array} keys - Keys to pick
 * @returns {Object} Object with picked keys
 */
export const pick = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return {};
  
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

/**
 * Omit specific keys from object
 * @param {Object} obj - Source object
 * @param {Array} keys - Keys to omit
 * @returns {Object} Object without omitted keys
 */
export const omit = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return {};
  
  const keysSet = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keysSet.has(key))
  );
};

// =============================================================================
// ASYNC UTILITIES
// =============================================================================

/**
 * Delay execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Debounce function
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Debounce wait time
 * @returns {Function} Debounced function
 */
export const debounce = (fn, wait = 300) => {
  let timeoutId;
  
  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
  
  debounced.cancel = () => clearTimeout(timeoutId);
  
  return debounced;
};

/**
 * Throttle function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Throttle limit
 * @returns {Function} Throttled function
 */
export const throttle = (fn, limit = 300) => {
  let inThrottle;
  
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// =============================================================================
// LEAD-SPECIFIC UTILITIES
// =============================================================================

/**
 * Get status color
 * @param {string} status - Lead status
 * @returns {Object} Color configuration
 */
export const getStatusColor = (status) => {
  const colors = {
    Hot: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    Warm: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
    Cold: { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' },
    New: { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' },
  };
  return colors[status] || colors.New;
};

/**
 * Get score color
 * @param {number} score - Lead score
 * @returns {string} Color hex code
 */
export const getScoreColor = (score) => {
  if (score >= 80) return '#22C55E';  // Green
  if (score >= 60) return '#EAB308';  // Yellow
  if (score >= 40) return '#F97316';  // Orange
  return '#EF4444';  // Red
};

/**
 * Calculate lead priority score
 * @param {Object} lead - Lead object
 * @returns {number} Priority score
 */
export const calculatePriority = (lead) => {
  let priority = lead.score || 0;
  
  // Boost for hot status
  if (lead.status === 'Hot') priority += 20;
  if (lead.status === 'Warm') priority += 10;
  
  // Boost for high value
  if (lead.value >= 100000) priority += 15;
  if (lead.value >= 50000) priority += 10;
  
  // Penalty for stale leads
  const daysSinceContact = getDaysSince(lead.lastContact);
  if (daysSinceContact > 14) priority -= 10;
  if (daysSinceContact > 30) priority -= 20;
  
  // Penalty for low engagement
  if (lead.interactions < 2) priority -= 5;
  
  return Math.max(0, Math.min(100, priority));
};

// =============================================================================
// EXPORT ALL
// =============================================================================

export default {
  // Date
  formatDate,
  formatDateTime,
  getRelativeTime,
  getDaysSince,
  
  // Numbers
  formatCurrency,
  formatNumber,
  formatPercent,
  abbreviateNumber,
  
  // Strings
  truncate,
  getInitials,
  capitalize,
  slugify,
  generateId,
  
  // Validation
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isEmpty,
  
  // Arrays
  groupBy,
  sortByMultiple,
  unique,
  chunk,
  
  // Objects
  deepClone,
  pick,
  omit,
  
  // Async
  delay,
  debounce,
  throttle,
  
  // Lead-specific
  getStatusColor,
  getScoreColor,
  calculatePriority,
};
