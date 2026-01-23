#!/usr/bin/env node

/**
 * Update Job Employer IDs in Supabase using Email Mapping
 *
 * This script updates employer_id for all jobs in Supabase using email-based
 * matching from the job-user mapping file.
 *
 * How it works:
 * 1. Reads job-to-email mapping from osteojob-job-user-mapping.json
 * 2. For each job, looks up the profile by email in Supabase
 * 3. Finds the job in Supabase by wordpress_job_id
 * 4. Updates that job's employer_id to the profile's UUID
 * 5. Falls back to placeholder UUID if no matching profile found
 *
 * Matches jobs by wordpress_job_id (unique identifier) to ensure
 * each mapping entry updates exactly ONE job.
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
const MAPPING_FILE = path.join(__dirname, '..', 'osteojob-job-user-mapping.json')

// Statistics
const stats = {
  total: 0,
  updated: 0,
  jobNotFoundInDb: 0,
  emailNotFound: 0,
  errors: 0,
  skipped: 0,
  usedPlaceholder: 0,
  startTime: Date.now()
}

// Cache for email to UUID mapping and all Supabase jobs
const emailToUuidMap = new Map()
let allSupabaseJobs = []
let allProfiles = []

/**
 * Find profile UUID by email
 */
async function findProfileByEmail(email) {
  if (!email) return null

  // Normalize email (lowercase for comparison)
  const normalizedEmail = email.toLowerCase().trim()

  // Check cache first
  if (emailToUuidMap.has(normalizedEmail)) {
    return emailToUuidMap.get(normalizedEmail)
  }

  // Find in loaded profiles
  const profile = allProfiles.find(p =>
    p.email && p.email.toLowerCase().trim() === normalizedEmail
  )

  if (profile) {
    emailToUuidMap.set(normalizedEmail, profile.id)
    return profile.id
  }

  // Not found - will use placeholder
  return null
}

/**
 * Find matching job in Supabase by wordpress_job_id
 */
function findJobByWordPressId(wpJobId) {
  if (!wpJobId) return null

  // Convert to string for comparison
  const wpIdStr = wpJobId.toString()

  const job = allSupabaseJobs.find(dbJob => {
    return dbJob.wordpress_job_id && dbJob.wordpress_job_id.toString() === wpIdStr
  })

  return job || null
}

/**
 * Update a single job's employer_id
 */
async function updateJobEmployer(jobId, employerUuid) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({ employer_id: employerUuid })
      .eq('id', jobId)
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
 * Load all profiles from Supabase for email lookup
 */
async function loadAllProfiles() {
  console.log('📥 Loading all profiles from Supabase for email lookup...')

  let profiles = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
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

  // Count how many have email
  const withEmail = profiles.filter(p => p.email).length
  console.log(`✓ ${withEmail} profiles have email set\n`)

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
      .select('id, title, wordpress_job_id, employer_id')
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

  console.log(`✓ Loaded ${allJobs.length} jobs from Supabase`)

  // Count how many have wordpress_job_id
  const withWpId = allJobs.filter(j => j.wordpress_job_id).length
  console.log(`✓ ${withWpId} jobs have wordpress_job_id set\n`)

  return allJobs
}

/**
 * Process all jobs
 */
