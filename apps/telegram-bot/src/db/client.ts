import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"],
  );
}

export function isTestEnv(): boolean {
  return process.env["VITEST"] === "true" || process.env["NODE_ENV"] === "test";
}

export function shouldBypassSupabase(): boolean {
  return !hasSupabaseConfig() && isTestEnv();
}

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env["SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}
