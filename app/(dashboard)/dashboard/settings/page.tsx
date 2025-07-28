"use client";

import { useOrganization } from "@/hooks/use-organization";
import { OrganizationSettings } from "@/components/dashboard/organization-settings";

export default function SettingsPage() {
  const { organization, loading } = useOrganization();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
        <p className="text-gray-600">
          Please contact support if this error persists.
        </p>
      </div>
    );
  }

  return <OrganizationSettings organizationId={organization.id} />;
}