#!/usr/bin/env node

/**
 * Bulk Invite Users (employers + candidates)
 *
 * Sends a Supabase magic invite link to every profile that doesn't yet
 * have a matching auth.users entry. When the user clicks the link and
 * sets a password, the on_auth_user_created trigger fires and re-links
 * their profile + jobs automatically.
 *
 * Requires the service role key — never commit it.
 *
 * Usage:
 *   1. Paste your service role key below (or set SUPABASE_SERVICE_ROLE_KEY in .env.local)
 *   2. node scripts/bulk-invite-users.mjs
 *   3. Remove the key afterwards
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing credentials.')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Delay between invites to avoid hitting Supabase rate limits
const DELAY_MS = 1000

const stats = {
  employers: { total: 0, invited: 0, skipped: 0, errors: 0 },
  candidates: { total: 0, invited: 0, skipped: 0, errors: 0 },
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function inviteUser(email, userType) {
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'https://osteojob.com/dashboard',
  })

  if (error) {
    // "User already registered" means they already have an auth account — skip gracefully
    if (error.message?.toLowerCase().includes('already')) {
      return 'skipped'
    }
    return 'error'
  }
  return 'invited'
}

async function processGroup(profiles, userType) {
  const s = stats[userType]
  s.total = profiles.length

  console.log(`\n--- ${userType.toUpperCase()}S (${profiles.length}) ---`)

  for (let i = 0; i < profiles.length; i++) {
    const { email } = profiles[i]
    const num = `[${i + 1}/${profiles.length}]`

    if (!email) {
      console.log(`  ⚠️  ${num} No email — skipping`)
      s.skipped++
      continue
    }

    const result = await inviteUser(email, userType)

    if (result === 'invited') {
      console.log(`  ✅ ${num} Invited: ${email}`)
      s.invited++
    } else if (result === 'skipped') {
      console.log(`  ⏭️  ${num} Already registered: ${email}`)
      s.skipped++
    } else {
      console.log(`  ❌ ${num} Error: ${email}`)
      s.errors++
    }

    // Rate-limit guard
    if (i < profiles.length - 1) await sleep(DELAY_MS)
  }
}

async function main() {
  console.log('🚀 Starting bulk invite...\n')

  // Fetch all profiles — no auth.users filter needed, Supabase handles "already registered"
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('email, user_type')
    .order('user_type')

  if (error) {
    console.error('❌ Failed to fetch profiles:', error.message)
    process.exit(1)
  }

  const employers = profiles.filter(p => p.user_type === 'employer')
  const candidates = profiles.filter(p => p.user_type === 'candidate')

  console.log(`Found ${employers.length} employers and ${candidates.length} candidates`)

  await processGroup(employers, 'employers')
  await processGroup(candidates, 'candidates')

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📈 Summary')
  console.log('='.repeat(60))
  for (const [type, s] of Object.entries(stats)) {
    console.log(`\n${type.toUpperCase()}`)
    console.log(`  Total:    ${s.total}`)
    console.log(`  ✅ Invited:  ${s.invited}`)
    console.log(`  ⏭️  Skipped:  ${s.skipped}  (already have an account)`)
    console.log(`  ❌ Errors:   ${s.errors}`)
  }
  console.log('\n' + '='.repeat(60))
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
