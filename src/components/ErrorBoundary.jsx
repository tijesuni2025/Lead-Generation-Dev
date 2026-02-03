/**
 * Error Boundary and Loading State Components
 * Graceful error handling and loading UX
 * 
 * @module components/ErrorBoundary
 */

import React, { Component } from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Could send to error reporting service here
    // errorReportingService.log({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#020409' }}>
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            >
              <AlertCircle size={40} style={{ color: '#EF4444' }} />
            </div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold text-white mb-3 font-display">
              Something went wrong
            </h2>
            <p className="text-gray-400 mb-8">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div 
                className="mb-6 p-4 rounded-lg text-left text-sm overflow-auto max-h-40"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
              >
                <p className="text-red-400 font-mono">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-red-300 text-xs whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: '#3148B9' }}
              >
                <RefreshCw size={18} />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
              >
                <Home size={18} />
                Go Home
              </button>
            </div>

            {/* Report Bug Link */}
            <button
              onClick={() => window.open('mailto:support@bluestarai.com?subject=Bug Report', '_blank')}
              className="mt-6 flex items-center gap-2 mx-auto text-sm transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <Bug size={14} />
              Report this issue
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// LOADING STATES
// =============================================================================

/**
 * Spinner Loading Component
 */
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizes[size]} rounded-full animate-spin`}
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          borderTopColor: '#3148B9',
        }}
      />
    </div>
  );
};

/**
 * Full Page Loading Component
 */
export const PageLoading = ({ message = 'Loading...' }) => (
  <div 
    className="min-h-screen flex flex-col items-center justify-center"
    style={{ backgroundColor: '#020409' }}
  >
    <LoadingSpinner size="xl" />
    <p className="mt-4 text-gray-400">{message}</p>
  </div>
);

/**
 * Skeleton Loading Component
 */
export const Skeleton = ({ 
  width = '100%', 
  height = '1rem', 
  rounded = 'md',
  className = '' 
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`animate-pulse ${roundedClasses[rounded]} ${className}`}
      style={{
        width,
        height,
        backgroundColor: 'rgba(255,255,255,0.1)',
      }}
    />
  );
};

/**
 * Card Skeleton Component
 */
export const CardSkeleton = ({ className = '' }) => (
  <div 
    className={`p-6 rounded-2xl ${className}`}
    style={{ 
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}
  >
    <Skeleton width="40%" height="1.5rem" className="mb-4" />
    <Skeleton width="100%" height="1rem" className="mb-2" />
    <Skeleton width="80%" height="1rem" className="mb-2" />
    <Skeleton width="60%" height="1rem" />
  </div>
);

/**
 * Table Row Skeleton Component
 */
export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <Skeleton 
          width={i === 0 ? '120px' : '80px'} 
          height="1rem" 
        />
      </td>
    ))}
  </tr>
);

/**
 * List Item Skeleton Component
 */
export const ListItemSkeleton = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3">
        <Skeleton width="40px" height="40px" rounded="full" />
        <div className="flex-1">
          <Skeleton width="60%" height="1rem" className="mb-2" />
          <Skeleton width="40%" height="0.75rem" />
        </div>
        <Skeleton width="60px" height="1.5rem" rounded="lg" />
      </div>
    ))}
  </div>
);

/**
 * Stats Card Skeleton Component
 */
export const StatsCardSkeleton = () => (
  <div 
    className="p-6 rounded-2xl"
    style={{ 
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}
  >
    <div className="flex items-center justify-between mb-4">
      <Skeleton width="100px" height="0.875rem" />
      <Skeleton width="40px" height="40px" rounded="xl" />
    </div>
    <Skeleton width="80px" height="2rem" className="mb-2" />
    <Skeleton width="60px" height="0.75rem" />
  </div>
);

/**
 * Chat Message Skeleton Component
 */
export const ChatMessageSkeleton = ({ isUser = false }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
    <div 
      className="max-w-[80%] p-4 rounded-2xl"
      style={{ 
        backgroundColor: isUser ? 'rgba(49, 72, 185, 0.3)' : 'rgba(255,255,255,0.05)' 
      }}
    >
      <Skeleton width="200px" height="1rem" className="mb-2" />
      <Skeleton width="150px" height="1rem" className="mb-2" />
      <Skeleton width="100px" height="1rem" />
    </div>
  </div>
);

// =============================================================================
// EMPTY STATES
// =============================================================================

/**
 * Empty State Component
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    {Icon && (
      <div 
        className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: 'rgba(49, 72, 185, 0.1)' }}
      >
        <Icon size={32} style={{ color: '#3148B9' }} />
      </div>
    )}
    <h3 className="text-lg font-semibold text-white mb-2 font-display">
      {title}
    </h3>
    <p className="text-gray-400 mb-6 max-w-sm">
      {description}
    </p>
    {action && (
      <button
        onClick={action}
        className="px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 hover:scale-105"
        style={{ backgroundColor: '#3148B9' }}
      >
        {actionLabel || 'Get Started'}
      </button>
    )}
  </div>
);

/**
 * No Results Component
 */
export const NoResults = ({ 
  searchQuery,
  onClear,
  className = '' 
}) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <div 
      className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center"
      style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}
    >
      <AlertCircle size={32} style={{ color: '#EAB308' }} />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2 font-display">
      No results found
    </h3>
    <p className="text-gray-400 mb-6">
      {searchQuery 
        ? `No matches for "${searchQuery}"`
        : 'Try adjusting your filters'
      }
    </p>
    {onClear && (
      <button
        onClick={onClear}
        className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
      >
        Clear Filters
      </button>
    )}
  </div>
);

// =============================================================================
// EXPORT ALL
// =============================================================================

export default {
  ErrorBoundary,
  LoadingSpinner,
  PageLoading,
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  ListItemSkeleton,
  StatsCardSkeleton,
  ChatMessageSkeleton,
  EmptyState,
  NoResults,
};
