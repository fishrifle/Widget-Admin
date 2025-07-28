import { Database } from "./database.types";

// Initiative types - using any for now since initiatives table doesn't exist yet
export type Initiative = any;
export type InitiativeInsert = any;
export type InitiativeUpdate = any;

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