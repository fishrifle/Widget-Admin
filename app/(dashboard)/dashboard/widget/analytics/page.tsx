"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  ArrowUpIcon,
  ArrowDownIcon
} from "lucide-react";
import { useWidget } from "@/hooks/use-widget";

interface AnalyticsData {
  totalDonations: number;
  totalAmount: number;
  uniqueDonors: number;
  conversionRate: number;
  averageDonation: number;
  monthlyRecurring: number;
  yearlyRecurring: number;
  oneTimeDonations: number;
  growth: {
    donations: number;
    amount: number;
    donors: number;
  };
}

export default function WidgetAnalyticsPage() {
  const { widget, loading: widgetLoading } = useWidget();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (widget) {
      fetchAnalytics();
    }
  }, [widget, dateRange]);

  const fetchAnalytics = async () => {
    if (!widget) return;
    
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockData: AnalyticsData = {
        totalDonations: 142,
        totalAmount: 15420.50,
        uniqueDonors: 98,
        conversionRate: 3.2,
        averageDonation: 108.59,
        monthlyRecurring: 24,
        yearlyRecurring: 8,
        oneTimeDonations: 110,
        growth: {
          donations: 12.5,
          amount: 18.3,
          donors: 8.7
        }
      };
      
      setAnalytics(mockData);
    } catch (err) {
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (widgetLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <Button onClick={fetchAnalytics} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Widget Analytics</h1>
          <p className="text-gray-600">
            Analytics for {widget?.name || 'your widget'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalAmount)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.growth.amount > 0 ? (
                <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={analytics.growth.amount > 0 ? "text-green-500" : "text-red-500"}>
                {formatPercentage(analytics.growth.amount)}
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDonations}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.growth.donations > 0 ? (
                <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={analytics.growth.donations > 0 ? "text-green-500" : "text-red-500"}>
                {formatPercentage(analytics.growth.donations)}
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueDonors}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.growth.donors > 0 ? (
                <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={analytics.growth.donors > 0 ? "text-green-500" : "text-red-500"}>
                {formatPercentage(analytics.growth.donors)}
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Donation</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.averageDonation)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="frequency">Frequency</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Donation Frequency Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">One-time Donations</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{analytics.oneTimeDonations}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {((analytics.oneTimeDonations / analytics.totalDonations) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Recurring</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{analytics.monthlyRecurring}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {((analytics.monthlyRecurring / analytics.totalDonations) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Yearly Recurring</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{analytics.yearlyRecurring}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {((analytics.yearlyRecurring / analytics.totalDonations) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <Badge variant={analytics.conversionRate > 2 ? "default" : "secondary"}>
                    {analytics.conversionRate}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Donation</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(analytics.averageDonation)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Repeat Donor Rate</span>
                  <Badge variant="secondary">
                    {(((analytics.monthlyRecurring + analytics.yearlyRecurring) / analytics.uniqueDonors) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="frequency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Donation Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Breakdown of recurring vs one-time donations
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.oneTimeDonations}</div>
                    <div className="text-sm text-muted-foreground">One-time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.monthlyRecurring}</div>
                    <div className="text-sm text-muted-foreground">Monthly</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.yearlyRecurring}</div>
                    <div className="text-sm text-muted-foreground">Yearly</div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Recurring donations provide {((analytics.monthlyRecurring + analytics.yearlyRecurring) / analytics.totalDonations * 100).toFixed(1)}% 
                    of total donation volume, contributing to predictable revenue.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track how your widget is performing over time
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Detailed performance charts coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}