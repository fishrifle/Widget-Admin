"use client";

import { useState } from "react";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { WidgetPreview } from "./widget-preview";
import { CauseManager } from "./cause-manager";
import { WidgetConfig } from "@/types/widget.types";
import { Save, Eye, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const FONT_OPTIONS = [
  { value: "inter", label: "Inter", fontFamily: "Inter" },
  { value: "roboto", label: "Roboto", fontFamily: "Roboto" },
  { value: "opensans", label: "Open Sans", fontFamily: "Open Sans" },
  { value: "montserrat", label: "Montserrat", fontFamily: "Montserrat" },
  { value: "lato", label: "Lato", fontFamily: "Lato" },
  { value: "poppins", label: "Poppins", fontFamily: "Poppins" },
  { value: "playfair", label: "Playfair Display", fontFamily: "Playfair Display" },
  { value: "sourcesans", label: "Source Sans Pro", fontFamily: "Source Sans Pro" },
  { value: "nunito", label: "Nunito", fontFamily: "Nunito" },
  { value: "raleway", label: "Raleway", fontFamily: "Raleway" },
  { value: "merriweather", label: "Merriweather", fontFamily: "Merriweather" },
  { value: "oswald", label: "Oswald", fontFamily: "Oswald" },
  { value: "ubuntu", label: "Ubuntu", fontFamily: "Ubuntu" },
  { value: "firasans", label: "Fira Sans", fontFamily: "Fira Sans" },
  { value: "worksans", label: "Work Sans", fontFamily: "Work Sans" },
  { value: "crimson", label: "Crimson Text", fontFamily: "Crimson Text" },
  { value: "librebaskerville", label: "Libre Baskerville", fontFamily: "Libre Baskerville" },
  { value: "dancing", label: "Dancing Script", fontFamily: "Dancing Script" },
  { value: "quicksand", label: "Quicksand", fontFamily: "Quicksand" },
  { value: "cabin", label: "Cabin", fontFamily: "Cabin" },
  { value: "dosis", label: "Dosis", fontFamily: "Dosis" },
  { value: "rubik", label: "Rubik", fontFamily: "Rubik" },
  { value: "ptsans", label: "PT Sans", fontFamily: "PT Sans" },
  { value: "karla", label: "Karla", fontFamily: "Karla" },
  { value: "librefranklin", label: "Libre Franklin", fontFamily: "Libre Franklin" },
  { value: "barlow", label: "Barlow", fontFamily: "Barlow" },
  { value: "robotoslab", label: "Roboto Slab", fontFamily: "Roboto Slab" },
  { value: "josefin", label: "Josefin Sans", fontFamily: "Josefin Sans" },
  { value: "abril", label: "Abril Fatface", fontFamily: "Abril Fatface" },
  { value: "pacifico", label: "Pacifico", fontFamily: "Pacifico" },
  { value: "comfortaa", label: "Comfortaa", fontFamily: "Comfortaa" },
  { value: "archivo", label: "Archivo", fontFamily: "Archivo" },
  { value: "bitter", label: "Bitter", fontFamily: "Bitter" },
  { value: "exo2", label: "Exo 2", fontFamily: "Exo 2" },
  { value: "titillium", label: "Titillium Web", fontFamily: "Titillium Web" },
  { value: "noto", label: "Noto Sans", fontFamily: "Noto Sans" },
  { value: "ibmplex", label: "IBM Plex Sans", fontFamily: "IBM Plex Sans" },
  { value: "zilla", label: "Zilla Slab", fontFamily: "Zilla Slab" },
  { value: "arvo", label: "Arvo", fontFamily: "Arvo" },
  { value: "robotocondensed", label: "Roboto Condensed", fontFamily: "Roboto Condensed" },
  { value: "indie", label: "Indie Flower", fontFamily: "Indie Flower" },
  { value: "shadows", label: "Shadows Into Light", fontFamily: "Shadows Into Light" },
];

const PRESET_THEMES = [
  { name: "Ocean Blue", primary: "#0066cc", secondary: "#e6f2ff", background: "#ffffff", headerColor: "#0066cc" },
  { name: "Forest Green", primary: "#228b22", secondary: "#e6f5e6", background: "#ffffff", headerColor: "#228b22" },
  { name: "Sunset Orange", primary: "#ff6347", secondary: "#ffe6e1", background: "#ffffff", headerColor: "#ff6347" },
  { name: "Royal Purple", primary: "#6a0dad", secondary: "#f0e6ff", background: "#ffffff", headerColor: "#6a0dad" },
  { name: "Minimal Black", primary: "#000000", secondary: "#f5f5f5", background: "#ffffff", headerColor: "#000000" },
  { name: "Modern Teal", primary: "#14b8a6", secondary: "#ccfbf1", background: "#ffffff", headerColor: "#14b8a6" },
  { name: "Warm Red", primary: "#dc2626", secondary: "#fecaca", background: "#ffffff", headerColor: "#dc2626" },
  { name: "Deep Indigo", primary: "#4338ca", secondary: "#c7d2fe", background: "#ffffff", headerColor: "#4338ca" },
  { name: "Emerald Green", primary: "#059669", secondary: "#a7f3d0", background: "#ffffff", headerColor: "#059669" },
  { name: "Rose Pink", primary: "#e11d48", secondary: "#fecdd3", background: "#ffffff", headerColor: "#e11d48" },
  { name: "Dark Mode", primary: "#3b82f6", secondary: "#1e293b", background: "#0f172a", headerColor: "#ffffff" },
  { name: "Cream & Gold", primary: "#d97706", secondary: "#fef3c7", background: "#fffbeb", headerColor: "#92400e" },
];

interface WidgetCustomizerProps {
  initialConfig?: WidgetConfig;
  widgetId?: string;
  organizationName?: string;
  onSave: (config: WidgetConfig) => Promise<void>;
}

export function WidgetCustomizer({
  initialConfig,
  widgetId,
  organizationName,
  onSave,
}: WidgetCustomizerProps) {
  const { toast } = useToast();
  const getDefaultConfig = (): WidgetConfig => ({
    theme: {
      primaryColor: "#2563eb", // blue-600 to match actual widget
      secondaryColor: "#7c3aed", // purple-600 to match actual widget  
      fontFamily: "inter",
      borderRadius: "12px", // rounded-xl to match actual widget
      customCss: "",
      headerText: "PassItOn",
      headerColor: "#2563eb",
      headerAlignment: "center",
      buttonTextColor: "#ffffff",
      backgroundColor: "#ffffff",
    },
    causes: [],
    settings: {
      showProgressBar: true,
      showDonorList: false,
      allowRecurring: true,
      minimumDonation: 1,
      suggestedAmounts: [10, 30, 60, 100, 200],
      showCoverFees: true,
      defaultFrequency: "one-time",
    },
  });

  const [config, setConfig] = useState<WidgetConfig>(() => {
    if (!initialConfig || !initialConfig.theme) {
      return getDefaultConfig();
    }
    return {
      theme: {
        ...getDefaultConfig().theme,
        ...initialConfig.theme,
      },
      causes: initialConfig.causes || [],
      settings: {
        ...getDefaultConfig().settings,
        ...initialConfig.settings,
      },
    };
  });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop"
  );

  const updateTheme = (key: keyof typeof config.theme, value: string) => {
    setConfig((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value,
      },
    }));
  };

  const updateSettings = (key: keyof typeof config.settings, value: any) => {
    setConfig((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customization Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Widget Customization</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="theme" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="causes">Causes</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="theme" className="space-y-4">
                {/* Preset Themes */}
                <div>
                  <Label className="mb-2">Preset Themes</Label>
                  <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                    {PRESET_THEMES.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => {
                          updateTheme("primaryColor", theme.primary);
                          updateTheme("secondaryColor", theme.secondary);
                          updateTheme("backgroundColor", theme.background);
                          updateTheme("headerColor", theme.headerColor);
                        }}
                        className="p-2 border rounded-lg hover:border-gray-400 transition-colors"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: theme.secondary }}
                          />
                          <div
                            className="w-3 h-3 rounded border"
                            style={{ backgroundColor: theme.background }}
                          />
                        </div>
                        <p className="text-xs">{theme.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary-color">Primary Color (Buttons)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="primary-color"
                        type="color"
                        value={config.theme.primaryColor}
                        onChange={(e) =>
                          updateTheme("primaryColor", e.target.value)
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={config.theme.primaryColor}
                        onChange={(e) =>
                          updateTheme("primaryColor", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondary-color">Secondary Color (Monthly Button)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={config.theme.secondaryColor}
                        onChange={(e) =>
                          updateTheme("secondaryColor", e.target.value)
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={config.theme.secondaryColor}
                        onChange={(e) =>
                          updateTheme("secondaryColor", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="header-color">Header Text Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="header-color"
                        type="color"
                        value={config.theme.headerColor}
                        onChange={(e) =>
                          updateTheme("headerColor", e.target.value)
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={config.theme.headerColor}
                        onChange={(e) =>
                          updateTheme("headerColor", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="background-color">Background Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="background-color"
                        type="color"
                        value={config.theme.backgroundColor}
                        onChange={(e) =>
                          updateTheme("backgroundColor", e.target.value)
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={config.theme.backgroundColor}
                        onChange={(e) =>
                          updateTheme("backgroundColor", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Header Text Customization */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="header-text">Header Text</Label>
                    <Input
                      id="header-text"
                      type="text"
                      value={config.theme.headerText}
                      onChange={(e) => updateTheme("headerText", e.target.value)}
                      placeholder="PassItOn"
                    />
                  </div>
                  <div>
                    <Label htmlFor="header-alignment">Header Alignment</Label>
                    <Select
                      value={config.theme.headerAlignment}
                      onValueChange={(value) => updateTheme("headerAlignment", value)}
                    >
                      <SelectTrigger id="header-alignment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Font Selection */}
                <div>
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select
                    value={config.theme.fontFamily}
                    onValueChange={(value) => updateTheme("fontFamily", value)}
                  >
                    <SelectTrigger id="font-family">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem 
                          key={font.value} 
                          value={font.value}
                          className="font-normal"
                          style={{ fontFamily: font.fontFamily }}
                        >
                          <span style={{ fontFamily: font.fontFamily }}>
                            {font.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Border Radius */}
                <div>
                  <Label htmlFor="border-radius">Border Radius</Label>
                  <Select
                    value={config.theme.borderRadius}
                    onValueChange={(value) =>
                      updateTheme("borderRadius", value)
                    }
                  >
                    <SelectTrigger id="border-radius">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0px">None</SelectItem>
                      <SelectItem value="4px">Small</SelectItem>
                      <SelectItem value="8px">Medium</SelectItem>
                      <SelectItem value="12px">Large</SelectItem>
                      <SelectItem value="16px">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom CSS */}
                <div>
                  <Label htmlFor="custom-css">Custom CSS (Advanced)</Label>
                  <Textarea
                    id="custom-css"
                    value={config.theme.customCss}
                    onChange={(e) => updateTheme("customCss", e.target.value)}
                    placeholder=".widget-container { /* your styles */ }"
                    className="font-mono text-sm"
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="causes">
                <CauseManager
                  causes={config.causes}
                  onChange={(causes) =>
                    setConfig((prev) => ({ ...prev, causes }))
                  }
                />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-progress">Show Progress Bar</Label>
                  <Switch
                    id="show-progress"
                    checked={config.settings.showProgressBar}
                    onCheckedChange={(checked) =>
                      updateSettings("showProgressBar", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-donors">Show Recent Donors</Label>
                  <Switch
                    id="show-donors"
                    checked={config.settings.showDonorList}
                    onCheckedChange={(checked) =>
                      updateSettings("showDonorList", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allow-recurring">
                    Allow Recurring Donations
                  </Label>
                  <Switch
                    id="allow-recurring"
                    checked={config.settings.allowRecurring}
                    onCheckedChange={(checked) =>
                      updateSettings("allowRecurring", checked)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="min-donation">
                    Minimum Donation Amount ($)
                  </Label>
                  <Input
                    id="min-donation"
                    type="number"
                    min="1"
                    step="1"
                    value={config.settings.minimumDonation}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numeric input
                      if (value === '' || /^\d+$/.test(value)) {
                        const numValue = value === '' ? 1 : Math.max(1, parseInt(value, 10));
                        updateSettings("minimumDonation", numValue);
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure minimum value of 1 on blur
                      const value = parseInt(e.target.value, 10);
                      if (isNaN(value) || value < 1) {
                        updateSettings("minimumDonation", 1);
                      }
                    }}
                  />
                </div>

                <div>
                  <Label>Suggested Donation Amounts ($)</Label>
                  <div className="grid grid-cols-5 gap-2 mt-1">
                    {config.settings.suggestedAmounts.map((amount, index) => (
                      <Input
                        key={index}
                        type="number"
                        min="1"
                        step="1"
                        value={amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow numeric input
                          if (value === '' || /^\d+$/.test(value)) {
                            const newAmounts = [...config.settings.suggestedAmounts];
                            newAmounts[index] = value === '' ? 1 : Math.max(1, parseInt(value, 10));
                            updateSettings("suggestedAmounts", newAmounts);
                          }
                        }}
                        onBlur={(e) => {
                          // Ensure minimum value of 1 on blur
                          const value = parseInt(e.target.value, 10);
                          if (isNaN(value) || value < 1) {
                            const newAmounts = [...config.settings.suggestedAmounts];
                            newAmounts[index] = 1;
                            updateSettings("suggestedAmounts", newAmounts);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-cover-fees">Show Cover Fees Option</Label>
                  <Switch
                    id="show-cover-fees"
                    checked={config.settings.showCoverFees}
                    onCheckedChange={(checked) =>
                      updateSettings("showCoverFees", checked)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="default-frequency">Default Frequency</Label>
                  <Select
                    value={config.settings.defaultFrequency}
                    onValueChange={(value) => updateSettings("defaultFrequency", value)}
                  >
                    <SelectTrigger id="default-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={() => {
              if (confirm("Are you sure you want to reset all customizations to default? This action cannot be undone.")) {
                setConfig(getDefaultConfig());
                toast({
                  title: "Reset Successful",
                  description: "Widget customization has been reset to default values.",
                });
              }
            }}
            variant="outline"
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Live Preview</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={previewMode === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Desktop
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Mobile
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <WidgetPreview config={config} mode={previewMode} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
