// Web App Health Monitor & Debug Script
// Add this script to your browser console or HTML page to monitor app health

(function() {
  'use strict';
  
  const DEBUG_CONFIG = {
    enableLogging: true,
    checkInterval: 30000, // 30 seconds
    maxErrors: 5,
    sessionCheckInterval: 60000, // 1 minute
  };
  
  let errorCount = 0;
  let lastSessionCheck = Date.now();
  let monitors = {
    auth: null,
    network: null,
    performance: null,
    memory: null
  };
  
  // Utility Functions
  const log = (type, message, data = null) => {
    if (!DEBUG_CONFIG.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    console.log(logEntry, data || '');
    
    // Store in session storage for persistence
    const logs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
    logs.push({ timestamp, type, message, data });
    
    // Keep only last 100 logs
    if (logs.length > 100) logs.shift();
    sessionStorage.setItem('debug_logs', JSON.stringify(logs));
  };
  
  // Authentication Monitor
  const monitorAuth = () => {
    try {
      // Check for authentication context
      const hasAuthToken = localStorage.getItem('sb-zummzziydfpvwuxxuyyu-auth-token') !== null;
      const hasSupabaseSession = localStorage.getItem('supabase.auth.token') !== null;
      
      if (!hasAuthToken && !hasSupabaseSession) {
        log('warning', 'No authentication tokens found in localStorage');
      }
      
      // Check for expired sessions
      const authData = localStorage.getItem('sb-zummzziydfpvwuxxuyyu-auth-token');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const expiresAt = parsed.expires_at;
          const now = Math.floor(Date.now() / 1000);
          
          if (expiresAt && expiresAt < now) {
            log('error', 'Authentication token has expired', { expiresAt, now });
          } else if (expiresAt && expiresAt - now < 300) { // Less than 5 minutes
            log('warning', 'Authentication token expires soon', { 
              expiresAt, 
              now, 
              secondsLeft: expiresAt - now 
            });
          }
        } catch (e) {
          log('error', 'Failed to parse authentication data', e.message);
        }
      }
      
    } catch (error) {
      log('error', 'Authentication monitor error', error.message);
    }
  };
  
  // Network Monitor
  const monitorNetwork = () => {
    try {
      // Check navigator online status
      if (!navigator.onLine) {
        log('error', 'Browser reports offline status');
      }
      
      // Monitor failed network requests
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('supabase.co')) {
            if (entry.transferSize === 0 && entry.duration > 5000) {
              log('error', 'Potential network timeout to Supabase', {
                url: entry.name,
                duration: entry.duration
              });
            }
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
      
    } catch (error) {
      log('error', 'Network monitor error', error.message);
    }
  };
  
  // Performance Monitor
  const monitorPerformance = () => {
    try {
      // Memory usage
      if ('memory' in performance) {
        const memory = performance.memory;
        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          allocated: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        };
        
        if (memoryUsage.used > memoryUsage.limit * 0.8) {
          log('warning', 'High memory usage detected', memoryUsage);
        }
      }
      
      // Long tasks detection
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            log('warning', 'Long task detected', {
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        }
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      
    } catch (error) {
      log('error', 'Performance monitor error', error.message);
    }
  };
  
  // React Query Monitor
  const monitorReactQuery = () => {
    try {
      // Check if React Query is stuck
      const queryClient = window.__REACT_QUERY_CLIENT__;
      if (queryClient) {
        const queryCache = queryClient.getQueryCache();
        const queries = queryCache.getAll();
        
        const stuckQueries = queries.filter(query => {
          const state = query.state;
          return state.isFetching && 
                 state.fetchFailureCount > 2 && 
                 Date.now() - state.dataUpdatedAt > 30000; // 30 seconds
        });
        
        if (stuckQueries.length > 0) {
          log('error', 'Stuck React Query detected', {
            count: stuckQueries.length,
            keys: stuckQueries.map(q => q.queryKey)
          });
        }
      }
    } catch (error) {
      log('error', 'React Query monitor error', error.message);
    }
  };
  
  // Button Functionality Monitor
  const monitorButtons = () => {
    try {
      // Find all action buttons
      const buttons = document.querySelectorAll('button[title*="Edit"], button[title*="Delete"], button[title*="View"]');
      
      buttons.forEach(button => {
        if (button.disabled && !button.hasAttribute('data-expected-disabled')) {
          log('warning', 'Action button is unexpectedly disabled', {
            title: button.title,
            className: button.className
          });
        }
      });
      
      // Check for missing click handlers
      const criticalButtons = document.querySelectorAll('button.text-red-600, button.text-green-600, button.text-blue-600');
      criticalButtons.forEach(button => {
        const hasClickHandler = button.onclick || button.getAttribute('onclick') || 
                               button.addEventListener.toString().includes('click');
        if (!hasClickHandler) {
          log('warning', 'Button missing click handler', {
            className: button.className,
            title: button.title
          });
        }
      });
      
    } catch (error) {
      log('error', 'Button monitor error', error.message);
    }
  };
  
  // Error Handler
  const handleError = (error, source) => {
    errorCount++;
    log('error', `Error from ${source}`, error);
    
    if (errorCount > DEBUG_CONFIG.maxErrors) {
      log('critical', 'Maximum error count exceeded - consider refreshing page');
    }
  };
  
  // Global Error Listeners
  window.addEventListener('error', (event) => {
    handleError({
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno
    }, 'JavaScript');
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    handleError({
      reason: event.reason,
      promise: event.promise
    }, 'Promise');
  });
  
  // Main Monitor Loop
  const runMonitors = () => {
    try {
      log('info', 'Running health checks...');
      
      monitorAuth();
      monitorNetwork();
      monitorPerformance();
      monitorReactQuery();
      monitorButtons();
      
      log('info', 'Health checks completed', { 
        errorCount, 
        timestamp: Date.now() 
      });
      
    } catch (error) {
      log('error', 'Monitor loop error', error.message);
    }
  };
  
  // Initialize Monitors
  const initMonitors = () => {
    log('info', 'Initializing debug monitors...');
    
    // Run initial check
    runMonitors();
    
    // Set up periodic checks
    monitors.main = setInterval(runMonitors, DEBUG_CONFIG.checkInterval);
    
    // Set up session-specific checks
    monitors.session = setInterval(monitorAuth, DEBUG_CONFIG.sessionCheckInterval);
    
    // Add to global scope for manual control
    window.debugMonitor = {
      start: initMonitors,
      stop: () => {
        Object.values(monitors).forEach(monitor => {
          if (monitor) clearInterval(monitor);
        });
        log('info', 'Debug monitors stopped');
      },
      runOnce: runMonitors,
      getLogs: () => JSON.parse(sessionStorage.getItem('debug_logs') || '[]'),
      clearLogs: () => sessionStorage.removeItem('debug_logs'),
      config: DEBUG_CONFIG
    };
    
    log('info', 'Debug monitors initialized');
  };
  
  // Auto-start if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMonitors);
  } else {
    initMonitors();
  }
  
})();

console.log(`
🔧 DEBUG MONITOR LOADED 🔧

Available commands:
- window.debugMonitor.start()     // Start monitoring
- window.debugMonitor.stop()      // Stop monitoring  
- window.debugMonitor.runOnce()   // Run single check
- window.debugMonitor.getLogs()   // View debug logs
- window.debugMonitor.clearLogs() // Clear debug logs

The monitor will automatically check for:
✅ Authentication token expiry
✅ Network connectivity issues
✅ Memory leaks and performance problems
✅ Stuck React Query requests
✅ Disabled buttons and missing handlers
✅ JavaScript errors and promises
`);
