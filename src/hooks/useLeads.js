/**
 * Custom Hooks for Data Management
 * Reusable hooks for leads, AI chat, and other data operations
 * 
 * @module hooks/useLeads
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import aiService, { analyzeLeadData, classifyIntent, AI_CONFIG } from '../services/aiEngine';

// =============================================================================
// LEADS HOOK
// =============================================================================

/**
 * Hook for managing and filtering leads data
 * @param {Array} initialLeads - Initial leads array
 * @returns {Object} Leads state and operations
 */
export const useLeads = (initialLeads = []) => {
  const [leads, setLeads] = useState(initialLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [selectedLead, setSelectedLead] = useState(null);

  // Memoized analysis
  const analysis = useMemo(() => analyzeLeadData(leads), [leads]);

  // Filtered and sorted leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter(lead => {
        // Status filter
        if (statusFilter !== 'all' && lead.status !== statusFilter) {
          return false;
        }
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            lead.name.toLowerCase().includes(query) ||
            lead.company.toLowerCase().includes(query) ||
            lead.email.toLowerCase().includes(query) ||
            lead.title?.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'score':
            return b.score - a.score;
          case 'value':
            return b.value - a.value;
          case 'date':
            return new Date(b.createdAt) - new Date(a.createdAt);
          case 'lastContact':
            return new Date(b.lastContact) - new Date(a.lastContact);
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [leads, searchQuery, statusFilter, sortBy]);

  // Lead operations
  const updateLead = useCallback((id, updates) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, ...updates } : lead
    ));
  }, []);

  const deleteLead = useCallback((id) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
    if (selectedLead?.id === id) {
      setSelectedLead(null);
    }
  }, [selectedLead]);

  const addLead = useCallback((lead) => {
    setLeads(prev => [{ ...lead, id: Date.now().toString() }, ...prev]);
  }, []);

  const getLeadById = useCallback((id) => {
    return leads.find(lead => lead.id === id);
  }, [leads]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('score');
  }, []);

  return {
    // Data
    leads,
    filteredLeads,
    analysis,
    selectedLead,
    
    // Filters
    searchQuery,
    statusFilter,
    sortBy,
    
    // Setters
    setLeads,
    setSearchQuery,
    setStatusFilter,
    setSortBy,
    setSelectedLead,
    
    // Operations
    updateLead,
    deleteLead,
    addLead,
    getLeadById,
    resetFilters,
  };
};

// =============================================================================
// AI CHAT HOOK
// =============================================================================

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Unique message ID
 * @property {'user'|'assistant'|'system'} role - Message role
 * @property {string} content - Message content
 * @property {string} timestamp - ISO timestamp
 * @property {'cloud'|'local'|'error'} [mode] - Response mode
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * Hook for managing AI chat functionality
 * @param {Object} options - Hook options
 * @param {Object} options.user - Current user
 * @param {Array} options.leads - User's leads
 * @param {string} options.welcomeMessage - Initial welcome message
 * @returns {Object} Chat state and operations
 */
export const useAIChat = ({ user, leads, welcomeMessage }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMode, setAiMode] = useState('cloud');
  const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0 });
  const [error, setError] = useState(null);
  
  const chatEndRef = useRef(null);
  const analysis = useMemo(() => analyzeLeadData(leads), [leads]);

  // Generate unique message ID
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && welcomeMessage) {
      const { counts, metrics } = analysis;
      const formattedWelcome = welcomeMessage
        .replace('{company}', user.company || 'your company')
        .replace('{totalLeads}', counts.total)
        .replace('{hotLeads}', counts.hot)
        .replace('{pipelineValue}', (metrics.totalValue / 1000000).toFixed(1))
        .replace('{avgScore}', metrics.avgScore);

      setMessages([{
        id: generateId(),
        role: 'assistant',
        content: formattedWelcome,
        timestamp: new Date().toISOString(),
        mode: 'system',
      }]);
    }
  }, [welcomeMessage, analysis, user, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = useCallback(async (content = inputMessage) => {
    const messageText = content.trim();
    if (!messageText || isLoading) return;

    // Clear input and add user message
    setInputMessage('');
    setError(null);
    
    const userMessage = {
      id: generateId(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare messages for API (exclude system messages, limit history)
      const apiMessages = messages
        .filter(m => m.role !== 'system')
        .slice(-AI_CONFIG.maxConversationHistory)
        .map(m => ({ role: m.role, content: m.content }));
      
      apiMessages.push({ role: 'user', content: messageText });

      // Get AI response
      const response = await aiService.getResponse({
        messages: apiMessages,
        analysis,
        user,
        query: messageText,
      });

      // Update mode
      setAiMode(response.mode);

      // Track token usage
      if (response.usage) {
        setTokenUsage(prev => ({
          input: prev.input + (response.usage.input_tokens || 0),
          output: prev.output + (response.usage.output_tokens || 0),
        }));
      }

      // Add assistant response
      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        mode: response.mode,
        metadata: {
          intent: response.intent,
          confidence: response.confidence,
          usage: response.usage,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message);
      
      // Fallback response on error
      const { intent } = classifyIntent(messageText);
      const fallbackContent = `I encountered an issue, but here's what I can tell you:\n\n${
        aiService.generateLocalResponse ? 
        require('../services/aiEngine').generateLocalResponse(intent.id, analysis, user, messageText) :
        'Please try again in a moment.'
      }`;

      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: fallbackContent,
        timestamp: new Date().toISOString(),
        mode: 'error',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, messages, analysis, user]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setTokenUsage({ input: 0, output: 0 });
    setError(null);
  }, []);

  // Retry last message
  const retryLast = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      // Remove last assistant message if it was an error
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.mode === 'error') {
          return prev.slice(0, -1);
        }
        return prev;
      });
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  return {
    // State
    messages,
    inputMessage,
    isLoading,
    aiMode,
    tokenUsage,
    error,
    analysis,
    
    // Refs
    chatEndRef,
    
    // Actions
    setInputMessage,
    sendMessage,
    clearChat,
    retryLast,
    
    // Config
    promptVersion: AI_CONFIG.promptVersion,
  };
};

// =============================================================================
// LOCAL STORAGE HOOK
// =============================================================================

/**
 * Hook for persisting state to localStorage
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value
 * @returns {[any, Function]} State and setter
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// =============================================================================
// DEBOUNCE HOOK
// =============================================================================

/**
 * Hook for debouncing values
 * @param {any} value - Value to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// =============================================================================
// CLICK OUTSIDE HOOK
// =============================================================================

/**
 * Hook for detecting clicks outside an element
 * @param {Function} callback - Callback when click outside detected
 * @returns {Object} Ref to attach to element
 */
export const useClickOutside = (callback) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [callback]);

  return ref;
};

// =============================================================================
// KEYBOARD SHORTCUT HOOK
// =============================================================================

/**
 * Hook for handling keyboard shortcuts
 * @param {Object} shortcuts - Map of key combinations to callbacks
 */
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = [];
      if (event.ctrlKey || event.metaKey) key.push('ctrl');
      if (event.shiftKey) key.push('shift');
      if (event.altKey) key.push('alt');
      key.push(event.key.toLowerCase());
      
      const combo = key.join('+');
      const callback = shortcuts[combo];
      
      if (callback) {
        event.preventDefault();
        callback(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  useLeads,
  useAIChat,
  useLocalStorage,
  useDebounce,
  useClickOutside,
  useKeyboardShortcuts,
};
