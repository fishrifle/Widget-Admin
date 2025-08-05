"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "super_admin" | "owner" | "editor";
  requiresOrganization?: boolean;
}

export function AuthGuard({ 
  children, 
  requiredRole,
  requiresOrganization = true 
}: AuthGuardProps) {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasOrganization, setHasOrganization] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserAccess() {
      if (!isLoaded || !userId) {
        setLoading(false);
        return;
      }

      try {
        // Use API route instead of direct Supabase query to avoid 406 errors
        const response = await fetch("/api/user/organization");
        
        if (!response.ok) {
          console.error("Error fetching user data:", response.status);
          // If API call fails, redirect to onboarding
          router.push("/onboarding");
          return;
        }

        const { user: userData, organization } = await response.json();

        if (!userData) {
          // User doesn't exist, redirect to onboarding
          router.push("/onboarding");
          return;
        }

        setUserRole(userData.role);
        setHasOrganization(!!userData.organization_id);

        // Check role requirements
        if (requiredRole) {
          const roleHierarchy = ["editor", "owner", "super_admin"];
          const userRoleIndex = roleHierarchy.indexOf(userData.role);
          const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
          
          if (userRoleIndex < requiredRoleIndex) {
            router.push("/dashboard");
            return;
          }
        }

        // Check organization requirements
        if (requiresOrganization && !userData.organization_id) {
          router.push("/onboarding");
          return;
        }
      } catch (error) {
        console.error("Error in auth guard:", error);
        router.push("/onboarding");
        return;
      } finally {
        setLoading(false);
      }
    }

    checkUserAccess();
  }, [isLoaded, userId, requiredRole, requiresOrganization, router]);

  // Show loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!userId) {
    router.push("/sign-in");
    return null;
  }

  // Show content if all checks pass
  return <>{children}</>;
}

// Higher-order component for protecting admin routes
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="super_admin" requiresOrganization={false}>
      {children}
    </AuthGuard>
  );
}

// Higher-order component for protecting organization routes
export function OrganizationGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiresOrganization={true}>
      {children}
    </AuthGuard>
  );
}