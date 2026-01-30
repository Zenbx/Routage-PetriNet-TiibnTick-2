'use client';

import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import { showToast } from '@/components/ui/Toast';

export interface UseApiOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (apiCall: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiCall();
        setData(result);

        if (options.showSuccessToast && options.successMessage) {
          showToast(options.successMessage, 'success');
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);

        if (options.showErrorToast !== false) {
          let message = 'Une erreur est survenue';

          if (error instanceof ApiError) {
            message = error.message;
          } else if (error.message) {
            message = error.message;
          }

          showToast(message, 'error', 6000);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
