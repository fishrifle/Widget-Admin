"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export function useOrganization() {
  const { userId } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchOrganization() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {

        const { data: org, error: orgError } = await supabase
          .from("users")
          .select("organizations(*)")
          .eq("id", userId)
          .single();

        if (orgError) {
          console.error("Error fetching organization:", orgError);
          return;
        }

        if (mounted && org?.organizations) {
          setOrganization(org.organizations as any);
        }
      } catch (error) {
        console.error("Error in useOrganization:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchOrganization();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return { organization, loading };
}
