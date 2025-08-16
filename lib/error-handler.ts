interface ErrorData {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  init() {
    if (this.isInitialized) return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: `Unhandled Error: ${event.message}`,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    });

    this.isInitialized = true;
  }

  async logError(errorData: ErrorData) {
    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error logged:', errorData);
      }

      // Send to error logging API
      await fetch('/api/error-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (logError) {
      // Silently fail if error logging fails
      console.error('Failed to log error:', logError);
    }
  }

  // Utility method to manually log errors
  async logManualError(error: Error, context?: Record<string, any>) {
    await this.logError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Initialize error handler when this module is imported
if (typeof window !== 'undefined') {
  errorHandler.init();
}
