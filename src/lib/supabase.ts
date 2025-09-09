import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Device {
  id: string;
  particle_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemperatureReading {
  id: string;
  device_id: string;
  particle_id: string;
  temperature: number;
  timestamp: string;
  created_at: string;
}

export interface DeviceWithLatestReading extends Device {
  latest_reading?: TemperatureReading;
}