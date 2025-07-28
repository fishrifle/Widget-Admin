"use client";

import { useOrganization } from "@/hooks/use-organization";
import { useWidget } from "@/hooks/use-widget";
import { useDonations } from "@/hooks/use-donations";
import { Receipt, Download, Eye } from "lucide-react";
import { format } from "date-fns";

export default function InvoicesPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const { widget, loading: widgetLoading } = useWidget(organization?.id);
  const { donations, loading: donationsLoading } = useDonations(widget?.id);

  const loading = orgLoading || widgetLoading || donationsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No organization found</p>
      </div>
    );
  }

  // Filter successful donations for invoicing
  const successfulDonations = donations.filter(d => d.status === 'succeeded');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Donation Records</h2>
          <p className="text-sm text-gray-600">
            All successful donations for {organization.name}
          </p>
        </div>

        {successfulDonations.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No donation records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {successfulDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(donation.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {donation.donor_name || 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {donation.donor_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(donation.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {donation.stripe_payment_intent_id?.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-primary hover:text-primary/80 mr-3">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-primary hover:text-primary/80">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {successfulDonations.length}
            </p>
            <p className="text-sm text-gray-600">Total Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              ${(successfulDonations.reduce((sum, d) => sum + d.amount, 0) / 100).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              ${successfulDonations.length > 0 ? (successfulDonations.reduce((sum, d) => sum + d.amount, 0) / 100 / successfulDonations.length).toFixed(2) : '0.00'}
            </p>
            <p className="text-sm text-gray-600">Average Donation</p>
          </div>
        </div>
      </div>
    </div>
  );
}