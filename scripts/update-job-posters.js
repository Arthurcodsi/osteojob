#!/usr/bin/env node

/**
 * Update Job Poster IDs in Supabase
 *
 * This script updates both employer_id and poster_id fields for all jobs in Supabase
 * using the correct values from osteojob-jobs.json. Both fields are set to the same
 * value since the poster is always the employer for job postings.
 *
 * How it works:
 * 1. Reads WordPress user IDs from job data (author_id or _job_employer_posted_by)
 * 2. Looks up matching profiles by wordpress_user_id field
 * 3. Uses the profile's UUID for both employer_id and poster_id
 * 4. Falls back to placeholder UUID (00000000-0000-0000-0000-000000000001) if no profile found
 *
 * Matches jobs by title, location, and posted date since IDs don't match between systems.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Placeholder employer UUID for jobs without a matching profile
const PLACEHOLDER_EMPLOYER_UUID = '00000000-0000-0000-0000-000000000001'

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
const JOBS_FILE = path.join(__dirname, '..', 'osteojob-jobs.json')

// Statistics
const stats = {
  total: 0,
  updated: 0,
  notFound: 0,
  multipleMatches: 0,
  errors: 0,
  skipped: 0,
  usedPlaceholder: 0,  // Count when using placeholder employer
  posterIdNotAvailable: 0,  // Count when poster_id column doesn't exist
  startTime: Date.now()
}

// Cache for WordPress ID to UUID mapping and all Supabase jobs
const wpIdToUuidMap = new Map()
let allSupabaseJobs = []
let allProfiles = []

/**
 * Find profile UUID by WordPress user ID
 */
async function findProfileByWordPressId(wpUserId) {
  if (!wpUserId) return null

  // Check cache first
  if (wpIdToUuidMap.has(wpUserId)) {
    return wpIdToUuidMap.get(wpUserId)
  }

  // Find in loaded profiles
  const profile = allProfiles.find(p => p.wordpress_user_id === wpUserId.toString())

  if (profile) {
    wpIdToUuidMap.set(wpUserId, profile.id)
    return profile.id
  }

  // Not found - will use placeholder
  return null
}

/**
 * Get the employer (poster) ID from WordPress job data
 */
function getEmployerId(wpJob) {
  // First try _job_employer_posted_by from meta
  if (wpJob.meta?._job_employer_posted_by) {
    return wpJob.meta._job_employer_posted_by
  }

  // Fall back to author_id
  if (wpJob.author_id) {
    return wpJob.author_id
  }

  return null
}

/**
 * Normalize string for comparison (lowercase, trim, remove extra spaces)
 */
