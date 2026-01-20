#!/usr/bin/env node

/**
 * Test Supabase Connection
 *
 * Quick script to verify Supabase connection and credentials
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('✓ Credentials found')
console.log(`  URL: ${supabaseUrl}`)
console.log(`  Key: ${supabaseKey.substring(0, 20)}...\n`)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test 1: Check profiles table exists
    console.log('📋 Testing profiles table access...')
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Error accessing profiles table:', error.message)
      return false
    }

    console.log(`✅ Profiles table accessible (${count || 0} existing records)\n`)

    // Test 2: Try to insert a test record (then delete it)
    console.log('📝 Testing insert permissions...')
    const testId = uuidv4()
    const testProfile = {
      id: testId,
      email: `test-${Date.now()}@example.com`,
      full_name: 'Test User',
      user_type: 'candidate',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: insertError } = await supabase
      .from('profiles')
      .insert([testProfile])

    if (insertError) {
      console.error('❌ Insert permission error:', insertError.message)
      return false
    }

    console.log('✅ Insert permission verified')

    // Clean up test record
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', testId)

    if (!deleteError) {
      console.log('✅ Cleanup successful\n')
    }

    return true
  } catch (err) {
    console.error('❌ Connection test failed:', err.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('✅ All tests passed! Ready to upload users.')
    process.exit(0)
  } else {
    console.log('\n❌ Connection test failed. Please check your credentials and permissions.')
    process.exit(1)
  }
})
