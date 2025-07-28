"use client";

import { useEffect, useState } from "react";
import { WidgetCustomizer } from "@/components/dashboard/widget-customizer";
import { useOrganization } from "@/hooks/use-organization";
import { supabase } from "@/lib/supabase/client";
import { WidgetConfig } from "@/types/widget.types";
import { useToast } from "@/components/ui/use-toast";

export default function CustomizeWidgetPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [widget, setWidget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchWidget() {
      if (!organization) return;

      try {
        const { data: widgetData } = await supabase
          .from("widgets")
          .select("*")
          .eq("organization_id", organization.id)
          .single();

        if (widgetData) {
          setWidget(widgetData);
        } else {
          // Create a new widget if none exists
          const { data: newWidget, error } = await supabase
            .from("widgets")
            .insert({
              organization_id: organization.id,
              name: `${organization.name} Widget`,
              slug: organization.name.toLowerCase().replace(/\s+/g, "-"),
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
      const { error } = await supabase
        .from("widgets")
        .update({
          config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", widget.id);

      if (error) throw error;

      // Update widget theme
      const { error: themeError } = await supabase
        .from("widget_themes")
        .upsert({
          widget_id: widget.id,
          primary_color: config.theme.primaryColor,
          secondary_color: config.theme.secondaryColor,
          font_family: config.theme.fontFamily,
          border_radius: config.theme.borderRadius,
          custom_css: config.theme.customCss,
        });

      if (themeError) throw themeError;

      // Update causes (handle missing table gracefully)
      const { error: causesDeleteError } = await supabase
        .from("causes")
        .delete()
        .eq("widget_id", widget.id);

      if (causesDeleteError) {
        if (causesDeleteError.code === '42P01') {
          console.log("Causes table doesn't exist yet - skipping causes update");
        } else {
          console.error("Causes delete error:", causesDeleteError);
          console.log("Causes table delete failed, might use different schema:", causesDeleteError);
        }
      } else if (config.causes.length > 0) {
        const { error: causesError } = await supabase.from("causes").insert(
          config.causes.map((cause) => ({
            ...cause,
            widget_id: widget.id,
          }))
        );

        if (causesError) {
          console.error("Causes insert error:", causesError);
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
    } catch (error) {
      console.error("Error saving widget:", error);
      toast({
        title: "Error",
        description: "Failed to save widget configuration",
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
        <h1 className="text-2xl font-bold">Customize Your Widget</h1>
        <p className="text-gray-600 mt-1">
          Design your donation widget to match your brand
        </p>
      </div>

      {widget && (
        <WidgetCustomizer
          initialConfig={widget.config}
          widgetId={widget.id}
          onSave={handleSave}
        />
      )}
    </div>
  );
}