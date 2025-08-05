"use client";

import { useEffect, useState, useCallback, Suspense } from "react";

export const dynamic = 'force-dynamic';
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const token = searchParams?.get("token");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const validateInvitation = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("invitation_token", token)
        .eq("status", "pending")
        .single();

      if (error || !data) {
        setError("Invalid or expired invitation");
      } else {
        setInvitation(data);
      }
    } catch (err) {
      setError("Failed to validate invitation");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    validateInvitation();
  }, [token, validateInvitation]);

  const acceptInvitation = async () => {
    if (!invitation || !firstName.trim() || !lastName.trim()) return;

    setAccepting(true);
    try {
      // Update user record to accepted status
      const { error } = await supabase
        .from("users")
        .update({
          status: "accepted",
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          invitation_token: null, // Clear the token
          accepted_at: new Date().toISOString(),
        })
        .eq("invitation_token", token);

      if (error) throw error;

      toast({
        title: "Invitation Accepted!",
        description: "Welcome to the team! You can now access the dashboard.",
      });

      // Redirect to sign-in page
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    } catch (err) {
      console.error("Accept invitation error:", err);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/")} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle>Accept Your Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-gray-600">
            <p>You&apos;ve been invited to join</p>
            <p className="font-semibold text-lg text-blue-600">
              {invitation?.organizations?.display_name || invitation?.organizations?.name}
            </p>
            <p className="text-sm">as a <span className="font-medium capitalize">{invitation?.role}</span></p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                required
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
              />
            </div>

            <Button
              onClick={acceptInvitation}
              disabled={accepting || !firstName.trim() || !lastName.trim()}
              className="w-full"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-sm"
            >
              Decline Invitation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}