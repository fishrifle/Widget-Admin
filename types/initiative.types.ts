import { Database } from "./database.types";

export type Initiative = Database["public"]["Tables"]["initiatives"]["Row"];
export type InitiativeInsert = Database["public"]["Tables"]["initiatives"]["Insert"];
export type InitiativeUpdate = Database["public"]["Tables"]["initiatives"]["Update"];

export interface InitiativeConfig {
  name: string;
  description?: string;
  imageUrl?: string;
  goalAmount?: number;
  suggestedAmounts: number[]; // amounts in cents
  isActive: boolean;
}

export interface InitiativeWithStats extends Initiative {
  donationsCount: number;
  progressPercentage: number;
}