export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          email: string;
          stripe_customer_id: string | null;
          subscription_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          stripe_customer_id?: string | null;
          subscription_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          stripe_customer_id?: string | null;
          subscription_status?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          role: "super_admin" | "owner" | "editor";
          organization_id: string | null;
          created_at: string;
          status?: "pending" | "accepted";
          invited_at?: string;
          accepted_at?: string;
          first_name?: string;
          last_name?: string;
          invitation_token?: string;
        };
        Insert: {
          id: string;
          email: string;
          role: "super_admin" | "owner" | "editor";
          organization_id?: string | null;
          created_at?: string;
          status?: "pending" | "accepted";
          invited_at?: string;
          accepted_at?: string;
          first_name?: string;
          last_name?: string;
          invitation_token?: string;
        };
        Update: {
          email?: string;
          role?: "super_admin" | "owner" | "editor";
          organization_id?: string | null;
          status?: "pending" | "accepted";
          accepted_at?: string;
          first_name?: string;
          last_name?: string;
          invitation_token?: string;
        };
      };
      widgets: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          config: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          config?: Json;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      widget_themes: {
        Row: {
          id: string;
          widget_id: string;
          primary_color: string;
          secondary_color: string;
          font_family: string;
          border_radius: string;
          custom_css: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          widget_id: string;
          primary_color?: string;
          secondary_color?: string;
          font_family?: string;
          border_radius?: string;
          custom_css?: string | null;
          created_at?: string;
        };
        Update: {
          primary_color?: string;
          secondary_color?: string;
          font_family?: string;
          border_radius?: string;
          custom_css?: string | null;
        };
      };
      causes: {
        Row: {
          id: string;
          widget_id: string;
          name: string;
          description: string | null;
          goal_amount: number | null;
          raised_amount: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          widget_id: string;
          name: string;
          description?: string | null;
          goal_amount?: number | null;
          raised_amount?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          goal_amount?: number | null;
          raised_amount?: number;
          is_active?: boolean;
        };
      };
      donations: {
        Row: {
          id: string;
          widget_id: string;
          cause_id: string | null;
          stripe_payment_intent_id: string | null;
          amount: number;
          currency: string;
          donor_email: string | null;
          donor_name: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          widget_id: string;
          cause_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount: number;
          currency?: string;
          donor_email?: string | null;
          donor_name?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          cause_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount?: number;
          currency?: string;
          donor_email?: string | null;
          donor_name?: string | null;
          status?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          stripe_invoice_id: string | null;
          amount: number;
          currency: string;
          status: string;
          pdf_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          stripe_invoice_id?: string | null;
          amount: number;
          currency?: string;
          status?: string;
          pdf_url?: string | null;
          created_at?: string;
        };
        Update: {
          stripe_invoice_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          pdf_url?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
