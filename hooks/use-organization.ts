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
        // First get the user's organization_id
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("organization_id")
          .eq("id", userId)
          .single();

        if (userError) {
          // User doesn't exist in our database yet
          if (userError.code === 'PGRST116') {
            console.log("User not found in database, setting organization to null");
            if (mounted) {
              setOrganization(null);
              setLoading(false);
            }
            return;
          }
          
          console.error("Error fetching user:", userError);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (!user?.organization_id) {
          if (mounted) {
            setOrganization(null);
            setLoading(false);
          }
          return;
        }

        // Then get the organization details
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", user.organization_id)
          .single();

        if (orgError) {
          console.error("Error fetching organization:", orgError);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setOrganization(org);
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