function normalizeString(str) {
  if (!str) return ''
  return str.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Extract location from WordPress job
 */
function getLocation(wpJob) {
  // Try to get location from the locations array
  if (wpJob.locations && wpJob.locations.length > 0) {
    return wpJob.locations[0]
  }
  return null
}

/**
 * Get city from WordPress job meta
 */
function getCity(wpJob) {
  return wpJob.meta?.['custom-text-13457249'] || null
}

/**
 * Parse WordPress date to ISO format
 */
function parseWpDate(dateStr) {
  if (!dateStr) return null
  try {
    // WordPress date format: "2026-01-04 07:35:14"
    const isoDate = dateStr.replace(' ', 'T') + '+00:00'
    return new Date(isoDate).toISOString()
  } catch {
    return null
  }
}

/**
 * Find matching job in Supabase by title, location, and date
 */
function findMatchingJobs(wpJob) {
  const wpTitle = normalizeString(wpJob.title)
  const wpLocation = getLocation(wpJob)
  const wpCity = normalizeString(getCity(wpJob))
  const wpDate = parseWpDate(wpJob.date_posted)

  const matches = allSupabaseJobs.filter(dbJob => {
    // Title must match
    const titleMatch = normalizeString(dbJob.title) === wpTitle

    if (!titleMatch) return false

    // Location should match if available
    let locationMatch = true
    if (wpLocation && dbJob.location_country) {
      locationMatch = normalizeString(dbJob.location_country) === normalizeString(wpLocation)
    }

    // City should match if available
    let cityMatch = true
    if (wpCity && dbJob.location_city) {
      cityMatch = normalizeString(dbJob.location_city) === wpCity
    }

    // Date should match (within 1 second tolerance)
    let dateMatch = true
    if (wpDate && dbJob.posted_date) {
      const dbDate = new Date(dbJob.posted_date).getTime()
      const wpTime = new Date(wpDate).getTime()
      dateMatch = Math.abs(dbDate - wpTime) < 1000 // 1 second tolerance
    }

    // Require title match and at least one other field
    return titleMatch && (locationMatch && cityMatch && dateMatch)
  })

  return matches
}

/**
 * Update a single job's employer_id and poster_id (both set to same value)
 * Since the poster is always the employer for job postings
 */
async function updateJobPoster(jobId, employerUuid) {
  try {
    // Try to update both employer_id and poster_id
    // If poster_id doesn't exist, it will be ignored
    const updateData = {
      employer_id: employerUuid,
      poster_id: employerUuid  // Same value - poster is the employer
    }

    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()

    if (error) {
      // If error is about poster_id not existing, try again with just employer_id
      if (error.message.includes('poster_id')) {
        const { data: retryData, error: retryError } = await supabase
          .from('jobs')
          .update({ employer_id: employerUuid })
          .eq('id', jobId)
          .select()

        if (retryError) {
          return { success: false, error: retryError.message }
        }
        return { success: retryData && retryData.length > 0, error: null, posterIdSkipped: true }
      }

      return { success: false, error: error.message }
    }

    return { success: data && data.length > 0, error: null, posterIdSkipped: false }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Load all profiles from Supabase for WordPress ID lookup
 */
async function loadAllProfiles() {
  console.log('📥 Loading all profiles from Supabase for WordPress ID lookup...')

  let profiles = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, wordpress_user_id, email')
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

  console.log(`✓ Loaded ${profiles.length} profiles from Supabase`)

  // Count how many have wordpress_user_id
  const withWpId = profiles.filter(p => p.wordpress_user_id).length
  console.log(`✓ ${withWpId} profiles have wordpress_user_id set\n`)

  return profiles
}

/**
 * Load all jobs from Supabase for matching
 */
async function loadAllSupabaseJobs() {
  console.log('📥 Loading all jobs from Supabase for matching...')

  let allJobs = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, location_country, location_city, posted_date, employer_id')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('❌ Error loading jobs:', error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) break

    allJobs = allJobs.concat(data)
    page++

    if (data.length < pageSize) break
  }

  console.log(`✓ Loaded ${allJobs.length} jobs from Supabase\n`)
  return allJobs
}

/**
 * Process all jobs
 */
async function processJobs(wpJobs) {
  console.log(`\n📦 Processing ${wpJobs.length} jobs...`)
  console.log('─'.repeat(80))

  let processed = 0

  for (const wpJob of wpJobs) {
    processed++
    const wpEmployerId = getEmployerId(wpJob)

    // Skip if no employer ID
    if (!wpEmployerId) {
      console.log(`⚠️  [${processed}/${wpJobs.length}] Job "${wpJob.title}" - No employer ID, skipping`)
      stats.skipped++
      continue
    }

    // Find matching job(s) in Supabase
    const matches = findMatchingJobs(wpJob)

    if (matches.length === 0) {
      console.log(`⚠️  [${processed}/${wpJobs.length}] Job "${wpJob.title}" - Not found in database`)
      stats.notFound++
      continue
    }

    if (matches.length > 1) {
      console.log(`⚠️  [${processed}/${wpJobs.length}] Job "${wpJob.title}" - Multiple matches (${matches.length}), using first match`)
      stats.multipleMatches++
    }

    // Find employer UUID by WordPress user ID
    const employerUuid = await findProfileByWordPressId(wpEmployerId)

    // Use placeholder if profile not found
    const finalEmployerUuid = employerUuid || PLACEHOLDER_EMPLOYER_UUID

    if (!employerUuid) {
      console.log(`⚠️  [${processed}/${wpJobs.length}] Job "${wpJob.title}" - WordPress user ${wpEmployerId} not found, using placeholder`)
      stats.usedPlaceholder++
    }

    // Update the first match
    const match = matches[0]
    const result = await updateJobPoster(match.id, finalEmployerUuid)

    if (result.success) {
      const location = match.location_city ? `${match.location_city}, ${match.location_country}` : match.location_country
      const placeholderNote = !employerUuid ? ' (placeholder)' : ''
      console.log(`✅ [${processed}/${wpJobs.length}] Updated "${wpJob.title}" (${location})${placeholderNote}`)
      stats.updated++

      // Track if poster_id was skipped (column doesn't exist)
      if (result.posterIdSkipped) {
        stats.posterIdNotAvailable++
      }
    } else {
      console.log(`❌ [${processed}/${wpJobs.length}] Error updating "${wpJob.title}": ${result.error}`)
      stats.errors++
    }

    // Small delay to avoid overwhelming the API
    if (processed % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

/**
 * Main update function
 */
async function updateJobPosters() {
  console.log('🚀 Starting job poster ID updates...\n')

  // Read jobs file
  console.log(`📖 Reading jobs from ${JOBS_FILE}...`)
  let wpJobs
  try {
    const fileContent = fs.readFileSync(JOBS_FILE, 'utf8')
    wpJobs = JSON.parse(fileContent)
  } catch (err) {
    console.error('❌ Error reading jobs file:', err.message)
    process.exit(1)
  }

  stats.total = wpJobs.length
  console.log(`✓ Found ${stats.total} jobs\n`)

  // Filter out jobs without employer info
  const jobsWithEmployers = wpJobs.filter(job => getEmployerId(job))
  console.log(`📊 Jobs with employer info: ${jobsWithEmployers.length}`)
  console.log(`⚠️  Jobs without employer info: ${stats.total - jobsWithEmployers.length}\n`)

  // Load all profiles for WordPress ID lookup
  allProfiles = await loadAllProfiles()

  // Load all Supabase jobs for matching
  allSupabaseJobs = await loadAllSupabaseJobs()

  if (allSupabaseJobs.length === 0) {
    console.error('❌ No jobs found in Supabase database')
    console.error('Please import jobs before updating poster IDs')
    process.exit(1)
  }

  // Process all jobs
  await processJobs(jobsWithEmployers)

  // Print summary
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2)
  console.log('\n' + '='.repeat(80))
  console.log('📈 Update Summary')
  console.log('='.repeat(80))
  console.log(`Total jobs in file:      ${stats.total}`)
  console.log(`Jobs in Supabase:        ${allSupabaseJobs.length}`)
  console.log(`Profiles loaded:         ${allProfiles.length}`)
  console.log(`✅ Updated:              ${stats.updated}`)
  console.log(`⚠️  Used placeholder:     ${stats.usedPlaceholder}`)
  console.log(`⚠️  Not found in DB:      ${stats.notFound}`)
  console.log(`⚠️  Multiple matches:     ${stats.multipleMatches}`)
  console.log(`⚠️  Skipped (no emp):     ${stats.skipped}`)
  console.log(`❌ Errors:               ${stats.errors}`)
  console.log(`⏱️  Duration:             ${duration}s`)
  console.log('='.repeat(80))

  // Note about poster_id if column doesn't exist
  if (stats.posterIdNotAvailable > 0) {
    console.log('\n📝 Note: poster_id column not found in database.')
    console.log('   Only employer_id was updated. Both fields should be set to the same value.')
    console.log('   If you add a poster_id column later, re-run this script to populate it.')
  }

  // Note about placeholder usage
  if (stats.usedPlaceholder > 0) {
    console.log('\n⚠️  Note: Some jobs used placeholder employer ID.')
    console.log(`   ${stats.usedPlaceholder} job(s) had WordPress user IDs not found in profiles table.`)
    console.log(`   These jobs were assigned to placeholder employer: ${PLACEHOLDER_EMPLOYER_UUID}`)
    console.log('   Ensure profiles have wordpress_user_id set, then re-run this script.')
  }

  if (stats.multipleMatches > 0) {
    console.log('\n⚠️  Note: Some jobs had multiple matches. The first match was used.')
    console.log('   This can happen when jobs have identical titles, locations, and dates.')
  }

  if (stats.notFound > 0) {
    console.log('\n⚠️  Note: Some jobs were not found in the database.')
    console.log('   This can happen if:')
    console.log('   - Jobs were not imported from WordPress')
    console.log('   - Job titles or dates were modified after import')
    console.log('   - Location data is missing or different')
  }

  if (stats.errors > 0) {
    console.log('\n⚠️  Some errors occurred during update. Please check the logs above.')
    process.exit(1)
  } else if (stats.updated === 0) {
    console.log('\n⚠️  No jobs were updated. Verify that jobs exist in the database.')
  } else {
    console.log(`\n✅ Update completed successfully! Updated ${stats.updated} job(s).`)
  }
}

// Run the update
updateJobPosters().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
