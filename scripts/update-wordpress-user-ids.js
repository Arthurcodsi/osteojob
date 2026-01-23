#!/usr/bin/env node

/**
 * Update WordPress User IDs in Supabase Profiles
 *
 * This script updates the wordpress_user_id field in the profiles table
 * by matching profiles with users from osteojob-users.json using email addresses.
 *
 * How it works:
 * 1. Reads all users from osteojob-users.json
 * 2. Loads all profiles from Supabase
 * 3. Matches profiles to WordPress users by email address
 * 4. Updates the wordpress_user_id field for matched profiles
 * 5. Reports statistics on matches, updates, and mismatches
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
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
const USERS_FILE = path.join(__dirname, '..', 'osteojob-users.json')
const BATCH_SIZE = 100 // Number of updates per batch

// Statistics
const stats = {
  totalWpUsers: 0,
  totalProfiles: 0,
  matched: 0,
  updated: 0,
  alreadySet: 0,
  notFound: 0,
  errors: 0,
  startTime: Date.now()
}

/**
 * Normalize email for comparison (lowercase, trim)
 */
function normalizeEmail(email) {
  if (!email) return ''
  return email.toLowerCase().trim()
}

/**
 * Load all profiles from Supabase
 */
async function loadAllProfiles() {
  console.log('📥 Loading all profiles from Supabase...')

  let profiles = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, wordpress_user_id')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('❌ Error loading profiles:', error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) break

    profiles = profiles.concat(data)
    page++

    if (data.length < pageSize) break
  }

  console.log(`✓ Loaded ${profiles.length} profiles from Supabase\n`)
  return profiles
}

/**
 * Update a single profile's wordpress_user_id
 */
async function updateProfileWordPressId(profileId, wpUserId, email) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ wordpress_user_id: wpUserId.toString() })
      .eq('id', profileId)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: data && data.length > 0, error: null }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Process updates in batches
 */
async function processUpdates(updates) {
  console.log(`\n📦 Processing ${updates.length} profile updates...`)
  console.log('─'.repeat(80))

  let processed = 0

  for (const update of updates) {
    processed++
    const { profile, wpUser } = update

    // Update the profile
    const result = await updateProfileWordPressId(profile.id, wpUser.id, profile.email)

    if (result.success) {
      console.log(`✅ [${processed}/${updates.length}] Updated ${profile.email} → WP ID: ${wpUser.id}`)
      stats.updated++
    } else {
      console.log(`❌ [${processed}/${updates.length}] Error updating ${profile.email}: ${result.error}`)
      stats.errors++
    }

    // Small delay every 10 updates
    if (processed % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

/**
 * Main update function
 */
async function updateWordPressUserIds() {
  console.log('🚀 Starting WordPress user ID updates...\n')

  // Read WordPress users file
  console.log(`📖 Reading WordPress users from ${USERS_FILE}...`)
  let wpUsers
  try {
    const fileContent = fs.readFileSync(USERS_FILE, 'utf8')
    wpUsers = JSON.parse(fileContent)
  } catch (err) {
    console.error('❌ Error reading users file:', err.message)
    process.exit(1)
  }

  stats.totalWpUsers = wpUsers.length
  console.log(`✓ Found ${stats.totalWpUsers} WordPress users\n`)

  // Load all Supabase profiles
  const profiles = await loadAllProfiles()
  stats.totalProfiles = profiles.length

  // Create email → WordPress user mapping
  console.log('🔍 Matching profiles to WordPress users by email...\n')
  const wpUsersByEmail = new Map()
  wpUsers.forEach(user => {
    const email = normalizeEmail(user.email)
    if (email) {
      wpUsersByEmail.set(email, user)
    }
  })

  // Find matches and prepare updates
  const updates = []
  const notFoundEmails = []

  for (const profile of profiles) {
    const email = normalizeEmail(profile.email)
    const wpUser = wpUsersByEmail.get(email)

    if (wpUser) {
      stats.matched++

      // Check if wordpress_user_id is already set correctly
      if (profile.wordpress_user_id === wpUser.id.toString()) {
        stats.alreadySet++
        console.log(`ℹ️  ${profile.email} - Already has correct WP ID: ${wpUser.id}`)
      } else {
        // Needs update
        updates.push({ profile, wpUser })
      }
    } else {
      stats.notFound++
      notFoundEmails.push(email)
    }
  }

  console.log(`\n📊 Matching Results:`)
  console.log(`   Matched:        ${stats.matched}`)
  console.log(`   Already set:    ${stats.alreadySet}`)
  console.log(`   Need update:    ${updates.length}`)
  console.log(`   Not found:      ${stats.notFound}`)

  // Process updates if any
  if (updates.length > 0) {
    await processUpdates(updates)
  } else {
    console.log('\n✓ No updates needed - all profiles already have correct wordpress_user_id')
  }

  // Print summary
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2)
  console.log('\n' + '='.repeat(80))
  console.log('📈 Update Summary')
  console.log('='.repeat(80))
  console.log(`Total WordPress users:     ${stats.totalWpUsers}`)
  console.log(`Total Supabase profiles:   ${stats.totalProfiles}`)
  console.log(`✅ Matched:                ${stats.matched}`)
  console.log(`✅ Updated:                ${stats.updated}`)
  console.log(`ℹ️  Already set correctly:  ${stats.alreadySet}`)
  console.log(`⚠️  Not found in WP data:   ${stats.notFound}`)
  console.log(`❌ Errors:                 ${stats.errors}`)
  console.log(`⏱️  Duration:               ${duration}s`)
  console.log('='.repeat(80))

  // Show sample of not found emails
  if (stats.notFound > 0 && notFoundEmails.length > 0) {
    console.log('\n⚠️  Note: Some profiles were not found in WordPress data.')
    console.log('   Sample emails not found (first 5):')
    notFoundEmails.slice(0, 5).forEach(email => {
      console.log(`   - ${email}`)
    })
    if (notFoundEmails.length > 5) {
      console.log(`   ... and ${notFoundEmails.length - 5} more`)
    }
  }

  if (stats.errors > 0) {
    console.log('\n⚠️  Some errors occurred during update. Please check the logs above.')
    process.exit(1)
  } else {
    console.log(`\n✅ Update completed successfully! Updated ${stats.updated} profile(s).`)
  }
}

// Run the update
updateWordPressUserIds().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
