"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Mail, Shield, User, Trash2, Users } from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  status?: "pending" | "accepted";
  invited_at?: string;
}

export default function TeamPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();
  const [deletingMember, setDeletingMember] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamMembers() {
      if (!organization) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setMembers(data || []);
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast({
          title: "Error",
          description: "Failed to load team members",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (!orgLoading && organization) {
      fetchTeamMembers();
    }
  }, [organization, orgLoading, toast]);

  const handleInvite = async () => {
    if (!inviteEmail || !organization) return;

    setInviting(true);
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          organizationId: organization.id,
          organizationName: (organization as any).display_name || organization.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send invitation");
      }

      // Enhanced success message based on API response
      const isResend = result.action === "updated_existing";
      toast({
        title: isResend ? "Invitation Resent" : "Invitation Sent",
        description: isResend 
          ? `New invitation email sent to ${inviteEmail}. Previous invitation has been updated.`
          : `Invitation email sent to ${inviteEmail} with enhanced tracking. They will receive an email to accept the invitation.`,
      });

      setInviteEmail("");
      
      // Force refresh members list with cache bypass
      setTimeout(async () => {
        console.log("Force refreshing team members list...");
        const { data, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false });

        if (!fetchError && data) {
          console.log("Refreshed team data:", data.length, "members");
          setMembers(data);
        } else {
          console.error("Failed to refresh team data:", fetchError);
        }
      }, 1000); // Wait 1 second for database consistency
    } catch (error) {
      console.error("Error inviting member:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvite = async (email: string, role: string) => {
    if (!organization) return;

    setInviting(true);
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
          organizationId: organization.id,
          organizationName: (organization as any).display_name || organization.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to resend invitation");
      }

      toast({
        title: "Invitation Resent",
        description: `A new invitation has been sent to ${email}`,
      });

      // Refresh members list
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (!fetchError && data) {
        setMembers(data);
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) {
      return;
    }

    setDeletingMember(memberId);
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member Removed",
        description: `${memberEmail} has been removed from the team.`,
      });

      // Refresh members list
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("organization_id", organization?.id)
        .order("created_at", { ascending: false });

      if (!fetchError && data) {
        setMembers(data);
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    } finally {
      setDeletingMember(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "member":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Shield className="w-4 h-4" />;
      case "admin":
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getStatusBadgeColor = (member: TeamMember) => {
    // Use database status field for accurate status detection
    switch (member.status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        // Legacy users without status field - check if they have invited_ prefix
        const isInvited = member.id.startsWith("invited_");
        return isInvited 
          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
          : "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getStatusIcon = (member: TeamMember) => {
    // Use database status field for accurate icon selection
    switch (member.status) {
      case "pending":
        return <Mail className="w-3 h-3" />;
      case "accepted":
        return <User className="w-3 h-3" />;
      default:
        // Legacy users without status field - check if they have invited_ prefix
        const isInvited = member.id.startsWith("invited_");
        return isInvited ? <Mail className="w-3 h-3" /> : <User className="w-3 h-3" />;
    }
  };

  if (loading || orgLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your organization&apos;s team members and permissions
            </p>
          </div>
          {organization && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Managing team for</p>
              <p className="font-semibold text-lg">{(organization as any).display_name || organization.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite New Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="editor">Editor</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                {inviting ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No team members yet. Invite someone to get started!</p>
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {member.first_name && member.last_name
                            ? `${member.first_name} ${member.last_name}`
                            : member.email}
                        </p>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {getRoleIcon(member.role)}
                          <span className="ml-1 capitalize">{member.role}</span>
                        </Badge>
                        <Badge className={`border ${getStatusBadgeColor(member)}`}>
                          {getStatusIcon(member)}
                          <span className="ml-1 capitalize">
                            {member.status === "pending" ? "Pending" : 
                             member.status === "accepted" ? "Active" :
                             member.id.startsWith("invited_") ? "Invited" : "Active"}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      {member.status === "pending" && member.invited_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Invited {new Date(member.invited_at).toLocaleDateString()} at{' '}
                          {new Date(member.invited_at).toLocaleTimeString()}
                        </p>
                      )}
                      {member.status === "accepted" && member.accepted_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Joined {new Date(member.accepted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {(member.status === "pending" || member.id.startsWith("invited_")) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResendInvite(member.email, member.role)}
                        disabled={inviting}
                        title="Resend invitation email"
                      >
                        {inviting ? (
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    {member.role !== "owner" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteMember(member.id, member.email)}
                        disabled={deletingMember === member.id}
                      >
                        {deletingMember === member.id ? (
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}