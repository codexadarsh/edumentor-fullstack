import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // keep session in localStorage
    autoRefreshToken: true, // refresh tokens automatically
    detectSessionInUrl: true, // needed for OAuth (safe to keep on)
    // storageKey: "edumentor-auth", // optional: custom key if you want
  },
});
