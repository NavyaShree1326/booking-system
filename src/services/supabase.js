// src/services/supabase.js
{/*import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
*/}

// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Use sessionStorage so session persists across reloads but is cleared when the tab/window is closed
const sessionStorageAdapter = {
  getItem: (key) => {
    try { return sessionStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, value) => {
    try { sessionStorage.setItem(key, value); } catch {}
  },
  removeItem: (key) => {
    try { sessionStorage.removeItem(key); } catch {}
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true, // keep session across reloads
    detectSessionInUrl: true,
    storage: sessionStorageAdapter
  }
});