import { WidgetConfig } from "@/types/widget.types";
import { Heart, TrendingUp, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";

interface WidgetPreviewProps {
  config: WidgetConfig;
  mode: "desktop" | "mobile";
}

export function WidgetPreview({ config, mode }: WidgetPreviewProps) {
  const { theme, causes, settings } = config;
  const activeCauses = causes.filter((c) => c.isActive);
  const [showColorGuide, setShowColorGuide] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<"one-time" | "monthly" | "yearly">(settings.defaultFrequency);

  // Update selected frequency when default frequency changes
  useEffect(() => {
    setSelectedFrequency(settings.defaultFrequency);
  }, [settings.defaultFrequency]);

  return (
    <div
      className={`bg-gray-100 p-4 rounded-lg ${
        mode === "mobile" ? "max-w-xs mx-auto" : "max-w-xs mx-auto"
      }`}
    >
      {/* Color Guide Toggle */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowColorGuide(!showColorGuide)}
          className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
        >
          {showColorGuide ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showColorGuide ? "Hide" : "Show"} Color Guide
        </button>
      </div>

      <div
        className="p-3 border border-gray-200 shadow-lg relative"
        style={{
          borderRadius: theme.borderRadius,
          fontFamily: theme.fontFamily,
          backgroundColor: theme.backgroundColor,
        }}
      >
        <style>{theme.customCss}</style>
        
        {/* Background Color Guide */}
        {showColorGuide && (
          <div className="absolute top-2 left-2 bg-green-300 text-xs px-2 py-1 rounded shadow-sm pointer-events-none">
            Background Color
          </div>
        )}

        <div className="widget-container space-y-2 text-xs">
          {/* Header - matching new widget design */}
          <div className="text-center relative">
            <h1 
              className={`text-lg font-bold mb-1 text-${theme.headerAlignment}`} 
              style={{ color: theme.headerColor }}
            >
              {theme.headerText}
            </h1>
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Choose amount</h2>
            </div>
            {showColorGuide && (
              <div className="absolute -top-1 -right-1 bg-yellow-300 text-xs px-2 py-1 rounded shadow-sm pointer-events-none">
                Header Color
              </div>
            )}
          </div>

          {/* Frequency Toggle - matching new widget design */}
          {settings.allowRecurring && (
            <>
              <div className="flex bg-gray-100 rounded p-0.5">
                <button
                  onClick={() => setSelectedFrequency("one-time")}
                  className={`flex-1 py-1 px-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                    selectedFrequency === "one-time"
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                  style={{
                    backgroundColor: selectedFrequency === "one-time" ? theme.primaryColor : "transparent"
                  }}
                >
                  One-time
                </button>
                <button
                  onClick={() => setSelectedFrequency("monthly")}
                  className={`flex-1 py-1 px-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                    selectedFrequency === "monthly"
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                  style={{
                    backgroundColor: selectedFrequency === "monthly" ? theme.primaryColor : "transparent"
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedFrequency("yearly")}
                  className={`flex-1 py-1 px-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                    selectedFrequency === "yearly"
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                  style={{
                    backgroundColor: selectedFrequency === "yearly" ? theme.primaryColor : "transparent"
                  }}
                >
                  Yearly
                </button>
              </div>
              {/* Recurring Notice - Secondary Color Usage */}
              {(selectedFrequency === "monthly" || selectedFrequency === "yearly") && (
                <div className="relative">
                  <div 
                    className="text-xs border rounded-md p-2"
                    style={{ 
                      color: theme.secondaryColor,
                      backgroundColor: theme.secondaryColor + "20",
                      borderColor: theme.secondaryColor + "60"
                    }}
                  >
                    This will be a <strong>{selectedFrequency} recurring charge</strong>. You can cancel at any time.
                  </div>
                  {showColorGuide && (
                    <div className="absolute -top-1 -right-1 bg-purple-300 text-xs px-2 py-1 rounded shadow-sm pointer-events-none">
                      Secondary Color
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Preset Amount Grid - matching new widget design */}
          <div className="grid grid-cols-2 gap-1">
            {settings.suggestedAmounts.map((amount, index) => {
              const descriptions = [
                "Empower Life Skills",
                "Can Strengthen Career Development", 
                "Can Empower A Participant's Pathway",
                "Unlock's Support for Families",
                "Comprehensive Career Support",
                "Transform Lives with Tech Skills"
              ];
              return (
                <button
                  key={amount}
                  className="p-2 rounded border text-left transition-all border-gray-200 bg-gray-50"
                  style={{
                    borderRadius: theme.borderRadius,
                  }}
                >
                  <div className="font-bold text-sm text-gray-900">${amount}</div>
                  <div className="text-xs text-gray-600 leading-tight">
                    {descriptions[index] || "Support Our Mission"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Other Amount Button */}
          <div className="space-y-1">
            <button
              className="w-full p-2 rounded border text-left border-gray-200 bg-gray-50"
              style={{
                borderRadius: theme.borderRadius,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-600">$</span>
                  <span className="text-sm font-medium text-gray-600">Other</span>
                </div>
                <span className="text-xs text-gray-500">USD</span>
              </div>
            </button>
          </div>

          {/* Designate your gift - matching new widget design */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              Designate your gift
            </label>
            <select
              className="w-full p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              style={{
                borderRadius: theme.borderRadius
              }}
            >
              {activeCauses.length > 0 ? (
                activeCauses.map((cause) => (
                  <option key={cause.id}>{cause.name}</option>
                ))
              ) : (
                <>
                  <option>General Persevere Support</option>
                  <option>Sponsor a Dev</option>
                  <option>Tech Alliance</option>
                  <option>The Greatest Need</option>
                  <option>Unlock Potential</option>
                  <option>Epic Youth</option>
                  <option>Tennessee Community Programs</option>
                  <option>Canvas Training Hub</option>
                </>
              )}
            </select>
          </div>

          {/* Optional Checkboxes - matching new widget design */}
          <div className="space-y-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-3 h-3 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-xs text-gray-700">Add note/comment</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-3 h-3 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-xs text-gray-700">Give in honor/memory</span>
            </label>

            {settings.showCoverFees && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-xs text-gray-700">Cover payment fees (3%)</span>
              </label>
            )}
          </div>

          {/* Continue Button - matching new widget design */}
          <div className="relative">
            <button
              className="w-full py-2 px-4 text-xs rounded font-medium text-white transition-colors"
              style={{
                backgroundColor: theme.primaryColor,
                borderRadius: theme.borderRadius,
              }}
            >
              Continue
            </button>
            {showColorGuide && (
              <div className="absolute -top-1 -right-1 bg-blue-300 text-xs px-2 py-1 rounded shadow-sm pointer-events-none">
                Primary Color
              </div>
            )}
          </div>

          {/* Copyright Footer - matching new widget design */}
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Copyright 2025 Banyan Labs
            </p>
          </div>

          {settings.showDonorList && (
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-xs font-semibold mb-2 text-gray-600">
                Recent Donors
              </h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Anonymous</span>
                  <span>$50</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>John D.</span>
                  <span>$100</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Sarah M.</span>
                  <span>$25</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
