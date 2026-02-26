#!/usr/bin/env node

/**
 * Bulk Invite Users (employers + candidates)
 *
 * Generates a Supabase magic invite link for every profile that doesn't yet
 * have a matching auth.users entry, then sends a branded HTML email via SMTP.
 * When the user clicks the link and sets a password, the on_auth_user_created
 * trigger fires and re-links their profile + jobs automatically.
 *
 * Requires the service role key — never commit it.
 *
 * Usage:
 *   1. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local
 *   2. node scripts/bulk-invite-users.mjs
 */

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
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

const transporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ZOHO_SMTP_USER,
    pass: process.env.ZOHO_SMTP_PASS,
  },
})

// Delay between invites to avoid hitting Supabase rate limits
const DELAY_MS = 1500

const stats = {
  employers: { total: 0, invited: 0, skipped: 0, errors: 0 },
  candidates: { total: 0, invited: 0, skipped: 0, errors: 0 },
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function buildEmailHtml(inviteUrl) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#2563eb;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <div style="display:inline-block;background:#ffffff;border-radius:50%;width:80px;height:80px;line-height:80px;text-align:center;">
              <img src="https://osteojob.com/logo.png" alt="OsteoJob" width="56" style="vertical-align:middle;" />
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px 40px 32px;">

            <h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:bold;">Welcome to the new OsteoJob</h1>

            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
              We've rebuilt OsteoJob from the ground up — a faster, cleaner platform to help you find the right osteopaths for your team.
            </p>

            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
              Your account has been transferred from the old site. <strong>All your job listings are waiting for you</strong> — just click below to set your password and access your dashboard.
            </p>

            <p style="margin:0 0 32px;font-size:15px;color:#374151;line-height:1.7;">
              This link is valid for <strong>24 hours</strong>. If it expires, you can always request a new one at
              <a href="https://osteojob.com/auth/forgot-password" style="color:#2563eb;text-decoration:none;">osteojob.com/auth/forgot-password</a>.
            </p>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:32px;">
              <a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:16px 40px;border-radius:8px;">
                Access My Account →
              </a>
            </div>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />

            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              If you weren't expecting this email, you can safely ignore it — no account will be created unless you click the link above.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              <a href="https://osteojob.com" style="color:#2563eb;text-decoration:none;">OsteoJob</a> — the job board for osteopaths
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function inviteUser(email) {
  // Generate invite link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: 'https://osteojob.com/dashboard' },
  })

  if (linkError) {
    if (linkError.message?.toLowerCase().includes('already')) return 'skipped'
    return 'error'
  }

  const inviteUrl = linkData.properties?.action_link
  if (!inviteUrl) return 'error'

  // Send branded email
  await transporter.sendMail({
    from: `OsteoJob <${process.env.ZOHO_SMTP_USER}>`,
    to: email,
    subject: 'Access your OsteoJob account',
    html: buildEmailHtml(inviteUrl),
  })

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

    try {
      const result = await inviteUser(email)

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
    } catch (err) {
      console.log(`  ❌ ${num} Exception: ${email} — ${err.message}`)
      s.errors++
    }

    if (i < profiles.length - 1) await sleep(DELAY_MS)
  }
}

async function main() {
  console.log('🚀 Starting bulk invite...\n')

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

  console.log('\n' + '='.repeat(60))
  console.log('📈 Summary')
  console.log('='.repeat(60))
  for (const [type, s] of Object.entries(stats)) {
    console.log(`\n${type.toUpperCase()}`)
    console.log(`  Total:      ${s.total}`)
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
