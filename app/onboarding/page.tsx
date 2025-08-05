"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Building, CreditCard, CheckCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function OnboardingPage() {
  const { userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    legalName: "",
    displayName: "",
    email: user?.emailAddresses[0]?.emailAddress || "",
    termsOfServiceUrl: "",
    description: "",
  });

  const steps: OnboardingStep[] = [
    {
      id: "organization",
      title: "Organization Details",
      description: "Tell us about your organization",
      completed: false,
    },
    {
      id: "complete",
      title: "Complete Setup",
      description: "Review and create your account",
      completed: false,
    },
  ];

  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate organization details
      if (!formData.legalName || !formData.displayName || !formData.email) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      await createOrganization();
    }
  };

  const createOrganization = async () => {
    console.log("Starting organization creation...", { userId, formData });
    
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Creating organization via API...");

      const response = await fetch("/api/organizations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.displayName,
          display_name: formData.displayName,
          slug: formData.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
          email: formData.email,
          website: formData.termsOfServiceUrl || "",
          description: formData.description || "",
          user_email: formData.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create organization");
      }

      const result = await response.json();
      console.log("Organization created successfully:", result);

      toast({
        title: "Welcome to PassItOn!",
        description: "Your organization has been created successfully",
      });

      // Redirect to dashboard with delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        title: "Setup Error",
        description: error instanceof Error ? error.message : "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome to PassItOn</h1>
          <p className="text-gray-600">Let&apos;s set up your organization account</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    index < currentStep ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 0 ? (
                <>
                  <Building className="w-5 h-5" />
                  Organization Details
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Setup
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep === 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="legal-name">Legal Name *</Label>
                    <Input
                      id="legal-name"
                      value={formData.legalName}
                      onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
                      placeholder="Your organization's legal name"
                      autoComplete="organization"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Official name for legal documents
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="display-name">Display Name *</Label>
                    <Input
                      id="display-name"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Name shown to donors"
                      autoComplete="organization"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Public-facing organization name
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Contact Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@yourorg.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <Label htmlFor="terms-url">Terms of Service URL</Label>
                  <Input
                    id="terms-url"
                    type="url"
                    value={formData.termsOfServiceUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsOfServiceUrl: e.target.value }))}
                    placeholder="https://yourorg.com/terms (optional)"
                    autoComplete="url"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Organization Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell us about your organization and mission..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Organization Summary</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Legal Name:</strong> {formData.legalName}</p>
                    <p><strong>Display Name:</strong> {formData.displayName}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    {formData.termsOfServiceUrl && (
                      <p><strong>Terms of Service:</strong> {formData.termsOfServiceUrl}</p>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Payment Setup</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        After creating your account, you&apos;ll be able to connect your Stripe account 
                        to start accepting donations. You maintain full control of your payments 
                        and donor data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Next Steps:</strong> Once your account is created, you&apos;ll be able to:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Connect your Stripe account for payment processing</li>
                    <li>Create and manage fundraising initiatives</li>
                    <li>Configure donation widgets</li>
                    <li>Invite team members to help manage your account</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
                  "Creating Account..."
                ) : currentStep === steps.length - 1 ? (
                  "Create Organization"
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            By creating an account, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}