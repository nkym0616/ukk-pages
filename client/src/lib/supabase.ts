import { createClient } from "@supabase/supabase-js";

// A publishable key is designed to run in the browser. Data protection is
// enforced by Supabase Auth, grants, and RLS policies in the database.
const supabaseUrl = "https://secyilbxewnlanvvgvyj.supabase.co";
const supabasePublishableKey = "sb_publishable_qmvy5SufPfBBaEAxxxWnHQ_lKv9PbL5";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
