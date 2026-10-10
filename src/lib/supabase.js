import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nzgsifgxxqdtpvbycwrx.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z3NpZmd4eHFkdHB2Ynljd3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMjk1OTcsImV4cCI6MjEwNjcwNTU5N30.f6nuwucbxdptGV5ut5KbOFr-RuBDjrX-JND7IRyRWYE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