async function processJobs(jobMappings) {
  console.log(`\n📦 Processing ${jobMappings.length} job mappings...`)
  console.log('─'.repeat(80))

  let processed = 0

  for (const mapping of jobMappings) {
    processed++
    const { job_id, job_title, employer_email } = mapping

    // Skip if no employer email
    if (!employer_email) {
      console.log(`⚠️  [${processed}/${jobMappings.length}] Job #${job_id} "${job_title}" - No employer email, skipping`)
      stats.skipped++
      continue
    }

    // Skip if no job_id
    if (!job_id) {
      console.log(`⚠️  [${processed}/${jobMappings.length}] Job "${job_title}" - No job_id, skipping`)
      stats.skipped++
      continue
    }

    // Find matching job in Supabase by wordpress_job_id
    const job = findJobByWordPressId(job_id)

    if (!job) {
      console.log(`⚠️  [${processed}/${jobMappings.length}] Job #${job_id} "${job_title}" - Not found in database (no matching wordpress_job_id)`)
      stats.jobNotFoundInDb++
      continue
    }

    // Find employer UUID by email
    const employerUuid = await findProfileByEmail(employer_email)

    // Use placeholder if profile not found
    const finalEmployerUuid = employerUuid || PLACEHOLDER_EMPLOYER_UUID

    if (!employerUuid) {
      console.log(`⚠️  [${processed}/${jobMappings.length}] Job #${job_id} "${job_title}" - Email "${employer_email}" not found, using placeholder`)
      stats.usedPlaceholder++
      stats.emailNotFound++
    }

    // Update the job
    const result = await updateJobEmployer(job.id, finalEmployerUuid)

    if (result.success) {
      const placeholderNote = !employerUuid ? ' (placeholder)' : ''
      console.log(`✅ [${processed}/${jobMappings.length}] Updated Job #${job_id} "${job_title}"${placeholderNote}`)
      stats.updated++
    } else {
      console.log(`❌ [${processed}/${jobMappings.length}] Error updating Job #${job_id} "${job_title}": ${result.error}`)
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
async function updateJobEmployers() {
  console.log('🚀 Starting job employer ID updates using email mapping...\n')

  // Read mapping file
  console.log(`📖 Reading job mappings from ${MAPPING_FILE}...`)
  let jobMappings
  try {
    const fileContent = fs.readFileSync(MAPPING_FILE, 'utf8')
    jobMappings = JSON.parse(fileContent)
  } catch (err) {
    console.error('❌ Error reading mapping file:', err.message)
    process.exit(1)
  }

  stats.total = jobMappings.length
  console.log(`✓ Found ${stats.total} job mappings\n`)

  // Filter out jobs without employer email
  const jobsWithEmail = jobMappings.filter(job => job.employer_email)
  console.log(`📊 Jobs with employer email: ${jobsWithEmail.length}`)
  console.log(`⚠️  Jobs without employer email: ${stats.total - jobsWithEmail.length}\n`)

  // Load all profiles for email lookup
  allProfiles = await loadAllProfiles()

  // Load all Supabase jobs for matching
  allSupabaseJobs = await loadAllSupabaseJobs()

  if (allSupabaseJobs.length === 0) {
    console.error('❌ No jobs found in Supabase database')
    console.error('Please import jobs before updating employer IDs')
    process.exit(1)
  }

  // Process all job mappings
  await processJobs(jobsWithEmail)

  // Print summary
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2)
  console.log('\n' + '='.repeat(80))
  console.log('📈 Update Summary')
  console.log('='.repeat(80))
  console.log(`Total job mappings:      ${stats.total}`)
  console.log(`Jobs in Supabase:        ${allSupabaseJobs.length}`)
  console.log(`Profiles loaded:         ${allProfiles.length}`)
  console.log(`✅ Updated:              ${stats.updated}`)
  console.log(`⚠️  Job not found:        ${stats.jobNotFoundInDb}`)
  console.log(`⚠️  Email not found:      ${stats.emailNotFound}`)
  console.log(`⚠️  Used placeholder:     ${stats.usedPlaceholder}`)
  console.log(`⚠️  Skipped (no data):    ${stats.skipped}`)
  console.log(`❌ Errors:               ${stats.errors}`)
  console.log(`⏱️  Duration:             ${duration}s`)
  console.log('='.repeat(80))
  console.log(`\n📊 Match Rate: ${stats.updated}/${stats.total - stats.skipped} mappings matched jobs (${((stats.updated / Math.max(1, stats.total - stats.skipped)) * 100).toFixed(1)}%)`)

  // Note about placeholder usage
  if (stats.usedPlaceholder > 0) {
    console.log('\n⚠️  Note: Some jobs used placeholder employer ID.')
    console.log(`   ${stats.usedPlaceholder} job(s) had emails not found in profiles table.`)
    console.log(`   These jobs were assigned to placeholder employer: ${PLACEHOLDER_EMPLOYER_UUID}`)
    console.log('   Ensure profiles have correct emails, then re-run this script.')
  }

  if (stats.jobNotFoundInDb > 0) {
    console.log('\n⚠️  Note: Some jobs were not found in the database.')
    console.log(`   ${stats.jobNotFoundInDb} job(s) had wordpress_job_id not found in Supabase.`)
    console.log('   This can happen if:')
    console.log('   - Jobs were not imported from WordPress')
    console.log('   - wordpress_job_id field is not set in Supabase')
    console.log('   - Job IDs in mapping file do not match Supabase wordpress_job_id')
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
updateJobEmployers().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
