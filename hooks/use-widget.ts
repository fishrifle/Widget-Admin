"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";

type Widget = Database["public"]["Tables"]["widgets"]["Row"];

export function useWidget(organizationId?: string) {
  const [widget, setWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchWidget() {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
  
        const { data, error } = await supabase
          .from("widgets")
          .select("*")
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (error) throw error;

        if (mounted) {
          setWidget(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchWidget();

    return () => {
      mounted = false;
    };
  }, [organizationId]);

  const updateWidget = async (updates: Partial<Widget>) => {
    if (!widget) return;

    try {

      const { data, error } = await supabase
        .from("widgets")
        .update(updates)
        .eq("id", widget.id)
        .select()
        .single();

      if (error) throw error;
      setWidget(data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return { widget, loading, error, updateWidget };
}
