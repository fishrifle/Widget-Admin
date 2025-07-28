"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WidgetCustomizer } from "@/components/dashboard/widget-customizer";
import { useOrganization } from "@/hooks/use-organization";
import { supabase } from "@/lib/supabase/client";
import { WidgetConfig } from "@/types/widget.types";
import { useToast } from "@/components/ui/use-toast";

export default function CustomizeWidgetPage() {
  const router = useRouter();
  const { organization, loading: orgLoading } = useOrganization();
  const [widget, setWidget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchWidget() {
      if (!organization) return;

      console.log("Fetching widget for organization:", organization.id);

      try {
        const { data: widgetData, error: fetchError } = await supabase
          .from("widgets")
          .select("*")
          .eq("organization_id", organization.id)
          .single();

        console.log("Widget fetch result:", { widgetData, fetchError });

        if (fetchError && fetchError.code !== 'PGRST116' && fetchError.code !== 'PGRST204') {
          // PGRST116 is "not found" error, PGRST204 is "Not Acceptable" - both expected for new organizations
          throw fetchError;
        }

        if (widgetData) {
          console.log("Found existing widget:", widgetData);
          setWidget(widgetData);
        } else {
          console.log("No widget found, creating new one...");
          // Create a new widget if none exists
          const baseSlug = organization.name.toLowerCase().replace(/\s+/g, "-");
          const uniqueSlug = `${baseSlug}-${Date.now()}`; // Add timestamp to make it unique
          
          const { data: newWidget, error } = await supabase
            .from("widgets")
            .insert({
              organization_id: organization.id,
              name: `${organization.name} Widget`,
              slug: uniqueSlug,
              config: {},
            })
            .select()
            .single();

          if (error) throw error;
          setWidget(newWidget);
        }
      } catch (error) {
        console.error("Error fetching widget:", error);
        toast({
          title: "Error",
          description: "Failed to load widget configuration",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (!orgLoading && organization) {
      fetchWidget();
    }
  }, [organization, orgLoading, toast]);

  const handleSave = async (config: WidgetConfig) => {
    if (!widget) return;

    try {
      console.log("Saving widget config:", config);

      const { error } = await supabase
        .from("widgets")
        .update({
          config,
        })
        .eq("id", widget.id);

      if (error) {
        console.error("Widget update error:", error);
        throw error;
      }

      // Try to update widget theme (skip if table doesn't exist)
      try {
        const { data: existingTheme } = await supabase
          .from("widget_themes")
          .select("id")
          .eq("widget_id", widget.id)
          .single();

        const themeData = {
          widget_id: widget.id,
          primary_color: config.theme.primaryColor || '#3b82f6',
          secondary_color: config.theme.secondaryColor || '#64748b',
          font_family: config.theme.fontFamily || 'inter',
          border_radius: parseInt(config.theme.borderRadius || '8') || 8,
          custom_css: config.theme.customCss || null,
        };

        console.log("Theme data being saved:", themeData);

        let themeError;
        if (existingTheme) {
          const { error } = await supabase
            .from("widget_themes")
            .update(themeData)
            .eq("id", existingTheme.id);
          themeError = error;
        } else {
          const { error } = await supabase
            .from("widget_themes")
            .insert(themeData);
          themeError = error;
        }

        if (themeError) {
          console.error("Theme update error:", themeError);
          throw themeError;
        }
      } catch (themeError: any) {
        console.warn("Widget themes table not available, skipping theme save:", themeError);
        // Continue without theme saving - theme data is stored in widget.config
      }

      // Update causes - skip if table doesn't exist
      try {
        const { error: deleteError } = await supabase
          .from("causes")
          .delete()
          .eq("widget_id", widget.id);

        if (deleteError) {
          console.error("Causes delete error:", deleteError);
          throw deleteError;
        }
      } catch (deleteError: any) {
        console.warn("Causes table delete failed, might use different schema:", deleteError);
        // Continue anyway - causes might be stored differently
      }

      if (config.causes.length > 0) {
        const validCauses = config.causes.filter(cause => 
          cause.name && String(cause.name).trim().length > 0
        );

        const causesData = validCauses.map((cause) => {
          return {
            widget_id: widget.id,
            name: String(cause.name || '').trim(),
            description: cause.description ? String(cause.description).trim() : null,
            is_active: cause.isActive !== undefined ? Boolean(cause.isActive) : true,
          };
        });

        if (causesData.length > 0) {
          console.log("Inserting causes:", causesData);

          try {
            const { error: causesError } = await supabase
              .from("causes")
              .insert(causesData);

            if (causesError) {
              console.error("Causes insert error:", causesError);
              throw causesError;
            }
          } catch (causesError: any) {
            console.warn("Causes table insert failed, causes stored in widget config only:", causesError);
            // Causes data is preserved in widget.config, so this is not critical
          }
        } else {
          console.log("No valid causes to insert");
        }
      }

      toast({
        title: "Success",
        description: "Widget configuration saved successfully",
      });

      // Activate widget if it's the first save
      if (!widget.is_active) {
        await supabase
          .from("widgets")
          .update({ is_active: true })
          .eq("id", widget.id);
      }
    } catch (error: any) {
      console.error("Error saving widget:", error);
      const errorMessage = error?.message || "Unknown error occurred";
      const errorCode = error?.code || "UNKNOWN";
      
      toast({
        title: "Error",
        description: `Failed to save widget configuration: ${errorMessage} (${errorCode})`,
        variant: "destructive",
      });
    }
  };

  if (loading || orgLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">
          No organization found. Please complete your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customize Your Widget</h1>
            <p className="text-gray-600 mt-1">
              Design your donation widget to match your brand
            </p>
          </div>
          {organization && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Customizing widget for</p>
              <p className="font-semibold text-lg">{organization.name}</p>
            </div>
          )}
        </div>
      </div>

      {widget ? (
        <WidgetCustomizer
          initialConfig={widget.config || {
            theme: {
              primaryColor: "#3b82f6",
              secondaryColor: "#64748b", 
              fontFamily: "inter",
              borderRadius: "8px"
            },
            causes: [],
            settings: {
              showProgressBar: true,
              showDonorList: true,
              allowRecurring: true,
              minimumDonation: 5,
              suggestedAmounts: [10, 25, 50, 100]
            }
          }}
          widgetId={widget.id}
          organizationName={organization?.name}
          onSave={handleSave}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No widget found. Creating one now...</p>
        </div>
      )}
    </div>
  );
}
