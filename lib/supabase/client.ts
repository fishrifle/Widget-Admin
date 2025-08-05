// lib/supabaseClient.ts
import { createClient as createClient } from "@supabase/supabase-js";


// these env vars must exist in .env.local
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing Supabase environment variables. Please check your .env.local file.");
}

// create and export a single client instance
export const supabase = createClient(url, anonKey);
 
export { createClient }