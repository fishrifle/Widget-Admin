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
  Palette, 
  Search, 
  ExternalLink, 
  Eye,
  DollarSign,
  Activity,
  Building,
  Calendar,
  TrendingUp,
  Users,
  Globe
} from "lucide-react";
import { format } from "date-fns";

// TypeScript types - these define what our data looks like
interface WidgetWithOrg {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization: {
    id: string;
    name: string;
    display_name: string;
    email: string;
    subscription_status: string;
  };
  donation_count: number;
  total_raised: number;
  last_donation_date: string | null;
}

interface WidgetStats {
  total_widgets: number;
  active_widgets: number;
  total_raised_all: number;
  total_donations_all: number;
  avg_per_widget: number;
}

export default function AdminWidgetsPage() {
  const router = useRouter();
  
  // State - where we store our data
  const [widgets, setWidgets] = useState<WidgetWithOrg[]>([]);
  const [filteredWidgets, setFilteredWidgets] = useState<WidgetWithOrg[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WidgetStats>({
    total_widgets: 0,
    active_widgets: 0,
    total_raised_all: 0,
    total_donations_all: 0,
    avg_per_widget: 0
  });

  // This runs when the page loads
  useEffect(() => {
    fetchAllWidgets();
  }, []);

  // Filter widgets when search or status filter changes
  useEffect(() => {
    filterWidgets();
  }, [widgets, searchTerm, statusFilter]);

  // Function to get all widgets from all organizations
  async function fetchAllWidgets() {
    try {
      setLoading(true);
      setError(null);

      // Get all widgets with their organization info
      const { data: widgetData, error: widgetError } = await supabase
        .from("widgets")
        .select(`
          *,
          organizations!inner (
            id,
            name,
            display_name,
            email,
            subscription_status
          )
        `)
        .order("created_at", { ascending: false });

      if (widgetError) throw widgetError;

      // Process each widget to get donation stats
      const processedWidgets: WidgetWithOrg[] = [];
      let totalRaisedAll = 0;
      let totalDonationsAll = 0;

      if (widgetData) {
        for (const widget of widgetData) {
          // Get donation stats for this widget
          const { data: donationStats } = await supabase
            .from("donations")
            .select("amount, created_at")
            .eq("widget_id", widget.id)
            .eq("status", "succeeded")
            .order("created_at", { ascending: false });

          const donationCount = donationStats?.length || 0;
          const totalRaised = donationStats?.reduce((sum, donation) => sum + (donation.amount || 0), 0) || 0;
          const lastDonation = donationStats?.[0]?.created_at || null;

          const processedWidget: WidgetWithOrg = {
            id: widget.id,
            name: widget.name,
            slug: widget.slug,
            is_active: widget.is_active,
            created_at: widget.created_at,
            updated_at: widget.updated_at,
            organization: {
              id: widget.organizations.id,
              name: widget.organizations.name,
              display_name: widget.organizations.display_name,
              email: widget.organizations.email,
              subscription_status: widget.organizations.subscription_status
            },
            donation_count: donationCount,
            total_raised: totalRaised,
            last_donation_date: lastDonation
          };

          processedWidgets.push(processedWidget);
          totalRaisedAll += totalRaised;
          totalDonationsAll += donationCount;
        }
      }

      setWidgets(processedWidgets);

      // Calculate overall stats
      const totalWidgets = processedWidgets.length;
      const activeWidgets = processedWidgets.filter(w => w.is_active).length;
      const avgPerWidget = totalWidgets > 0 ? totalRaisedAll / totalWidgets : 0;

      setStats({
        total_widgets: totalWidgets,
        active_widgets: activeWidgets,
        total_raised_all: totalRaisedAll,
        total_donations_all: totalDonationsAll,
        avg_per_widget: avgPerWidget
      });

    } catch (error) {
      console.error("Error fetching widgets:", error);
      setError(error instanceof Error ? error.message : "Failed to load widgets");
    } finally {
      setLoading(false);
    }
  }

  // Function to filter widgets based on search and status
  function filterWidgets() {
    let filtered = widgets;

    // Filter by search term (widget name, org name, or email)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(widget => 
        widget.name.toLowerCase().includes(searchLower) ||
        widget.organization.name.toLowerCase().includes(searchLower) ||
        widget.organization.display_name?.toLowerCase().includes(searchLower) ||
        widget.organization.email.toLowerCase().includes(searchLower) ||
        widget.slug.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(widget => 
        statusFilter === "active" ? widget.is_active : !widget.is_active
      );
    }

    setFilteredWidgets(filtered);
  }

  // Function to view a widget in admin preview mode
  function viewWidget(slug: string) {
    window.open(`/admin/widgets/preview/${slug}`, '_blank');
  }

  // Function to go to organization details
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
        <h2 className="text-xl font-semibold mb-2">Error Loading Widgets</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => fetchAllWidgets()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">All Widgets</h1>
        <p className="text-gray-600 mt-1">
          Manage widgets across all organizations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Widgets</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.total_raised_all / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats.total_donations_all} donations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Widget</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.avg_per_widget / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Performance metric
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_widgets > 0 ? Math.round((stats.active_widgets / stats.total_widgets) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Activation percentage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search widgets, organizations, or emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            size="sm"
          >
            All ({widgets.length})
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
            size="sm"
          >
            Active ({stats.active_widgets})
          </Button>
          <Button
            variant={statusFilter === "inactive" ? "default" : "outline"}
            onClick={() => setStatusFilter("inactive")}
            size="sm"
          >
            Inactive ({stats.total_widgets - stats.active_widgets})
          </Button>
        </div>
      </div>

      {/* Widgets List */}
      <div className="space-y-4">
        {filteredWidgets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Palette className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all" 
                  ? "No widgets match your filters" 
                  : "No widgets found"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredWidgets.map((widget) => (
            <Card key={widget.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Widget Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Palette className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{widget.name}</h3>
                        <Badge variant={widget.is_active ? 'default' : 'secondary'}>
                          {widget.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">/{widget.slug}</p>
                      
                      {/* Organization Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {widget.organization.display_name || widget.organization.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {widget.organization.subscription_status}
                        </Badge>
                      </div>
                      
                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">
                            ${(widget.total_raised / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{widget.donation_count} donations</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {format(new Date(widget.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {widget.last_donation_date && (
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            <span>Last donation {format(new Date(widget.last_donation_date), 'MMM d')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewWidget(widget.slug)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Widget
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewOrganization(widget.organization.id)}
                    >
                      <Building className="w-4 h-4 mr-1" />
                      View Org
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Results Summary */}
      {filteredWidgets.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Showing {filteredWidgets.length} of {widgets.length} widgets
        </div>
      )}
    </div>
  );
}