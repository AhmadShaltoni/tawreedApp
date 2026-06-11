import React from "react";
import GenericErrorScreen from "./GenericErrorScreen";
import MaintenanceScreen from "./MaintenanceScreen";
import NetworkErrorScreen from "./NetworkErrorScreen";
import ServerErrorScreen from "./ServerErrorScreen";
import SessionExpiredScreen from "./SessionExpiredScreen";
import TimeoutErrorScreen from "./TimeoutErrorScreen";

export type ErrorType =
  | "network"
  | "server"
  | "timeout"
  | "sessionExpired"
  | "maintenance"
  | "generic";

interface ErrorScreenProps {
  type?: ErrorType;
  onRetry?: () => void;
  onLogin?: () => void;
  errorMessage?: string;
  errorCode?: string;
  statusCode?: number;
}

/**
 * Detects error type from an axios error or generic Error object
 */
export function detectErrorType(error: any): ErrorType {
  // Network error (no internet)
  if (
    error?.message === "Network Error" ||
    error?.code === "ERR_NETWORK" ||
    !error?.response
  ) {
    if (error?.message?.includes("timeout") || error?.code === "ECONNABORTED") {
      return "timeout";
    }
    return "network";
  }

  const status = error?.response?.status;

  // Session expired
  if (status === 401) {
    return "sessionExpired";
  }

  // Maintenance
  if (status === 503) {
    return "maintenance";
  }

  // Server errors
  if (status && status >= 500) {
    return "server";
  }

  // Timeout
  if (error?.code === "ECONNABORTED" || error?.message?.includes("timeout")) {
    return "timeout";
  }

  return "generic";
}

/**
 * Smart error screen that renders the appropriate error UI
 * based on the error type. Use detectErrorType() to auto-detect.
 */
export default function ErrorScreen({
  type = "generic",
  onRetry,
  onLogin,
  errorMessage,
  errorCode,
  statusCode,
}: ErrorScreenProps) {
  switch (type) {
    case "network":
      return <NetworkErrorScreen onRetry={onRetry} />;
    case "server":
      return <ServerErrorScreen onRetry={onRetry} statusCode={statusCode} />;
    case "timeout":
      return <TimeoutErrorScreen onRetry={onRetry} />;
    case "sessionExpired":
      return <SessionExpiredScreen onLogin={onLogin} />;
    case "maintenance":
      return <MaintenanceScreen />;
    case "generic":
    default:
      return (
        <GenericErrorScreen
          onRetry={onRetry}
          errorMessage={errorMessage}
          errorCode={errorCode}
        />
      );
  }
}
