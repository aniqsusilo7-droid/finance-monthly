import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://drnksbfftgltsopwgfui.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybmtzYmZmdGdsdHNvcHdnZnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNTI5MjMsImV4cCI6MjA4NjYyODkyM30.Rpi_dnLhvvjkYl1lTYf3Ym9gB-zK_5R4N926gcwgJzQ';

// Sanitize URL: remove /rest/v1 or trailing slashes if accidentally included
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

if (!supabaseUrl || !supabaseKey || supabaseKey === 'placeholder-key') {
  console.warn('Supabase credentials missing or invalid. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
