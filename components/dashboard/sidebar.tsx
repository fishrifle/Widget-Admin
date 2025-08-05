"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Palette,
  Heart,
  Receipt,
  Users,
  Building,
  Settings,
  Bell,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { memo, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const { userId } = useAuth();
  const [role, setRole] = useState<string | null>(null);

  // Get user role from API instead of direct Supabase query
  useEffect(() => {
    async function fetchUserRole() {
      if (!userId) return;
      
      try {
        const response = await fetch("/api/user/organization");
        
        if (response.ok) {
          const { user } = await response.json();
          if (user?.role) {
            setRole(user.role);
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    }

    fetchUserRole();
  }, [userId]);

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Widget Customizer",
      href: "/dashboard/widget/customize",
      icon: Palette,
    },
    {
      title: "Donations",
      href: "/dashboard/donations",
      icon: Heart,
    },
    {
      title: "Invoices",
      href: "/dashboard/invoices",
      icon: Receipt,
    },
    {
      title: "Team",
      href: "/dashboard/team",
      icon: Users,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: "Notifications",
      href: "/dashboard/settings/notifications",
      icon: Bell,

    },
  ];

  const isActive = (itemHref: string) => {
    if (itemHref === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (itemHref === "/dashboard/widget/customize") {
      return pathname === "/dashboard/widget/customize";
    }
    return pathname.startsWith(itemHref);
  };

  const adminItems = [
    {
      title: "Organizations",
      href: "/admin/organizations",
      icon: Building,
    },
    {
      title: "All Widgets",
      href: "/admin/widgets",
      icon: Settings,
    },
    {
      title: "All Users",
      href: "/admin/users",
      icon: Users,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-primary">PassItOn</h2>
      </div>
      <nav className="px-4 pb-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive(item.href)
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                )}
              >
                <item.icon className="w-5 h-5" />
               {item.title}
              </Link>
            </li>
          ))}
        </ul>
        {(role === "super_admin" || true) && (
          <>
            <div className="mt-8 mb-2 px-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Admin
              </p>
            </div>
            <ul className="space-y-1">
              {adminItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      pathname === item.href || pathname.startsWith(item.href)
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
});