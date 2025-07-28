export interface Organization {
  id: string;
  name: string;
  email: string;
  stripeCustomerId?: string | null;
  subscriptionStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  role: "super_admin" | "owner" | "editor";
  organizationId?: string | null;
  createdAt: string;
}

export interface TeamMember extends User {
  lastActive?: string;
  invitedBy?: string;
  invitedAt?: string;
}
