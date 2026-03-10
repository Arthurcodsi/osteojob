import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

function verifyToken(jobId: string, action: string, token: string): boolean {
  const secret = process.env.ADMIN_SECRET || 'change-me-in-env'
  const expected = createHmac('sha256', secret)
    .update(`${jobId}:${action}`)
    .digest('hex')
    .slice(0, 32)
  return token === expected
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('id')
  const action = searchParams.get('action')
  const token = searchParams.get('token')

  if (!jobId || !action || !token) {
    return htmlResponse('error', 'Invalid request — missing parameters.')
  }

  if (action !== 'approve' && action !== 'reject') {
    return htmlResponse('error', 'Invalid action.')
  }

  if (!verifyToken(jobId, action, token)) {
    return htmlResponse('error', 'Invalid or expired token.')
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const newStatus = action === 'approve' ? 'active' : 'closed'

  const { error } = await adminSupabase
    .from('jobs')
    .update({ status: newStatus })
    .eq('id', jobId)

  if (error) {
    return htmlResponse('error', `Database error: ${error.message}`)
  }

  return htmlResponse(action, '')
}

function htmlResponse(result: 'approve' | 'reject' | 'error', message: string) {
  const config = {
    approve: {
      color: '#16a34a',
      bg: '#f0fdf4',
      icon: '✓',
      heading: 'Job Approved',
      body: 'The job is now live on OsteoJob.',
    },
    reject: {
      color: '#dc2626',
      bg: '#fef2f2',
      icon: '✗',
      heading: 'Job Rejected',
      body: 'The job has been removed from listings.',
    },
    error: {
      color: '#6b7280',
      bg: '#f9fafb',
      icon: '!',
      heading: 'Error',
      body: message || 'Something went wrong.',
    },
  }[result]

  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${config.heading} — OsteoJob</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
    .card { background: white; border-radius: 20px; padding: 48px 40px; text-align: center; max-width: 420px; width: 90%; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .icon { width: 72px; height: 72px; border-radius: 50%; background: ${config.bg}; color: ${config.color}; font-size: 36px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid ${config.color}; }
    h1 { color: ${config.color}; margin: 0 0 10px; font-size: 24px; }
    p { color: #6b7280; margin: 0 0 28px; font-size: 15px; }
    a { display: inline-block; background: #2563eb; color: white; padding: 13px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; }
    a:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${config.icon}</div>
    <h1>${config.heading}</h1>
    <p>${config.body}</p>
    <a href="https://osteojob.com/jobs">View Listings</a>
  </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
