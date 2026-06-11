import {
    detectErrorType,
    ErrorType,
} from "@/src/components/errors/ErrorScreen";
import { useCallback, useState } from "react";

interface UseErrorScreenReturn {
  /** The detected error type, or null if no error */
  errorType: ErrorType | null;
  /** The raw error message */
  errorMessage: string | null;
  /** The error code (HTTP status or custom code) */
  errorCode: string | null;
  /** The HTTP status code */
  statusCode: number | null;
  /** Whether there is an active error */
  hasError: boolean;
  /** Set an error from an API/axios error object */
  setError: (error: any) => void;
  /** Clear the current error */
  clearError: () => void;
  /** Retry: clears the error and calls the provided callback */
  retry: (callback: () => void) => void;
}

/**
 * Hook for managing error screen state.
 * Automatically detects error types from axios errors.
 *
 * Usage:
 * ```tsx
 * const { hasError, errorType, errorMessage, errorCode, statusCode, setError, retry } = useErrorScreen();
 *
 * const loadData = async () => {
 *   try {
 *     await fetchSomeData();
 *   } catch (err) {
 *     setError(err);
 *   }
 * };
 *
 * if (hasError) {
 *   return (
 *     <ErrorScreen
 *       type={errorType!}
 *       errorMessage={errorMessage ?? undefined}
 *       errorCode={errorCode ?? undefined}
 *       statusCode={statusCode ?? undefined}
 *       onRetry={() => retry(loadData)}
 *     />
 *   );
 * }
 * ```
 */
export function useErrorScreen(): UseErrorScreenReturn {
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const setError = useCallback((error: any) => {
    const type = detectErrorType(error);
    setErrorType(type);
    setStatusCode(error?.response?.status ?? null);
    setErrorCode(error?.response?.status?.toString() ?? error?.code ?? null);

    // Extract message
    const data = error?.response?.data;
    const msg = data?.message ?? data?.error ?? error?.message ?? null;
    setErrorMessage(typeof msg === "string" ? msg : null);
  }, []);

  const clearError = useCallback(() => {
    setErrorType(null);
    setErrorMessage(null);
    setErrorCode(null);
    setStatusCode(null);
  }, []);

  const retry = useCallback(
    (callback: () => void) => {
      clearError();
      callback();
    },
    [clearError],
  );

  return {
    errorType,
    errorMessage,
    errorCode,
    statusCode,
    hasError: errorType !== null,
    setError,
    clearError,
    retry,
  };
}
