import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { jobId, applicantName, applicantEmail, applicantPhone, coverLetter, cvUrl } =
      await req.json()

    const resendApiKey = process.env.RESEND_API_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!resendApiKey || !serviceRoleKey) {
      return NextResponse.json({ skipped: true, reason: 'Email not configured' })
    }

    // Fetch job + employer email using service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    const { data: job } = await supabase
      .from('jobs')
      .select('title, employer:profiles!employer_id(email)')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const employerEmail = (job.employer as any)?.email
    if (!employerEmail) {
      return NextResponse.json({ error: 'Employer email not found' }, { status: 404 })
    }

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OsteoJob <contact@osteojob.com>',
        to: employerEmail,
        subject: `New application for ${job.title} – OsteoJob`,
        html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                <!-- Header -->
                <tr>
                  <td style="background:#2563eb;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
                    <img src="https://osteojob.com/logo.png" alt="OsteoJob" width="160" style="display:block;margin:0 auto 10px;max-width:160px;" />
                    <div style="color:#bfdbfe;font-size:13px;">New Job Application</div>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="background:#ffffff;padding:36px 40px;">

                    <p style="margin:0 0 6px;font-size:15px;color:#6b7280;">You have a new application for</p>
                    <h1 style="margin:0 0 28px;font-size:22px;color:#111827;font-weight:bold;">${job.title}</h1>

                    <!-- Applicant Details -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:28px;">
                      <tr>
                        <td colspan="2" style="background:#f9fafb;padding:12px 16px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e5e7eb;">
                          Applicant Details
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 16px;font-size:13px;color:#9ca3af;font-weight:bold;width:100px;border-bottom:1px solid #f3f4f6;">Name</td>
                        <td style="padding:14px 16px;font-size:15px;color:#111827;border-bottom:1px solid #f3f4f6;">${applicantName}</td>
                      </tr>
                      <tr style="background:#fafafa;">
                        <td style="padding:14px 16px;font-size:13px;color:#9ca3af;font-weight:bold;border-bottom:1px solid #f3f4f6;">Email</td>
                        <td style="padding:14px 16px;font-size:15px;border-bottom:1px solid #f3f4f6;">
                          <a href="mailto:${applicantEmail}" style="color:#2563eb;text-decoration:none;">${applicantEmail}</a>
                        </td>
                      </tr>
                      ${applicantPhone ? `
                      <tr>
                        <td style="padding:14px 16px;font-size:13px;color:#9ca3af;font-weight:bold;${cvUrl ? 'border-bottom:1px solid #f3f4f6;' : ''}">Phone</td>
                        <td style="padding:14px 16px;font-size:15px;color:#111827;${cvUrl ? 'border-bottom:1px solid #f3f4f6;' : ''}">${applicantPhone}</td>
                      </tr>` : ''}
                      ${cvUrl ? `
                      <tr style="background:#fafafa;">
                        <td style="padding:14px 16px;font-size:13px;color:#9ca3af;font-weight:bold;">CV</td>
                        <td style="padding:14px 16px;">
                          <a href="${cvUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;padding:8px 18px;border-radius:6px;">Download CV</a>
                        </td>
                      </tr>` : ''}
                    </table>

                    <!-- Cover Letter -->
                    <p style="margin:0 0 10px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Cover Letter</p>
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${coverLetter}</div>

                    <!-- CTA -->
                    <div style="margin-top:32px;text-align:center;">
                      <a href="https://osteojob.com/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:8px;">
                        View in Dashboard
                      </a>
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

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('notify-application error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
