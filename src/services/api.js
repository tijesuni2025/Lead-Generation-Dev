/**
 * API Service Layer
 * Centralized API client with error handling, retry logic, and interceptors
 * 
 * @module services/api
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://api.anthropic.com',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Custom API Error class with additional context
 */
export class APIError extends Error {
  constructor(message, status, code, details = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Network Error for connection issues
 */
export class NetworkError extends Error {
  constructor(message = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
    this.isRetryable = true;
  }
}

/**
 * Timeout Error for request timeouts
 */
export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
    this.isRetryable = true;
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number
 * @param {number} baseDelay - Base delay in ms
 */
const getBackoffDelay = (attempt, baseDelay = API_CONFIG.retryDelay) => {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000);
};

/**
 * Check if error is retryable
 * @param {Error} error - The error to check
 */
const isRetryableError = (error) => {
  if (error.isRetryable) return true;
  if (error instanceof NetworkError || error instanceof TimeoutError) return true;
  if (error.status >= 500) return true;
  if (error.status === 429) return true; // Rate limited
  return false;
};

// =============================================================================
// REQUEST INTERCEPTORS
// =============================================================================

const requestInterceptors = [];
const responseInterceptors = [];

/**
 * Add request interceptor
 * @param {Function} interceptor - Interceptor function
 */
export const addRequestInterceptor = (interceptor) => {
  requestInterceptors.push(interceptor);
  return () => {
    const index = requestInterceptors.indexOf(interceptor);
    if (index > -1) requestInterceptors.splice(index, 1);
  };
};

/**
 * Add response interceptor
 * @param {Function} onSuccess - Success handler
 * @param {Function} onError - Error handler
 */
export const addResponseInterceptor = (onSuccess, onError) => {
  const interceptor = { onSuccess, onError };
  responseInterceptors.push(interceptor);
  return () => {
    const index = responseInterceptors.indexOf(interceptor);
    if (index > -1) responseInterceptors.splice(index, 1);
  };
};

/**
 * Apply request interceptors
 * @param {Object} config - Request configuration
 */
const applyRequestInterceptors = async (config) => {
  let currentConfig = { ...config };
  for (const interceptor of requestInterceptors) {
    currentConfig = await interceptor(currentConfig);
  }
  return currentConfig;
};

/**
 * Apply response interceptors
 * @param {Response} response - Fetch response
 * @param {Object} data - Parsed response data
 */
const applyResponseInterceptors = async (response, data) => {
  let currentData = data;
  for (const { onSuccess } of responseInterceptors) {
    if (onSuccess) {
      currentData = await onSuccess(response, currentData);
    }
  }
  return currentData;
};

/**
 * Apply error interceptors
 * @param {Error} error - The error
 */
const applyErrorInterceptors = async (error) => {
  let currentError = error;
  for (const { onError } of responseInterceptors) {
    if (onError) {
      try {
        currentError = await onError(currentError);
      } catch (e) {
        currentError = e;
      }
    }
  }
  return currentError;
};

// =============================================================================
// CORE REQUEST FUNCTION
// =============================================================================

/**
 * Make an HTTP request with retry logic and error handling
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<any>} Response data
 */
export const request = async (url, options = {}) => {
  const config = await applyRequestInterceptors({
    url,
    method: 'GET',
    headers: { ...API_CONFIG.headers },
    timeout: API_CONFIG.timeout,
    retries: API_CONFIG.maxRetries,
    ...options,
  });

  const { retries, timeout, ...fetchOptions } = config;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(config.url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        const error = new APIError(
          data?.error?.message || data?.message || `HTTP ${response.status}`,
          response.status,
          data?.error?.type || 'API_ERROR',
          data
        );
        
        if (isRetryableError(error) && attempt < retries) {
          lastError = error;
          await sleep(getBackoffDelay(attempt));
          continue;
        }
        
        throw await applyErrorInterceptors(error);
      }

      // Apply response interceptors and return
      return await applyResponseInterceptors(response, data);

    } catch (error) {
      // Handle abort/timeout
      if (error.name === 'AbortError') {
        lastError = new TimeoutError();
        if (attempt < retries) {
          await sleep(getBackoffDelay(attempt));
          continue;
        }
        throw await applyErrorInterceptors(lastError);
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = new NetworkError();
        if (attempt < retries) {
          await sleep(getBackoffDelay(attempt));
          continue;
        }
        throw await applyErrorInterceptors(lastError);
      }

      // Re-throw other errors
      if (error instanceof APIError) {
        throw error;
      }

      lastError = error;
      if (attempt < retries && isRetryableError(error)) {
        await sleep(getBackoffDelay(attempt));
        continue;
      }
      
      throw await applyErrorInterceptors(error);
    }
  }

  throw lastError;
};

// =============================================================================
// HTTP METHOD HELPERS
// =============================================================================

export const api = {
  /**
   * GET request
   * @param {string} url - Request URL
   * @param {Object} options - Additional options
   */
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),

  /**
   * POST request
   * @param {string} url - Request URL
   * @param {any} body - Request body
   * @param {Object} options - Additional options
   */
  post: (url, body, options = {}) => request(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  }),

  /**
   * PUT request
   * @param {string} url - Request URL
   * @param {any} body - Request body
   * @param {Object} options - Additional options
   */
  put: (url, body, options = {}) => request(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  }),

  /**
   * PATCH request
   * @param {string} url - Request URL
   * @param {any} body - Request body
   * @param {Object} options - Additional options
   */
  patch: (url, body, options = {}) => request(url, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body),
  }),

  /**
   * DELETE request
   * @param {string} url - Request URL
   * @param {Object} options - Additional options
   */
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
};

// =============================================================================
// ANTHROPIC AI API CLIENT
// =============================================================================

export const AI_MODELS = {
  SONNET: 'claude-sonnet-4-20250514',
  OPUS: 'claude-opus-4-20250514',
  HAIKU: 'claude-haiku-4-20250514',
};

/**
 * Anthropic API Client for AI completions
 */
export const anthropicAPI = {
  /**
   * Create a message completion
   * @param {Object} params - Message parameters
   * @param {string} params.model - Model to use
   * @param {string} params.system - System prompt
   * @param {Array} params.messages - Conversation messages
   * @param {number} params.maxTokens - Max tokens to generate
   * @returns {Promise<Object>} API response
   */
  createMessage: async ({ 
    model = AI_MODELS.SONNET, 
    system, 
    messages, 
    maxTokens = 1500 
  }) => {
    return api.post(`${API_CONFIG.baseUrl}/v1/messages`, {
      model,
      max_tokens: maxTokens,
      system,
      messages,
    });
  },

  /**
   * Stream a message completion (not implemented - placeholder)
   */
  streamMessage: async (params) => {
    throw new Error('Streaming not implemented in this version');
  },
};

// =============================================================================
// TOKEN UTILITIES
// =============================================================================

/**
 * Estimate token count from text
 * Rough approximation: ~4 characters per token
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

/**
 * Truncate text to fit within token limit
 * @param {string} text - Text to truncate
 * @param {number} maxTokens - Maximum tokens
 * @returns {string} Truncated text
 */
export const truncateToTokenLimit = (text, maxTokens) => {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) return text;
  
  const ratio = maxTokens / estimated;
  const targetLength = Math.floor(text.length * ratio * 0.95); // 5% buffer
  return text.substring(0, targetLength) + '...';
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default api;
