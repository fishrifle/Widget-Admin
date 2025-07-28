import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import type { SystemAlert } from "@/types/notifications.types";

export function useSystemAlerts() {
  const { userId } = useAuth();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/system-alerts");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch system alerts");
      }

      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/system-alerts/${alertId}/acknowledge`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to acknowledge alert");
      }

      // Remove from local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error("Error acknowledging alert:", err);
      throw err;
    }
  }, []);

  const createAlert = useCallback(async (alertData: {
    title: string;
    message: string;
    type?: string;
    severity?: string;
    target_audience?: string;
    target_organization_id?: string;
    expires_at?: string;
  }) => {
    try {
      const response = await fetch("/api/system-alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(alertData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create alert");
      }

      // Refresh alerts
      await fetchAlerts();
      return data;
    } catch (err) {
      console.error("Error creating alert:", err);
      throw err;
    }
  }, [fetchAlerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    acknowledgeAlert,
    createAlert,
    refresh: fetchAlerts,
  };
}