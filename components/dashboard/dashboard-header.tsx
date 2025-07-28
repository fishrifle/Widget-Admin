"use client";

import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Crown, Shield, User, Building } from "lucide-react";

export function DashboardHeader() {
  const pathname = usePathname();
  const { userId, isLoaded } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user role and organization from Supabase
  useEffect(() => {
    async function fetchUserInfo() {
      if (!userId || !isLoaded) return;
      
      try {
        setLoading(true);
        const { data } = await supabase
          .from("users")
          .select(`
            role,
            organizations (
              name,
              display_name
            )
          `)
          .eq("id", userId)
          .single();
        
        if (data) {
          setRole(data.role);
          if (data.organizations) {
            const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
            setOrganizationName(org?.display_name || org?.name);
          }
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        // Set default role to prevent breaking
        setRole('editor');
      } finally {
        setLoading(false);
      }
    }

    fetchUserInfo();
  }, [userId, isLoaded]);

  // Determine dashboard type and title based on current path and role
  function getDashboardInfo() {
    const isAdminPath = pathname.startsWith('/admin/');
    
    // Temporarily override role for admin paths
    const effectiveRole = isAdminPath ? 'super_admin' : role;
    
    if (isAdminPath) {
      return {
        type: 'Platform Administration',
        icon: <Crown className="w-5 h-5 text-purple-600" />,
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        description: 'Super Admin - Platform Management & Support'
      };
    }
    
    if (effectiveRole === 'super_admin') {
      return {
        type: 'Support Dashboard',
        icon: <Crown className="w-5 h-5 text-purple-600" />,
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        description: 'Platform Support & Customer Service'
      };
    }
    
    if (effectiveRole === 'owner') {
      return {
        type: 'Organization Dashboard',
        icon: <Shield className="w-5 h-5 text-blue-600" />,
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        description: organizationName || 'Organization Management'
      };
    }
    
    if (effectiveRole === 'editor') {
      return {
        type: 'Team Dashboard',
        icon: <User className="w-5 h-5 text-green-600" />,
        badgeColor: 'bg-green-100 text-green-800 border-green-200',
        description: organizationName || 'Content Management'
      };
    }
    
    // Default fallback
    return {
      type: 'Dashboard',
      icon: <Building className="w-5 h-5 text-gray-600" />,
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'Welcome'
    };
  }

  // Function to get header strip color based on dashboard type
  function getHeaderStripColor() {
    const isAdminPath = pathname.startsWith('/admin/');
    const effectiveRole = isAdminPath ? 'super_admin' : role;
    
    if (isAdminPath || effectiveRole === 'super_admin') {
      return 'bg-gradient-to-r from-purple-500 to-purple-600'; // Purple for Super Admin
    }
    
    if (effectiveRole === 'owner') {
      return 'bg-gradient-to-r from-blue-500 to-blue-600'; // Blue for Organization Owner
    }
    
    if (effectiveRole === 'editor') {
      return 'bg-gradient-to-r from-green-500 to-green-600'; // Green for Editor
    }
    
    return 'bg-gradient-to-r from-gray-400 to-gray-500'; // Gray fallback
  }

  // Show loading state while auth is loading
  if (!isLoaded || loading) {
    return (
      <div className="bg-white border-b border-gray-200">
        <div className="h-1 bg-gray-300" />
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-gray-400" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">Loading...</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dashboardInfo = getDashboardInfo();
  const isAdminPath = pathname.startsWith('/admin/');
  const effectiveRole = isAdminPath ? 'super_admin' : role;

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Color-coded header strip */}
      <div className={`h-1 ${getHeaderStripColor()}`} />
      
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dashboardInfo.icon}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {dashboardInfo.type}
              </h1>
              <p className="text-sm text-gray-600">
                {dashboardInfo.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {effectiveRole && (
              <Badge className={`border ${dashboardInfo.badgeColor}`}>
                {effectiveRole === 'super_admin' && <Crown className="w-3 h-3 mr-1" />}
                {effectiveRole === 'owner' && <Shield className="w-3 h-3 mr-1" />}
                {effectiveRole === 'editor' && <User className="w-3 h-3 mr-1" />}
                <span className="capitalize">{effectiveRole.replace('_', ' ')}</span>
              </Badge>
            )}
            <UserButton />
          </div>
        </div>
      </div>
    </div>
  );
}