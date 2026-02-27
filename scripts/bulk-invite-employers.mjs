#!/usr/bin/env node
/**
 * Invite all employers who have posted at least one job.
 * Uses supabase.auth.admin.inviteUserByEmail() — Supabase sends
 * the email through the configured SMTP (Zoho). No nodemailer needed.
 *
 * Usage: node scripts/bulk-invite-employers.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const DELAY_MS = 2000 // 2s between each to stay within Zoho rate limits

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  // Get employer IDs that have actual jobs
  const { data: jobRows } = await supabase.from('jobs').select('employer_id')
  const employerIds = [...new Set(jobRows.map(j => j.employer_id))]

  // Fetch their profiles
  const { data: employers } = await supabase
    .from('profiles')
    .select('email')
    .in('id', employerIds)
    .neq('email', 'employers@osteojob.com')

  console.log(`\n🚀 Inviting ${employers.length} employers...\n`)

  let invited = 0, skipped = 0, errors = 0

  for (let i = 0; i < employers.length; i++) {
    const { email } = employers[i]
    const num = `[${i + 1}/${employers.length}]`

    if (!email) { console.log(`  ⚠️  ${num} No email — skipping`); skipped++; continue }

    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://osteojob.com/dashboard',
    })

    if (!error) {
      console.log(`  ✅ ${num} Invited: ${email}`)
      invited++
    } else if (error.message?.toLowerCase().includes('already')) {
      console.log(`  ⏭️  ${num} Already registered: ${email}`)
      skipped++
    } else {
      console.log(`  ❌ ${num} Error: ${email} — ${error.message}`)
      errors++
    }

    if (i < employers.length - 1) await sleep(DELAY_MS)
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Invited:  ${invited}`)
  console.log(`⏭️  Skipped:  ${skipped}  (already have an account)`)
  console.log(`❌ Errors:   ${errors}`)
  console.log('='.repeat(50))
}

main().catch(err => { console.error('\n❌ Fatal:', err); process.exit(1) })
