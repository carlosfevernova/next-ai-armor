import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Browser client — safe to use from Client Components. Uses the anon key.
 * RLS policies decide what the user can read.
 */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Server client bound to Next's cookie store. Use this in Server Components,
 * Server Actions, and route handlers. Cookies flow user → session → RLS.
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(newCookies: { name: string; value: string; options: CookieOptions }[]) {
          try {
            for (const { name, value, options } of newCookies) {
              cookieStore.set(name, value, options);
            }
          } catch {
            /* Called from a Server Component — cookies are read-only there. */
          }
        },
      },
    },
  );
}

/**
 * Service-role client — only use in route handlers or server actions where you
 * intentionally want to bypass RLS (e.g. after a Stripe webhook confirms a
 * payment). Never expose this via a client bundle.
 */
export function createSupabaseServiceRole() {
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
