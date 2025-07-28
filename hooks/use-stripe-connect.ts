"use client";

import { useState, useCallback } from "react";

interface StripeConnectStatus {
  accountId?: string;
  onboardingComplete: boolean;
  requiresAction: boolean;
  actionUrl?: string;
}

export function useStripeConnect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConnectAccount = useCallback(async (organizationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create Stripe account");
      }

      const { accountId, onboardingUrl } = await response.json();
      
      // Redirect to Stripe onboarding
      window.location.href = onboardingUrl;
      
      return { accountId, onboardingUrl };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async (organizationId: string): Promise<StripeConnectStatus> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stripe/connect/status?organizationId=${organizationId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check status");
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const openDashboard = useCallback(async (organizationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/connect/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to open dashboard");
      }

      const { dashboardUrl } = await response.json();
      
      // Open dashboard in new window
      window.open(dashboardUrl, "_blank");
      
      return dashboardUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createConnectAccount,
    checkStatus,
    openDashboard,
    loading,
    error,
    clearError: () => setError(null),
  };
}