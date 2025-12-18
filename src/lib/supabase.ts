
import { createClient } from '@supabase/supabase-js';

// Fallback to the provided credentials if env vars are missing
// This ensures the app doesn't crash on startup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bbznayczvwxzvrkukkyv.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem5heWN6dnd4enZya3Vra3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjUwNjIsImV4cCI6MjA4MTY0MTA2Mn0.hV6TxglDvbQpr_pu084ChGYv_AisE3klVlemDA5MEsA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
