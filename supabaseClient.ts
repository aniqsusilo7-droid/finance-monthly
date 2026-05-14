import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://drnksbfftgltsopwgfui.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybmtzYmZmdGdsdHNvcHdnZnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNTI5MjMsImV4cCI6MjA4NjYyODkyM30.Rpi_dnLhvvjkYl1lTYf3Ym9gB-zK_5R4N926gcwgJzQ';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing. Please check your .env file.');
}

// Fallback included to avoid initialization crash on preview
export const supabase = createClient(supabaseUrl, supabaseKey);
