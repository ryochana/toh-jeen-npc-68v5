import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ประเภทข้อมูลการจองโต๊ะ
export interface TableBooking {
  id?: number
  table_number: number
  guest_name: string
  phone_number: string
  party_size: number
  booking_date: string
  notes?: string
  zone: 'inside' | 'outside'
  created_at?: string
}
