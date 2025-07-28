"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { WidgetConfig } from "@/types/widget.types";
import { Heart, Target, Users } from "lucide-react";

interface PublicWidget {
  id: string;
  name: string;
  slug: string;
  config: WidgetConfig;
  organization: {
    name: string;
    email: string;
  };
  causes: Array<{
    id: string;
    name: string;
    description: string | null;
    goal_amount: number | null;
    raised_amount: number;
    is_active: boolean;
  }>;
  theme: {
    primary_color: string;
    secondary_color: string;
    font_family: string;
    border_radius: string;
    custom_css: string | null;
  } | null;
}

export default function PublicWidgetPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [widget, setWidget] = useState<PublicWidget | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedCause, setSelectedCause] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWidget() {
      try {
        // Fetch widget with related data
        const { data: widgetDataArray, error: widgetError } = await supabase
          .from("widgets")
          .select(`
            id,
            name,
            slug,
            config,
            organization_id,
            organizations (
              name,
              email
            )
          `)
          .eq("slug", slug)
          .eq("is_active", true);

        if (widgetError) {
          console.error("Widget fetch error:", widgetError.message || widgetError);
          return;
        }

        if (!widgetDataArray || widgetDataArray.length === 0) {
          console.error("No widget found for slug:", slug);
          return;
        }

        const widgetData = widgetDataArray[0];

        // Fetch causes
        const { data: causesData } = await supabase
          .from("causes")
          .select("*")
          .eq("widget_id", widgetData.id)
          .eq("is_active", true);

        // Fetch theme
        const { data: themeData } = await supabase
          .from("widget_themes")
          .select("*")
          .eq("widget_id", widgetData.id)
          .single();

        setWidget({
          ...widgetData,
          organization: Array.isArray(widgetData.organizations) ? widgetData.organizations[0] : widgetData.organizations,
          causes: causesData || [],
          theme: themeData,
        });

        // Set default cause if only one exists
        if (causesData && causesData.length === 1) {
          setSelectedCause(causesData[0].id);
        }
      } catch (error) {
        console.error("Error fetching widget:", error);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchWidget();
    }
  }, [slug]);

  const handleDonate = async () => {
    const amount = selectedAmount || (customAmount ? parseFloat(customAmount) * 100 : null);
    
    if (!amount || amount < 100) { // Minimum $1
      alert("Please select or enter a donation amount of at least $1");
      return;
    }

    if (!selectedCause && (widget?.causes?.length ?? 0) > 1) {
      alert("Please select a cause to support");
      return;
    }

    // Here you would integrate with Stripe to process the payment
    // For now, just show an alert
    alert(`Processing donation of $${(amount / 100).toFixed(2)} to ${widget?.organization.name}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Widget Not Found</h1>
          <p className="text-gray-600">The donation widget you&apos;re looking for doesn&apos;t exist or is no longer active.</p>
        </div>
      </div>
    );
  }

  const theme = widget.theme || {
    primary_color: "#3b82f6",
    secondary_color: "#64748b",
    font_family: "Inter",
    border_radius: "8px",
    custom_css: null,
  };

  const suggestedAmounts = widget.config?.settings?.suggestedAmounts || [10, 25, 50, 100];

  return (
    <div 
      className="min-h-screen bg-gray-50 py-8"
      style={{ fontFamily: theme.font_family }}
    >
      {theme.custom_css && <style dangerouslySetInnerHTML={{ __html: theme.custom_css }} />}
      
      <div className="max-w-2xl mx-auto px-4">
        <div 
          className="bg-white rounded-lg shadow-lg p-8"
          style={{ borderRadius: theme.border_radius }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: theme.primary_color }}
            >
              Support {widget.organization.name}
            </h1>
            <p className="text-gray-600">Make a difference with your donation</p>
          </div>

          {/* Causes */}
          {widget.causes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Choose a Cause</h2>
              <div className="space-y-4">
                {widget.causes.map((cause) => (
                  <div
                    key={cause.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedCause === cause.id
                        ? "border-current"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={{
                      borderColor: selectedCause === cause.id ? theme.primary_color : undefined,
                      backgroundColor: selectedCause === cause.id ? theme.secondary_color + "20" : undefined,
                    }}
                    onClick={() => setSelectedCause(cause.id)}
                  >
                    <h3 className="font-semibold text-lg">{cause.name}</h3>
                    {cause.description && (
                      <p className="text-gray-600 mt-1">{cause.description}</p>
                    )}
                    {cause.goal_amount && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>${(cause.raised_amount / 100).toLocaleString()} raised</span>
                          <span>Goal: ${(cause.goal_amount / 100).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((cause.raised_amount / cause.goal_amount) * 100, 100)}%`,
                              backgroundColor: theme.primary_color,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Donation Amount */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Choose Amount</h2>
            
            {/* Suggested Amounts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {suggestedAmounts.map((amount) => (
                <button
                  key={amount}
                  className={`p-3 rounded-lg border-2 font-semibold transition-colors ${
                    selectedAmount === amount * 100
                      ? "border-current text-white"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{
                    borderColor: selectedAmount === amount * 100 ? theme.primary_color : undefined,
                    backgroundColor: selectedAmount === amount * 100 ? theme.primary_color : undefined,
                  }}
                  onClick={() => {
                    setSelectedAmount(amount * 100);
                    setCustomAmount("");
                  }}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter a custom amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Donate Button */}
          <button
            onClick={handleDonate}
            className="w-full py-4 px-6 rounded-lg text-white font-semibold text-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: theme.primary_color }}
          >
            <Heart className="inline-block w-5 h-5 mr-2" />
            Donate{" "}
            {(selectedAmount || (customAmount ? parseFloat(customAmount) * 100 : 0)) > 0 &&
              `$${((selectedAmount || parseFloat(customAmount) * 100) / 100).toFixed(2)}`}
          </button>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Powered by PassItOn</p>
          </div>
        </div>
      </div>
    </div>
  );
}