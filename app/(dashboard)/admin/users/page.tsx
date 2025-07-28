"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { supabase } from "@/lib/supabase/client";
import { 
  Users, 
  Search, 
  Building, 
  Mail,
  Calendar,
  Shield,
  User,
  Crown,
  Activity,
  TrendingUp,
  UserCheck,
  Clock
} from "lucide-react";
import { format } from "date-fns";

// TypeScript types - these define what our data looks like
interface UserWithOrg {
  id: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  status?: string;
  invited_at?: string;
  organization: {
    id: string;
    name: string;
    display_name: string;
    subscription_status: string;
  } | null;
}

interface UserStats {
  total_users: number;
  owners: number;
  editors: number;
  super_admins: number;
  active_users: number;
  recent_signups: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  
  // State - where we store our data
  const [users, setUsers] = useState<UserWithOrg[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithOrg[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "owner" | "editor" | "super_admin">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    owners: 0,
    editors: 0,
    super_admins: 0,
    active_users: 0,
    recent_signups: 0
  });

  // This runs when the page loads
  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Function to filter users based on search and role
  const filterUsers = useCallback(() => {
    let filtered = users;

    // Filter by search term (name, email, or organization)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower) ||
        user.organization?.name.toLowerCase().includes(searchLower) ||
        user.organization?.display_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  // Filter users when search or role filter changes
  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  // Function to get all users from all organizations
  async function fetchAllUsers() {
    try {
      setLoading(true);
      setError(null);

      // Get all users with their organization info
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(`
          *,
          organizations (
            id,
            name,
            display_name,
            subscription_status
          )
        `)
        .order("created_at", { ascending: false });

      if (userError) throw userError;

      const processedUsers: UserWithOrg[] = userData?.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        status: user.status,
        invited_at: user.invited_at,
        organization: user.organizations
      })) || [];

      setUsers(processedUsers);

      // Calculate stats
      const total = processedUsers.length;
      const owners = processedUsers.filter(u => u.role === 'owner').length;
      const editors = processedUsers.filter(u => u.role === 'editor').length;
      const superAdmins = processedUsers.filter(u => u.role === 'super_admin').length;
      const activeUsers = processedUsers.filter(u => u.status !== 'pending').length;
      
      // Recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSignups = processedUsers.filter(u => 
        new Date(u.created_at) > thirtyDaysAgo
      ).length;

      setStats({
        total_users: total,
        owners: owners,
        editors: editors,
        super_admins: superAdmins,
        active_users: activeUsers,
        recent_signups: recentSignups
      });

    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  // Function to get role icon
  function getRoleIcon(role: string) {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4" />;
      case 'owner':
        return <Shield className="w-4 h-4" />;
      case 'editor':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  }

  // Function to get role badge color
  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'owner':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'editor':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // Function to get status badge
  function getStatusBadge(user: UserWithOrg) {
    if (user.status === 'pending') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <UserCheck className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  }

  // Function to view organization details
  function viewOrganization(orgId: string) {
    router.push(`/admin/organizations/${orgId}`);
  }

  // Show loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-semibold mb-2">Error Loading Users</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => fetchAllUsers()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-gray-600 mt-1">
          Manage users across all organizations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_users} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization Owners</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.owners}</div>
            <p className="text-xs text-muted-foreground">
              {stats.editors} editors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.super_admins}</div>
            <p className="text-xs text-muted-foreground">
              Platform administrators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent_signups}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users, emails, or organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={roleFilter === "all" ? "default" : "outline"}
            onClick={() => setRoleFilter("all")}
            size="sm"
          >
            All ({users.length})
          </Button>
          <Button
            variant={roleFilter === "owner" ? "default" : "outline"}
            onClick={() => setRoleFilter("owner")}
            size="sm"
          >
            Owners ({stats.owners})
          </Button>
          <Button
            variant={roleFilter === "editor" ? "default" : "outline"}
            onClick={() => setRoleFilter("editor")}
            size="sm"
          >
            Editors ({stats.editors})
          </Button>
          <Button
            variant={roleFilter === "super_admin" ? "default" : "outline"}
            onClick={() => setRoleFilter("super_admin")}
            size="sm"
          >
            Super Admins ({stats.super_admins})
          </Button>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm || roleFilter !== "all" 
                  ? "No users match your filters" 
                  : "No users found"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* User Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}` 
                            : user.email
                          }
                        </h3>
                        <Badge className={`border ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                        </Badge>
                        {getStatusBadge(user)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </p>
                      
                      {/* Organization Info */}
                      {user.organization && (
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {user.organization.display_name || user.organization.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {user.organization.subscription_status}
                          </Badge>
                        </div>
                      )}
                      
                      {/* User Details */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {format(new Date(user.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {user.invited_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Invited {format(new Date(user.invited_at), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          <span>ID: {user.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    {user.organization && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewOrganization(user.organization!.id)}
                      >
                        <Building className="w-4 h-4 mr-1" />
                        View Org
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Results Summary */}
      {filteredUsers.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}

      {/* User Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Distribution</CardTitle>
          <p className="text-sm text-gray-600">Overview of user roles across the platform</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Crown className="w-6 h-6 text-purple-600" />
                <span className="font-semibold text-purple-900">Super Admins</span>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-1">{stats.super_admins}</p>
              <p className="text-sm text-purple-700">Platform administrators with full access</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-blue-900">Organization Owners</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">{stats.owners}</p>
              <p className="text-sm text-blue-700">Full organization management access</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center gap-2 mb-3">
                <User className="w-6 h-6 text-green-600" />
                <span className="font-semibold text-green-900">Editors</span>
              </div>
              <p className="text-3xl font-bold text-green-600 mb-1">{stats.editors}</p>
              <p className="text-sm text-green-700">Limited organization content access</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}