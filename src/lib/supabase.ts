import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const projectName = import.meta.env.VITE_PROJECT_NAME || 'Unknown Project';
const environment = import.meta.env.VITE_ENV || import.meta.env.MODE || 'development';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

if (environment === 'development') {
  const urlDisplay = supabaseUrl.length > 50 ? supabaseUrl.substring(0, 47) + '...' : supabaseUrl;
  console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #10b981');
  console.log(`%c║ 🚀 Supabase Project: ${projectName.padEnd(39)} ║`, 'color: #10b981; font-weight: bold');
  console.log(`%c║ 🌐 URL: ${urlDisplay.padEnd(51)} ║`, 'color: #10b981');
  console.log(`%c║ 🛠️  Environment: ${environment.padEnd(43)} ║`, 'color: #10b981');
  console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #10b981');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          business_name: string | null;
          phone: string | null;
          email: string | null;
          mode: 'student' | 'professional';
          hourly_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          business_name?: string | null;
          phone?: string | null;
          email?: string | null;
          mode?: 'student' | 'professional';
          hourly_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          business_name?: string | null;
          phone?: string | null;
          email?: string | null;
          mode?: 'student' | 'professional';
          hourly_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
