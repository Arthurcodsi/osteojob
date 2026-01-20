#!/usr/bin/env node

/**
 * Bulk Upload Users to Supabase
 *
 * This script reads osteojob-users.json and uploads all users to Supabase
 * using batch inserts for efficiency. Handles duplicates gracefully.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { v5: uuidv5 } = require('uuid')
const fs = require('fs')
const path = require('path')

// UUID namespace for generating consistent UUIDs from WordPress IDs
const NAMESPACE_WORDPRESS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuration
const BATCH_SIZE = 100 // Number of records to insert per batch
const USERS_FILE = path.join(__dirname, '..', 'osteojob-users.json')

// Statistics
const stats = {
  total: 0,
  inserted: 0,
  duplicates: 0,
  errors: 0,
  startTime: Date.now()
}

/**
 * Transform WordPress user data to Supabase profile format
 */
function transformUser(wpUser) {
  // Determine user type based on roles
  const roles = wpUser.roles || []
  const userType = roles.includes('wp_job_board_pro_employer') ? 'employer' : 'candidate'

  // Extract name parts
  const firstName = wpUser.first_name || wpUser.meta?.first_name || ''
  const lastName = wpUser.last_name || wpUser.meta?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || wpUser.display_name || wpUser.username

  return {
    // Generate deterministic UUID from WordPress user ID
    // This ensures the same WP user always gets the same UUID
    id: uuidv5(`wp-user-${wpUser.id}`, NAMESPACE_WORDPRESS),
    email: wpUser.email,
    full_name: fullName,
    user_type: userType,
    bio: wpUser.description || wpUser.meta?.description || null,
    created_at: wpUser.registered ? new Date(wpUser.registered.replace(' ', 'T')).toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * Insert batch of users with duplicate handling
 */
async function insertBatch(users, batchNum, totalBatches) {
  const transformedUsers = users.map(transformUser)

  try {
    // Use upsert to handle duplicates gracefully
    const { data, error } = await supabase
      .from('profiles')
      .upsert(transformedUsers, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      // Check if it's a duplicate error
      if (error.code === '23505' || error.message.includes('duplicate')) {
        console.log(`  ⚠️  Batch ${batchNum}/${totalBatches}: Duplicate entries found, skipping...`)
        stats.duplicates += users.length
      } else {
        console.error(`  ❌ Batch ${batchNum}/${totalBatches}: Error -`, error.message)
        stats.errors += users.length
      }
    } else {
      const inserted = data?.length || users.length
      stats.inserted += inserted
      console.log(`  ✅ Batch ${batchNum}/${totalBatches}: Inserted ${inserted} users`)
    }
  } catch (err) {
    console.error(`  ❌ Batch ${batchNum}/${totalBatches}: Exception -`, err.message)
    stats.errors += users.length
  }
}

/**
 * Main upload function
 */
async function uploadUsers() {
  console.log('🚀 Starting bulk user upload...\n')

  // Read users file
  console.log(`📖 Reading users from ${USERS_FILE}...`)
  let users
  try {
    const fileContent = fs.readFileSync(USERS_FILE, 'utf8')
    users = JSON.parse(fileContent)
  } catch (err) {
    console.error('❌ Error reading users file:', err.message)
    process.exit(1)
  }

  stats.total = users.length
  console.log(`✓ Found ${stats.total} users\n`)

  // Calculate number of batches
  const totalBatches = Math.ceil(users.length / BATCH_SIZE)
  console.log(`📦 Processing ${totalBatches} batches of ${BATCH_SIZE} users each...\n`)

  // Process batches
  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE
    const end = Math.min(start + BATCH_SIZE, users.length)
    const batch = users.slice(start, end)

    await insertBatch(batch, i + 1, totalBatches)

    // Show progress
    const progress = Math.round((end / stats.total) * 100)
    console.log(`  📊 Progress: ${progress}% (${end}/${stats.total})\n`)

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Print summary
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2)
  console.log('\n' + '='.repeat(60))
  console.log('📈 Upload Summary')
  console.log('='.repeat(60))
  console.log(`Total users:     ${stats.total}`)
  console.log(`✅ Inserted:     ${stats.inserted}`)
  console.log(`⚠️  Duplicates:  ${stats.duplicates}`)
  console.log(`❌ Errors:       ${stats.errors}`)
  console.log(`⏱️  Duration:     ${duration}s`)
  console.log('='.repeat(60))

  if (stats.errors > 0) {
    console.log('\n⚠️  Some errors occurred during upload. Please check the logs above.')
    process.exit(1)
  } else if (stats.inserted === 0 && stats.duplicates > 0) {
    console.log('\n✓ All users already exist in the database (no new inserts).')
  } else {
    console.log('\n✅ Upload completed successfully!')
  }
}

// Run the upload
uploadUsers().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
