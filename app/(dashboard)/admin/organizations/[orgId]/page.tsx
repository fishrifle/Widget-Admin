"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { supabase } from "@/lib/supabase/client";
import { 
  Building, 
  CreditCard, 
  Users, 
  Palette, 
  DollarSign, 
  Calendar,
  Mail,
  Globe,
  ArrowLeft,
  Activity,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";

// TypeScript types - these tell our code what data looks like
interface OrganizationDetail {
  id: string;
  name: string;
  legal_name: string;
  display_name: string;
  email: string;
  created_at: string;
  updated_at: string;
  subscription_status: string;
  stripe_account_id: string | null;
  terms_of_service_url: string | null;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface Widget {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  donation_count: number;
  total_raised: number;
}

interface OrganizationStats {
  total_widgets: number;
  active_widgets: number;
  total_donations: number;
  total_raised: number;
  team_members: number;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  // State - this is where we store our data
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [stats, setStats] = useState<OrganizationStats>({
    total_widgets: 0,
    active_widgets: 0,
    total_donations: 0,
    total_raised: 0,
    team_members: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get all the organization data
  const fetchOrganizationData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get basic organization info
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

      if (orgError) throw orgError;
      if (!orgData) throw new Error("Organization not found");

      setOrganization(orgData);

      // Get team members
      const { data: teamData, error: teamError } = await supabase
        .from("users")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (teamError) throw teamError;
      setTeamMembers(teamData || []);

      // Get widgets first (simpler query)
      const { data: widgetData, error: widgetError } = await supabase
        .from("widgets")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (widgetError) throw widgetError;

      // Then get donation stats for each widget separately
      const processedWidgets = [];
      let totalDonations = 0;
      let totalRaised = 0;

      if (widgetData) {
        for (const widget of widgetData) {
          // Get donation stats for this widget
          const { data: donationStats } = await supabase
            .from("donations")
            .select("amount")
            .eq("widget_id", widget.id)
            .eq("status", "succeeded");

          const donationCount = donationStats?.length || 0;
          const widgetRaised = donationStats?.reduce((sum, donation) => sum + (donation.amount || 0), 0) || 0;

          processedWidgets.push({
            id: widget.id,
            name: widget.name,
            slug: widget.slug,
            is_active: widget.is_active,
            created_at: widget.created_at,
            donation_count: donationCount,
            total_raised: widgetRaised
          });

          totalDonations += donationCount;
          totalRaised += widgetRaised;
        }
      }

      setWidgets(processedWidgets);

      // Calculate overall stats
      const totalWidgets = processedWidgets.length;
      const activeWidgets = processedWidgets.filter(w => w.is_active).length;

      setStats({
        total_widgets: totalWidgets,
        active_widgets: activeWidgets,
        total_donations: totalDonations,
        total_raised: totalRaised,
        team_members: teamData?.length || 0
      });

    } catch (error) {
      console.error("Error fetching organization data:", error);
      setError(error instanceof Error ? error.message : "Failed to load organization");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // This runs when the page loads
  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);

  // Show loading spinner while data loads
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Show error message if something went wrong
  if (error || !organization) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-semibold mb-2">Error Loading Organization</h2>
        <p className="text-gray-600 mb-4">{error || "Organization not found"}</p>
        <Button onClick={() => router.push("/admin/organizations")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Organizations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => router.push("/admin/organizations")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{organization.display_name || organization.name}</h1>
          <p className="text-gray-600">Organization Details & Management</p>
        </div>
      </div>

      {/* Stats Cards - Quick overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.total_raised / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats.total_donations} donations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Widgets</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_widgets}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_widgets} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.team_members}</div>
            <p className="text-xs text-muted-foreground">
              Active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={organization.subscription_status === 'active' ? 'default' : 'secondary'}>
                {organization.subscription_status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Subscription status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="widgets">Widgets</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Organization Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Legal Name</label>
                  <p className="text-lg">{organization.legal_name || organization.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Display Name</label>
                  <p className="text-lg">{organization.display_name || organization.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {organization.email}
                  </p>
                </div>
                {organization.terms_of_service_url && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Terms of Service</label>
                    <p className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <a 
                        href={organization.terms_of_service_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Terms
                      </a>
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(organization.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average per Widget</span>
                  <span className="font-semibold">
                    ${stats.total_widgets > 0 ? ((stats.total_raised / 100) / stats.total_widgets).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Donation</span>
                  <span className="font-semibold">
                    ${stats.total_donations > 0 ? ((stats.total_raised / 100) / stats.total_donations).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Widget Activation Rate</span>
                  <span className="font-semibold">
                    {stats.total_widgets > 0 ? Math.round((stats.active_widgets / stats.total_widgets) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Account Age</span>
                  <span className="font-semibold">
                    {Math.floor((Date.now() - new Date(organization.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Widgets Tab */}
        <TabsContent value="widgets">
          <Card>
            <CardHeader>
              <CardTitle>Widgets ({widgets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {widgets.length === 0 ? (
                <div className="text-center py-8">
                  <Palette className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No widgets created yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {widgets.map((widget) => (
                    <div key={widget.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Palette className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{widget.name}</p>
                          <p className="text-sm text-gray-600">/{widget.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">${(widget.total_raised / 100).toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{widget.donation_count} donations</p>
                        </div>
                        <Badge variant={widget.is_active ? 'default' : 'secondary'}>
                          {widget.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({teamMembers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No team members yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.first_name && member.last_name 
                              ? `${member.first_name} ${member.last_name}` 
                              : member.email
                            }
                          </p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                        <p className="text-sm text-gray-600">
                          {format(new Date(member.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Stripe Connect Status</p>
                    <p className="text-sm text-gray-600">
                      {organization.stripe_account_id ? 'Connected' : 'Not Connected'}
                    </p>
                  </div>
                  <Badge variant={organization.stripe_account_id ? 'default' : 'secondary'}>
                    {organization.stripe_account_id ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                {organization.stripe_account_id && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Account ID:</strong> {organization.stripe_account_id}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Subscription Status</p>
                    <p className="text-sm text-gray-600">Current billing status</p>
                  </div>
                  <Badge variant={organization.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {organization.subscription_status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}