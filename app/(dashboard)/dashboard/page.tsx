"use client";

import { useOrganization } from "@/hooks/use-organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Palette, Heart, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { organization, loading } = useOrganization();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {organization?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s an overview of your donation widget performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              Start customizing your widget to begin accepting donations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Widget Status</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Not Active</div>
            <p className="text-xs text-muted-foreground">
              Customize and activate your widget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              No data available yet
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold">1. Customize Your Widget</h3>
              <p className="text-sm text-gray-600">
                Design your donation widget to match your brand
              </p>
            </div>
            <Link href="/dashboard/widget/customize">
              <Button>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-50">
            <div>
              <h3 className="font-semibold">2. Add Causes</h3>
              <p className="text-sm text-gray-600">
                Create causes for donors to support
              </p>
            </div>
            <Button disabled>Complete Step 1</Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-50">
            <div>
              <h3 className="font-semibold">3. Embed Widget</h3>
              <p className="text-sm text-gray-600">
                Add the widget to your website
              </p>
            </div>
            <Button disabled>Complete Step 2</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
