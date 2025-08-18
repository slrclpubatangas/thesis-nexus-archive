import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './use-toast';

interface UseApiWithTimeoutOptions {
  timeout?: number; // Timeout in milliseconds
  retryCount?: number;
  retryDelay?: number;
  showLoadingToast?: boolean;
  showErrorToast?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  onTimeout?: () => void;
}

export function useApiWithTimeout<T = any>(
  apiCall: () => Promise<T>,
  options: UseApiWithTimeoutOptions = {}
) {
  const {
    timeout = 30000, // Default 30 seconds timeout
    retryCount = 1,
    retryDelay = 1000,
    showLoadingToast = false,
    showErrorToast = true,
    onSuccess,
    onError,
    onTimeout,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Execute API call with timeout
  const execute = useCallback(
    async (retriesLeft = retryCount) => {
      cleanup();
      setLoading(true);
      setError(null);

      if (showLoadingToast) {
        toast({
          title: "Loading...",
          description: "Fetching data, please wait...",
        });
      }

      try {
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        // Create a promise that rejects after timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutIdRef.current = setTimeout(() => {
            reject(new Error(`Request timed out after ${timeout}ms`));
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }
          }, timeout);
        });

        // Race between API call and timeout
        const result = await Promise.race([
          apiCall(),
          timeoutPromise,
        ]);

        // Clear timeout if request completes successfully
        cleanup();

        setData(result);
        setLoading(false);
        setError(null);

        if (onSuccess) {
          onSuccess();
        }

        return result;
      } catch (err: any) {
        console.error('API request error:', err);

        // Check if it's a timeout error
        const isTimeout = err.message?.includes('timed out');
        
        if (isTimeout && onTimeout) {
          onTimeout();
        }

        // Retry logic
        if (retriesLeft > 0 && !err.message?.includes('abort')) {
          console.log(`Retrying... (${retriesLeft} attempts left)`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Retry the request
          return execute(retriesLeft - 1);
        }

        // Final error handling
        setError(err);
        setLoading(false);

        if (showErrorToast) {
          toast({
            title: isTimeout ? "Request Timeout" : "Error",
            description: isTimeout 
              ? "The request took too long to complete. Please try again."
              : err.message || "An unexpected error occurred",
            variant: "destructive",
          });
        }

        if (onError) {
          onError(err);
        }

        throw err;
      } finally {
        // Always ensure loading is set to false
        setLoading(false);
      }
    },
    [apiCall, timeout, retryCount, retryDelay, showLoadingToast, showErrorToast, toast, onSuccess, onError, onTimeout, cleanup]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Reset function
  const reset = useCallback(() => {
    cleanup();
    setData(null);
    setError(null);
    setLoading(false);
  }, [cleanup]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
