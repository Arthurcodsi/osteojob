import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  const smtpHost = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com'
  const smtpUser = process.env.ZOHO_SMTP_USER
  const smtpPass = process.env.ZOHO_SMTP_PASS
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const envCheck = {
    ZOHO_SMTP_HOST: smtpHost,
    ZOHO_SMTP_USER: smtpUser || 'MISSING',
    ZOHO_SMTP_PASS: smtpPass ? 'set' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: serviceKey ? 'set' : 'MISSING',
  }

  if (!smtpUser || !smtpPass) {
    return NextResponse.json({ error: 'Missing SMTP credentials', envCheck })
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
  })

  try {
    await transporter.verify()
    return NextResponse.json({ success: true, message: 'SMTP connection OK', envCheck })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: err.code, envCheck }, { status: 500 })
  }
}
