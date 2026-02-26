import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST() {
  // Verify the caller is authenticated
  const cookieStore = await cookies()
  const userSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
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
    // Already linked correctly
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
