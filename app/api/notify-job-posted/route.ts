import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

// ---------------------------------------------------------------------------
// Moderation scoring
// ---------------------------------------------------------------------------

const POSITIVE: [string, number][] = [
  ['osteopath', 25],
  ['osteopathy', 25],
  ['osteopathic', 25],
  ['craniosacral', 12],
  ['cranial', 12],
  ['visceral', 12],
  ['fascial', 10],
  ['musculoskeletal', 10],
  ['manual therapy', 10],
  ['manipulation', 8],
  ['palpation', 8],
  ['gosc', 15],
  ['general osteopathic council', 15],
  ['practitioner', 5],
  ['clinic', 4],
  ['patient', 3],
  ['locum', 6],
  ['associate', 3],
]

const NEGATIVE: [string, number][] = [
  ['supplement', 30],
  ['protein powder', 30],
  ['mlm', 35],
  ['network marketing', 35],
  ['commission only', 25],
  ['residual income', 25],
  ['passive income', 25],
  ['cryptocurrency', 30],
  ['bitcoin', 30],
  ['forex', 30],
  ['make money', 25],
  ['earn money fast', 30],
  ['direct sales', 25],
  ['selling products', 25],
  ['product sale', 25],
  ['work from home with no experience', 25],
  ['software engineer', 20],
  ['web developer', 20],
  ['seo specialist', 20],
  ['data scientist', 20],
]

function moderateJob(
  title: string,
  description: string
): { verdict: 'approve' | 'review'; reason: string; score: number } {
  const fullText = (title + ' ' + description).toLowerCase()
  const titleLower = title.toLowerCase()

  let score = 0
  const positiveMatches: string[] = []
  const negativeMatches: string[] = []

  for (const [kw, pts] of POSITIVE) {
    if (titleLower.includes(kw)) {
      score += pts * 2 // double weight for title hits
      if (!positiveMatches.includes(kw)) positiveMatches.push(kw)
    } else if (fullText.includes(kw)) {
      score += pts
      if (!positiveMatches.includes(kw)) positiveMatches.push(kw)
    }
  }

  for (const [kw, pts] of NEGATIVE) {
    if (fullText.includes(kw)) {
      score -= pts
      negativeMatches.push(kw)
    }
  }

  if (negativeMatches.length > 0) {
    return {
      verdict: 'review',
      reason: `Suspicious keywords detected: ${negativeMatches.join(', ')}`,
      score,
    }
  }

  if (score >= 20) {
    return {
      verdict: 'approve',
      reason: `Osteopathic keywords found: ${positiveMatches.join(', ')}`,
      score,
    }
  }

  return {
    verdict: 'review',
    reason:
      positiveMatches.length > 0
        ? `Low confidence — some keywords found (${positiveMatches.join(', ')}) but not enough to auto-approve`
        : 'No osteopathic keywords found — manual review needed',
    score,
  }
}

// ---------------------------------------------------------------------------
// HMAC token helpers
// ---------------------------------------------------------------------------

