declare module "@supabase/supabase-js" {
  export interface SupabaseClient {
    from(table: string): any;
  }

  export function createClient(
    url: string,
    key: string,
    options?: Record<string, unknown>,
  ): SupabaseClient;
}
