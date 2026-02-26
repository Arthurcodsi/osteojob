/**
 * Send a branded invite email with a Supabase magic link.
 * Usage: node scripts/send-invite-email.mjs <email>
 *
 * Steps:
 *  1. Deletes any existing auth user for that email (clean slate)
 *  2. Generates a Supabase invite link
 *  3. Sends a branded HTML email via SMTP
 */

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env.local') })

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/send-invite-email.mjs <email>')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── 1. Delete existing auth user if any ──────────────────────────────────────
console.log(`🔍 Checking for existing auth user: ${email}`)
const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
const existing = users?.find(u => u.email === email)

if (existing) {
  const { error: delError } = await supabase.auth.admin.deleteUser(existing.id)
  if (delError) { console.error('❌ Could not delete user:', delError.message); process.exit(1) }
  console.log(`🗑️  Deleted existing auth user (${existing.id})`)
} else {
  console.log('ℹ️  No existing auth user found')
}

// ── 2. Generate invite link ───────────────────────────────────────────────────
console.log('🔗 Generating invite link...')
const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
  type: 'invite',
  email,
  options: { redirectTo: 'https://osteojob.com/dashboard' }
})

if (linkError) { console.error('❌ Could not generate link:', linkError.message); process.exit(1) }
const inviteUrl = linkData.properties?.action_link
console.log('✅ Invite link generated')

// ── 3. Send branded email ─────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ZOHO_SMTP_USER,
    pass: process.env.ZOHO_SMTP_PASS,
  },
})

const html = `
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
              <img src="https://osteojob-eight.vercel.app/logo.png" alt="OsteoJob" width="56" style="vertical-align:middle;" />
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
</html>
`

await transporter.sendMail({
  from: `OsteoJob <${process.env.ZOHO_SMTP_USER}>`,
  to: email,
  subject: 'Access your OsteoJob account',
  html,
})

console.log(`📧 Invite email sent to ${email}`)
