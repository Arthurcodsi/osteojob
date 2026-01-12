const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase credentials
const supabaseUrl = 'https://tpidiusbxsknhbnlbdxp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwaWRpdXNieHNrbmhibmxiZHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Njk4MzMsImV4cCI6MjA4MzM0NTgzM30.OGDBTPHZOUgdOmtNghNYmexL1YgwwIU-k8WVgVtPP4o'

const supabase = createClient(supabaseUrl, supabaseKey)

async function importData() {
  console.log('🚀 Starting data import...\n')

  try {
    // Read JSON files
    const jobsData = JSON.parse(fs.readFileSync('osteojob-jobs.json', 'utf8'))
    const usersData = JSON.parse(fs.readFileSync('osteojob-users.json', 'utf8'))
    
    console.log(`📊 Found ${jobsData.length} jobs and ${usersData.length} users\n`)

    // Step 1: Create a default employer profile for all jobs
    console.log('👥 Creating default employer profile...')
    const defaultEmployerId = '00000000-0000-0000-0000-000000000001'
    const userMapping = {} // Map old WP user IDs to the default employer

    // Note: Foreign key constraint will be handled by Supabase

    const { error: defaultEmployerError } = await supabase
      .from('profiles')
      .upsert({
        id: defaultEmployerId,
        email: 'employers@osteojob.com',
        full_name: 'OsteoJob Employers',
        user_type: 'employer',
        company_name: 'Various Employers',
        company_description: 'Jobs from various osteopathic practices'
      }, { onConflict: 'id' })

    if (defaultEmployerError && !defaultEmployerError.message.includes('already exists')) {
      console.log(`  ⚠️  Could not create default employer: ${defaultEmployerError.message}`)
      console.log('  ℹ️  Continuing with import anyway...')
    } else {
      console.log(`  ✅ Default employer profile created`)
    }

    // Map all old user IDs to the default employer
    usersData.forEach(user => {
      userMapping[user.id] = defaultEmployerId
    })

    console.log(`\n✅ User mapping complete (using default employer for all jobs)\n`)

    // Step 2: Import Jobs
    console.log('💼 Importing jobs...')
    let importedJobsCount = 0

    for (const job of jobsData) {
      // Map the old employer ID to new ID
      const employerId = userMapping[job.author_id]
      
      if (!employerId) {
        console.log(`  ⚠️  Skipping job "${job.title}" - employer not found`)
        continue
      }

      // Clean and map job data
      const jobData = {
        employer_id: employerId,
        title: job.title,
        description: job.content,
        excerpt: job.excerpt || job.content?.substring(0, 200) + '...',
        job_type: job.job_types?.[0] || 'Full Time',
        category: job.categories?.[0] || null,
        location_country: job.locations?.[0] || job.job_location || 'United Kingdom',
        location_city: job.meta?.['custom-text-13457249'] || job.meta?._job_location || null,
        location_address: job.meta?.['custom-textarea-13228385'] || null,
        salary_range: job.meta?._job_salary || null,
        status: job.status === 'publish' ? 'active' : 'draft',
        featured: false,
        view_count: parseInt(job.meta?._viewed_count) || 0,
        posted_date: job.date_posted,
        wordpress_job_id: job.id
      }

      const { error } = await supabase
        .from('jobs')
        .insert(jobData)

      if (error) {
        console.log(`  ⚠️  Error importing job "${job.title}": ${error.message}`)
      } else {
        importedJobsCount++
        if (importedJobsCount % 10 === 0) {
          console.log(`  📝 Imported ${importedJobsCount} jobs...`)
        }
      }
    }

    console.log(`\n✅ Successfully imported ${importedJobsCount} jobs!\n`)

    // Summary
    console.log('🎉 Import Complete!')
    console.log('====================')
    console.log(`✅ Users: ${Object.keys(userMapping).length}`)
    console.log(`✅ Jobs: ${importedJobsCount}`)
    console.log('\n🌐 Visit http://localhost:3000 to see your site!')

  } catch (error) {
    console.error('❌ Import failed:', error.message)
    console.error(error)
  }
}

// Run the import
importData()