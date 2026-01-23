#!/usr/bin/env node

/**
 * Upload Users to Supabase from WordPress Export
 *
 * This script reads osteojob-users.json and uploads all users to Supabase:
 * - Generates new UUIDs for the Supabase id field
 * - Maps WordPress user ID to wordpress_user_id column
 * - Includes all user data (email, full_name, user_type, location, etc.)
 * - Shows detailed progress during upload
 * - Handles duplicates gracefully
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const path = require('path')

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
const BATCH_SIZE = 50 // Number of records to insert per batch
const USERS_FILE = path.join(__dirname, '..', 'osteojob-users.json')

// Statistics
const stats = {
  total: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
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

  // Extract additional metadata
  const bio = wpUser.description || wpUser.meta?.description || null

  // Parse registration date
  let createdAt = new Date().toISOString()
  if (wpUser.registered) {
    try {
      createdAt = new Date(wpUser.registered.replace(' ', 'T') + 'Z').toISOString()
    } catch (e) {
      // Use current date if parsing fails
    }
  }

  return {
    id: uuidv4(), // Generate new UUID for Supabase
    wordpress_user_id: wpUser.id.toString(), // Map WordPress ID to wordpress_user_id column
    email: wpUser.email,
    full_name: fullName,
    user_type: userType,
    bio: bio,
    location: null, // Can be populated later if available in meta
    created_at: createdAt,
    updated_at: new Date().toISOString()
  }
}

/**
 * Insert a single user with duplicate handling
 */
async function insertUser(user, index, total) {
  const transformed = transformUser(user)

  try {
    // First check if user already exists by email or wordpress_user_id
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, wordpress_user_id')
      .or(`email.eq.${transformed.email},wordpress_user_id.eq.${transformed.wordpress_user_id}`)
      .limit(1)
      .single()

    if (existing) {
      // User already exists
      console.log(`  ⏭️  [${index}/${total}] Skipping duplicate: ${transformed.email} (WP ID: ${transformed.wordpress_user_id})`)
      stats.skipped++
      return
    }

    // Insert new user
    const { data, error } = await supabase
      .from('profiles')
      .insert([transformed])
      .select()

    if (error) {
      // Handle specific error types
      if (error.code === '23505') {
        console.log(`  ⚠️  [${index}/${total}] Duplicate: ${transformed.email}`)
        stats.skipped++
      } else {
        console.error(`  ❌ [${index}/${total}] Error: ${error.message} (${transformed.email})`)
        stats.errors++
      }
    } else {
      console.log(`  ✅ [${index}/${total}] Inserted: ${transformed.email} (WP ID: ${transformed.wordpress_user_id})`)
      stats.inserted++
    }
  } catch (err) {
    console.error(`  ❌ [${index}/${total}] Exception: ${err.message} (${transformed.email})`)
    stats.errors++
  }
}

/**
 * Process batch of users with progress updates
 */
async function processBatch(users, batchNum, totalBatches) {
  console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${users.length} users)`)
  console.log('─'.repeat(60))

  for (let i = 0; i < users.length; i++) {
    const globalIndex = (batchNum - 1) * BATCH_SIZE + i + 1
    await insertUser(users[i], globalIndex, stats.total)

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  // Show batch summary
  const processed = (batchNum * BATCH_SIZE) > stats.total ? stats.total : (batchNum * BATCH_SIZE)
  const progress = Math.round((processed / stats.total) * 100)
  console.log(`\n  📊 Progress: ${progress}% (${processed}/${stats.total})`)
  console.log(`  ✅ Inserted: ${stats.inserted} | ⏭️  Skipped: ${stats.skipped} | ❌ Errors: ${stats.errors}`)
}

/**
 * Main upload function
 */
async function uploadUsers() {
  console.log('🚀 Starting user upload to Supabase...\n')

  // Read users file
  console.log(`📖 Reading users from ${path.basename(USERS_FILE)}...`)
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
  console.log(`📦 Will process ${totalBatches} batches of up to ${BATCH_SIZE} users each`)

  // Process batches
  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE
    const end = Math.min(start + BATCH_SIZE, users.length)
    const batch = users.slice(start, end)

    await processBatch(batch, i + 1, totalBatches)
  }

  // Print final summary
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2)
  console.log('\n' + '='.repeat(60))
  console.log('📈 Upload Complete')
  console.log('='.repeat(60))
  console.log(`Total users:        ${stats.total}`)
  console.log(`✅ Inserted:        ${stats.inserted}`)
  console.log(`⏭️  Skipped:         ${stats.skipped}`)
  console.log(`❌ Errors:          ${stats.errors}`)
  console.log(`⏱️  Duration:        ${duration}s`)
  console.log(`⚡ Rate:            ${(stats.total / parseFloat(duration)).toFixed(1)} users/sec`)
  console.log('='.repeat(60))

  if (stats.errors > 0) {
    console.log('\n⚠️  Some errors occurred during upload. Please check the logs above.')
    process.exit(1)
  } else if (stats.inserted === 0) {
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
