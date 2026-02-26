// Test email notification end-to-end
// Usage: node scripts/test-email.mjs <jobId>
// Get a jobId from your Supabase jobs table

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
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

const { ZOHO_SMTP_HOST, ZOHO_SMTP_USER, ZOHO_SMTP_PASS, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL } = process.env

console.log('\n=== ENV CHECK ===')
console.log('ZOHO_SMTP_HOST:', ZOHO_SMTP_HOST || '❌ MISSING')
console.log('ZOHO_SMTP_USER:', ZOHO_SMTP_USER || '❌ MISSING')
console.log('ZOHO_SMTP_PASS:', ZOHO_SMTP_PASS ? '✅ set' : '❌ MISSING')
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅ set' : '❌ MISSING')
console.log('SUPABASE_URL:', NEXT_PUBLIC_SUPABASE_URL || '❌ MISSING')

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

console.log('\n=== SMTP TEST ===')
const transporter = nodemailer.createTransport({
  host: ZOHO_SMTP_HOST || 'smtp.zoho.com',
  port: 587,
  secure: false,
  auth: { user: ZOHO_SMTP_USER, pass: ZOHO_SMTP_PASS },
})

try {
  await transporter.verify()
  console.log('✅ SMTP connection OK')
} catch (err) {
  console.error('❌ SMTP connection failed:', err.message)
  process.exit(1)
}

console.log('\n=== SENDING TEST EMAIL ===')
try {
  await transporter.sendMail({
    from: `OsteoJob <contact@osteojob.com>`,
    to: employerEmail,
    subject: `[TEST] New application for ${job.title} – OsteoJob`,
    html: `<p>This is a test email to confirm the notification system works.</p><p>Job: <strong>${job.title}</strong></p><p>Employer email: ${employerEmail}</p>`,
  })
  console.log(`✅ Test email sent to: ${employerEmail}`)
} catch (err) {
  console.error('❌ Email send failed:', err.message)
}
