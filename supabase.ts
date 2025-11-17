// supabase.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ✅ Your Supabase project URL and API key
const SUPABASE_URL = 'https://cvdvqxxgbjvoplslnewj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZHZxeHhnYmp2b3Bsc2xuZXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjI1MDEsImV4cCI6MjA3NjUzODUwMX0.jqfoAXIYVVDTfMPNvHGmbEOv32dCyf4V9CkxKQ7CPQY';

// ✅ Create Supabase client with React Native AsyncStorage for session handling
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