function generateToken(jobId: string, action: string): string {
  const secret = process.env.ADMIN_SECRET || 'change-me-in-env'
  return createHmac('sha256', secret)
    .update(`${jobId}:${action}`)
    .digest('hex')
    .slice(0, 32)
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { jobId, title, description, jobType, city, country, salary, employerName, employerEmail } =
      await req.json()

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json({ skipped: true, reason: 'Email not configured' })
    }

    // Run moderation
    const moderation = moderateJob(title || '', description || '')

    // If flagged, hide the job until manually reviewed
    if (moderation.verdict === 'review' && jobId) {
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await adminSupabase
        .from('jobs')
        .update({ status: 'draft' })
        .eq('id', jobId)
    }
    // If auto-approved, job stays active (already inserted as active)

    const location = [city, country].filter(Boolean).join(', ')
    const isAutoApproved = moderation.verdict === 'approve'

    // Build approve/reject URLs for manual review emails
    const baseUrl = 'https://osteojob.com'
    const approveToken = generateToken(jobId, 'approve')
    const rejectToken = generateToken(jobId, 'reject')
    const approveUrl = `${baseUrl}/api/admin/approve-job?id=${jobId}&action=approve&token=${approveToken}`
    const rejectUrl = `${baseUrl}/api/admin/approve-job?id=${jobId}&action=reject&token=${rejectToken}`

    const scoreColor = moderation.score >= 20 ? '#16a34a' : moderation.score > 0 ? '#d97706' : '#dc2626'

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OsteoJob <contact@osteojob.com>',
        to: 'contact@osteojob.com',
        subject: `${isAutoApproved ? '✓ Auto-approved' : '⚠️ Review needed'}: ${title}`,
        html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                <!-- Header -->
                <tr>
                  <td style="background:${isAutoApproved ? '#16a34a' : '#d97706'};border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
                    <img src="https://osteojob.com/logo.png" alt="OsteoJob" width="160" style="display:block;margin:0 auto 10px;max-width:160px;" />
                    <div style="color:white;font-size:15px;font-weight:bold;">
                      ${isAutoApproved ? '✓ Job Auto-Approved' : '⚠️ Job Needs Review'}
                    </div>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="background:#ffffff;padding:36px 40px;">

                    <p style="margin:0 0 6px;font-size:15px;color:#6b7280;">New job posted</p>
                    <h1 style="margin:0 0 20px;font-size:22px;color:#111827;font-weight:bold;">${title}</h1>

                    <!-- Moderation result -->
                    <div style="background:${isAutoApproved ? '#f0fdf4' : '#fffbeb'};border:1px solid ${isAutoApproved ? '#bbf7d0' : '#fde68a'};border-radius:8px;padding:14px 18px;margin-bottom:24px;">
                      <div style="font-size:13px;font-weight:bold;color:${isAutoApproved ? '#15803d' : '#92400e'};margin-bottom:4px;">
                        Moderation score: <span style="color:${scoreColor}">${moderation.score}</span>
                        &nbsp;|&nbsp; ${isAutoApproved ? 'AUTO-APPROVED' : 'FLAGGED FOR REVIEW'}
                      </div>
                      <div style="font-size:13px;color:#6b7280;">${moderation.reason}</div>
                    </div>

                    <!-- Job Details -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:28px;">
                      <tr>
                        <td colspan="2" style="background:#f9fafb;padding:12px 16px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e5e7eb;">
                          Job Details
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 16px;font-size:13px;color:#9ca3af;font-weight:bold;width:130px;border-bottom:1px solid #f3f4f6;">Employer</td>
                        <td style="padding:14px 16px;font-size:15px;color:#111827;border-bottom:1px solid #f3f4f6;">${employerName || '—'}</td>
                      </tr>
                      <tr style="background:#fafafa;">
                        <td style="padding:14px 16px;font-size:13px;color:#9ca3af;font-weight:bold;border-bottom:1px solid #f3f4f6;">Email</td>
                        <td style="padding:14px 16px;font-size:15px;border-bottom:1px solid #f3f4f6;">
                          <a href="mailto:${employerEmail}" style="color:#2563eb;text-decoration:none;">${employerEmail || '—'}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 16px;font-size:13px;color:#9ca3af;font-weight:bold;border-bottom:1px solid #f3f4f6;">Location</td>
                        <td style="padding:14px 16px;font-size:15px;color:#111827;border-bottom:1px solid #f3f4f6;">${location || '—'}</td>
                      </tr>
                      <tr style="background:#fafafa;">
                        <td style="padding:14px 16px;font-size:13px;color:#9ca3af;font-weight:bold;border-bottom:1px solid #f3f4f6;">Job Type</td>
                        <td style="padding:14px 16px;font-size:15px;color:#111827;border-bottom:1px solid #f3f4f6;">${jobType || '—'}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 16px;font-size:13px;color:#9ca3af;font-weight:bold;">Salary</td>
                        <td style="padding:14px 16px;font-size:15px;color:#111827;">${salary || '—'}</td>
                      </tr>
                    </table>

                    ${!isAutoApproved ? `
                    <!-- Approve / Reject buttons -->
                    <div style="text-align:center;margin-bottom:16px;">
                      <p style="color:#6b7280;font-size:14px;margin:0 0 16px;">Review the description below, then approve or reject:</p>
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                          <td style="padding-right:12px;">
                            <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:8px;">
                              ✓ Approve
                            </a>
                          </td>
                          <td>
                            <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:8px;">
                              ✗ Reject
                            </a>
                          </td>
                        </tr>
                      </table>
                    </div>
                    ` : `
                    <!-- Already live notice -->
                    <div style="text-align:center;margin-bottom:16px;">
                      <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 24px;border-radius:8px;">
                        ✗ Remove this job
                      </a>
                      <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">The job is already live. Click to remove it if it looks wrong.</p>
                    </div>
                    `}

                    <!-- Description preview -->
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:8px;">
                      <div style="font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Job Description</div>
                      <div style="font-size:13px;color:#374151;white-space:pre-wrap;max-height:300px;overflow:hidden;">${(description || '').slice(0, 800)}${(description || '').length > 800 ? '...' : ''}</div>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      Sent by <a href="https://osteojob.com" style="color:#2563eb;text-decoration:none;">OsteoJob</a> — the job board for osteopaths.
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
      }),
    })

    if (!emailRes.ok) {
      const err = await emailRes.json()
      throw new Error(err.message || 'Resend API error')
    }

    return NextResponse.json({ success: true, verdict: moderation.verdict, score: moderation.score })
  } catch (err: any) {
    console.error('notify-job-posted error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
