/**
 * Supabase Client Configuration
 * 
 * Connects to Supabase for leaderboard storage.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rmutcncnppyzirywzozc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_K-KApBISA6IiiNE9CCnjNA_3qhuNg8k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
