import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
    }

    const subjectLabels: Record<string, string> = {
      general: 'General Inquiry',
      'job-posting': 'Job Posting Question',
      account: 'Account Support',
      technical: 'Technical Issue',
      partnership: 'Partnership Opportunity',
      feedback: 'Feedback',
      other: 'Other',
    }
    const subjectLabel = subjectLabels[subject] || subject

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OsteoJob <contact@osteojob.com>',
        to: 'contact@osteojob.com',
        reply_to: email,
        subject: `[Contact Form] ${subjectLabel} – from ${name}`,
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
            <div style="color:#bfdbfe;font-size:13px;">Contact Form Submission</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px;">

            <h1 style="margin:0 0 24px;font-size:20px;color:#111827;font-weight:bold;">${subjectLabel}</h1>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:28px;">
              <tr>
                <td colspan="2" style="background:#f9fafb;padding:12px 16px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e5e7eb;">
                  Sender Details
                </td>
              </tr>
              <tr>
                <td style="padding:14px 16px;font-size:13px;color:#9ca3af;font-weight:bold;width:80px;border-bottom:1px solid #f3f4f6;">Name</td>
                <td style="padding:14px 16px;font-size:15px;color:#111827;border-bottom:1px solid #f3f4f6;">${name}</td>
              </tr>
              <tr style="background:#fafafa;">
                <td style="padding:14px 16px;font-size:13px;color:#9ca3af;font-weight:bold;">Email</td>
                <td style="padding:14px 16px;font-size:15px;">
                  <a href="mailto:${email}" style="color:#2563eb;text-decoration:none;">${email}</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 10px;font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Message</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message}</div>

            <div style="margin-top:28px;">
              <a href="mailto:${email}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:8px;">
                Reply to ${name}
              </a>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Sent via the contact form on <a href="https://osteojob.com" style="color:#2563eb;text-decoration:none;">OsteoJob</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    })

    if (!emailRes.ok) {
      const err = await emailRes.json()
      throw new Error(err.message || 'Resend API error')
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('contact route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
