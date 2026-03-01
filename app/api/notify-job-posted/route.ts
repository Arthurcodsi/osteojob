import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, jobType, city, country, salary, employerName, employerEmail } =
      await req.json()

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json({ skipped: true, reason: 'Email not configured' })
    }

    const location = [city, country].filter(Boolean).join(', ')

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OsteoJob <contact@osteojob.com>',
        to: 'contact@osteojob.com',
        subject: `New job posted: ${title}`,
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
                    <div style="color:#bfdbfe;font-size:13px;">New Job Posted</div>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="background:#ffffff;padding:36px 40px;">

                    <p style="margin:0 0 6px;font-size:15px;color:#6b7280;">A new job has just been posted</p>
                    <h1 style="margin:0 0 28px;font-size:22px;color:#111827;font-weight:bold;">${title}</h1>

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

                    <!-- CTA -->
                    <div style="margin-top:32px;text-align:center;">
                      <a href="https://osteojob.com/jobs" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:8px;">
                        View Job Listings
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
    console.error('notify-job-posted error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
