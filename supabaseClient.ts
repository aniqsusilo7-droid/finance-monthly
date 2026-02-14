import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE ---
// Ganti nilai di bawah ini dengan Project URL dan Anon Key dari Dashboard Supabase Anda
// Caranya: Buka Project Settings -> API

const SUPABASE_URL = 'https://drnksbfftgltsopwgfui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybmtzYmZmdGdsdHNvcHdnZnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNTI5MjMsImV4cCI6MjA4NjYyODkyM30.Rpi_dnLhvvjkYl1lTYf3Ym9gB-zK_5R4N926gcwgJzQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
