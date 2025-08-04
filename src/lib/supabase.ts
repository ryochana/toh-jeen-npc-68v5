import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pryvikdgobvloktselzd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeXZpa2Rnb2J2bG9rdHNlbHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDYzOTYsImV4cCI6MjA2OTUyMjM5Nn0.uJrJW5mz9w65PXqnEscHndo0L4XHTe_tIrxMckhSkUQ'

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
