// Test email notification end-to-end
// Usage: node scripts/test-email.mjs <jobId>
// Get a jobId from your Supabase jobs table

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const jobId = process.argv[2]
if (!jobId) {
  console.error('Usage: node scripts/test-email.mjs <jobId>')
  process.exit(1)
}

const { RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL } = process.env

console.log('\n=== ENV CHECK ===')
console.log('RESEND_API_KEY:', RESEND_API_KEY ? '✅ set' : '❌ MISSING')
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅ set' : '❌ MISSING')
console.log('SUPABASE_URL:', NEXT_PUBLIC_SUPABASE_URL || '❌ MISSING')

if (!RESEND_API_KEY) { console.error('\n❌ Missing RESEND_API_KEY'); process.exit(1) }

console.log('\n=== SUPABASE QUERY ===')
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const { data: job, error: jobError } = await supabase
  .from('jobs')
  .select('title, employer:profiles!employer_id(email)')
  .eq('id', jobId)
  .single()

if (jobError) {
  console.error('❌ Job query failed:', jobError.message)
  process.exit(1)
}
if (!job) {
  console.error('❌ Job not found for id:', jobId)
  process.exit(1)
}

console.log('✅ Job found:', job.title)
const employerEmail = job.employer?.email
console.log('Employer email:', employerEmail || '❌ MISSING (profiles.email is null)')

if (!employerEmail) {
  console.error('\n❌ Cannot send — employer has no email in profiles table')
  process.exit(1)
}

console.log('\n=== SENDING TEST EMAIL via Resend ===')
const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'OsteoJob <contact@osteojob.com>',
    to: employerEmail,
    subject: `[TEST] New application for ${job.title} – OsteoJob`,
    html: `<p>This is a test email to confirm the notification system works.</p><p>Job: <strong>${job.title}</strong></p><p>Employer email: ${employerEmail}</p>`,
  }),
})

if (res.ok) {
  console.log(`✅ Test email sent to: ${employerEmail}`)
} else {
  const err = await res.json()
  console.error('❌ Email send failed:', err.message)
}
