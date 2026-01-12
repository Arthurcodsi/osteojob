import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Profile = {
  id: string
  email: string
  full_name: string | null
  user_type: 'candidate' | 'employer'
  phone: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  website: string | null
  linkedin_url: string | null
  cv_url: string | null
  qualifications: string | null
  experience_years: number | null
  specialties: string[] | null
  company_name: string | null
  company_logo_url: string | null
  company_description: string | null
  company_size: string | null
  company_address: string | null
  created_at: string
  updated_at: string
}

export type Job = {
  id: string
  employer_id: string
  title: string
  description: string
  excerpt: string | null
  job_type: string
  category: string | null
  location_country: string
  location_city: string | null
  location_address: string | null
  salary_range: string | null
  status: 'active' | 'closed' | 'draft'
  featured: boolean
  view_count: number
  application_count: number
  posted_date: string
  expiry_date: string | null
  created_at: string
  updated_at: string
  employer?: Profile
}

export type Application = {
  id: string
  job_id: string
  candidate_id: string
  applicant_name: string
  applicant_email: string
  applicant_phone: string | null
  cover_letter: string | null
  cv_url: string | null
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted'
  employer_notes: string | null
  applied_at: string
  updated_at: string
  job?: Job
  candidate?: Profile
}