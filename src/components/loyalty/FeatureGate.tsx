/**
 * FeatureGate Component
 * Conditionally renders children based on feature flags
 * 
 * USAGE: <FeatureGate flag="campaigns">...</FeatureGate>
 */

import { isFeatureEnabled, type FeatureFlags } from "@/src/config/featureFlags";
import React, { ReactNode } from "react";

interface FeatureGateProps {
  flag: keyof FeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function FeatureGate({
  flag,
  children,
  fallback = null,
}: FeatureGateProps) {
  const enabled = isFeatureEnabled(flag);

  if (!enabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
