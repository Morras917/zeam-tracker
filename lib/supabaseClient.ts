import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Partnership = {
  id: number
  name: string
  type: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  status: 'Active' | 'Pipeline' | 'Onboarding' | 'Negotiating' | 'Inactive'
  notes: string | null
  created_at: string
  updated_at: string
}

export type Merchant = {
  id: number
  name: string
  location: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  status: 'Active' | 'Pipeline' | 'Onboarding' | 'Inactive'
  notes: string | null
  created_at: string
  updated_at: string
}

export type BusinessAccount = {
  id: number
  name: string
  segment: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  status: 'Active' | 'Pipeline' | 'Onboarding' | 'Inactive'
  notes: string | null
  created_at: string
  updated_at: string
}
