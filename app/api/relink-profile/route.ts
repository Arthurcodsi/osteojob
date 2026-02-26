import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Get the auth token from the request cookie
  const cookieHeader = req.headers.get('cookie') || ''
  const tokenMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/)
  let accessToken: string | null = null

  if (tokenMatch) {
    try {
      const decoded = decodeURIComponent(tokenMatch[1])
      const parsed = JSON.parse(decoded)
      accessToken = parsed.access_token ?? parsed[0]?.access_token ?? null
    } catch {
      // fall through
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the token and get the user
  const userSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )

  const { data: { user }, error: authError } = await userSupabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role to update the profile ID (bypasses RLS)
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: existing } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('email', user.email!)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ relinked: false })
  }

  if (existing.id === user.id) {
    return NextResponse.json({ relinked: false, profile: existing })
  }

  const { data: updated, error: updateError } = await adminSupabase
    .from('profiles')
    .update({ id: user.id })
    .eq('email', user.email!)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ relinked: true, profile: updated })
}
