import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Type definitions for your medicine_prescriptions table
export interface MedicinePrescription {
  id: string;
  name: string;
  email: string;
  medicine: {
    patient_name: string;
    doctor_name: string;
    room_id: string;
    consultation_date: string;
    consultation_time: string;
    total_medicines: number;
    medicines: Array<{
      id: number;
      medicine_name: string;
      dosage: string;
      frequency: string;
      full_prescription: string;
      prescribed_at: string;
    }>;
    prescription_notes: string;
    status: string;
  };
  created_at: string;
}

// Helper function to test connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('medicine_prescriptions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};