import { createClient } from '@supabase/supabase-js'
import https from 'https'

const supabaseUrl = 'https://tpidiusbxsknhbnlbdxp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwaWRpdXNieHNrbmhibmxiZHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Njk4MzMsImV4cCI6MjA4MzM0NTgzM30.OGDBTPHZOUgdOmtNghNYmexL1YgwwIU-k8WVgVtPP4o'

const supabase = createClient(supabaseUrl, supabaseKey)

// Employer IDs resolved from existing Supabase profiles
const DEFAULT_EMPLOYER_ID = '00000000-0000-0000-0000-000000000001'
const EMPLOYER_IDS = {
  'Finland Osteopathy Clinic': '79740e31-97d9-4fed-8265-dcf40e43b9ae',
  'Haerenga Hauora':           '551d9f7f-ffb5-4551-b63e-193f7a50ba8e',
  'Rugby Osteopathic':         '04217f11-6a46-4a08-b4e7-5fadc68d13b5',
  'Ananta Osteopathy':         'ec963fca-853f-4aa6-bb18-21b8a3aaebab',
}

// New jobs: WordPress IDs posted after the last import (14340)
const NEW_JOB_DATA = [
  {
    wordpress_job_id: 15277,
    title: 'Physiotherapist (Oman)',
    job_type: 'Full Time',
    location_country: 'Oman',
    location_city: 'Muscat',
    location_address: 'Al Khuwair, Al Maha Road, Muscat',
    employer_id: EMPLOYER_IDS['Finland Osteopathy Clinic'],
    posted_date: '2026-02-24T05:40:13',
  },
  {
    wordpress_job_id: 14898,
    title: 'Full-time Osteopath – Join our team in sunny Nelson, NZ',
    job_type: 'Full Time',
    location_country: 'New Zealand',
    location_city: 'Nelson',
    location_address: '54 Montgomery Square, Nelson 7010, New Zealand',
    employer_id: DEFAULT_EMPLOYER_ID,
    posted_date: '2026-02-07T23:58:48',
  },
  {
    wordpress_job_id: 14830,
    title: 'Associate Osteopath',
    job_type: 'Part Time',
    location_country: 'United Kingdom',
    location_city: 'Carshalton',
    location_address: '21 West Street, Carshalton, SM5 2PT',
    employer_id: DEFAULT_EMPLOYER_ID,
    posted_date: '2026-02-04T17:09:16',
  },
  {
    wordpress_job_id: 14788,
    title: '🌿 Associate Osteopath – to take over busy list in Sunny Whangarei 🌿',
    job_type: 'Part Time',
    location_country: 'New-Zealand',
    location_city: 'Whangarei',
    location_address: '75 Whau Valley Road, Whau Valley, Whangarei 0112',
    employer_id: EMPLOYER_IDS['Haerenga Hauora'],
    posted_date: '2026-02-01T07:57:29',
  },
  {
    wordpress_job_id: 14746,
    title: 'Osteopath',
    job_type: 'Part Time',
    location_country: 'United Kingdom',
    location_city: 'Rugby',
    location_address: '69 Albert Street, Rugby, Warwickshire CV21 2SN',
    employer_id: EMPLOYER_IDS['Rugby Osteopathic'],
    posted_date: '2026-01-28T14:21:59',
  },
  {
    wordpress_job_id: 14528,
    title: 'Associate Osteopath',
    job_type: 'Full Time',
    location_country: 'United Kingdom',
    location_city: 'Sutton Coldfield',
    location_address: '15 Kings Road, Sutton Coldfield, B73 5AB',
    employer_id: DEFAULT_EMPLOYER_ID,
    posted_date: '2026-01-15T10:58:11',
  },
  {
    wordpress_job_id: 14523,
    title: 'Osteopathic Practitioner',
    job_type: 'Full Time',
    location_country: 'Canada',
    location_city: 'Vancouver',
    location_address: '106-3195 Granville St, Vancouver',
    employer_id: EMPLOYER_IDS['Ananta Osteopathy'],
    posted_date: '2026-01-14T21:13:25',
  },
]

function fetchWpJob(id) {
  return new Promise((resolve, reject) => {
    https.get(
      `https://osteojob.com/wp-json/wp/v2/job_listing/${id}`,
      (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try { resolve(JSON.parse(data)) }
          catch (e) { reject(e) }
        })
      }
    ).on('error', reject)
  })
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  console.log('🚀 Importing 7 new jobs from WordPress...\n')

  // Check none of these already exist in Supabase
  const { data: existing } = await supabase
    .from('jobs')
    .select('wordpress_job_id')
    .in('wordpress_job_id', NEW_JOB_DATA.map(j => j.wordpress_job_id))

  const existingIds = new Set((existing || []).map(j => j.wordpress_job_id))
  if (existingIds.size > 0) {
    console.log('⚠️  Already in Supabase:', [...existingIds].join(', '), '— skipping these\n')
  }

  let imported = 0
  let skipped = 0

  for (const jobMeta of NEW_JOB_DATA) {
    if (existingIds.has(jobMeta.wordpress_job_id)) {
      console.log(`⏭️  Skipping #${jobMeta.wordpress_job_id} "${jobMeta.title}" (already exists)`)
      skipped++
      continue
    }

    process.stdout.write(`📥 Fetching #${jobMeta.wordpress_job_id} from WordPress... `)
    const wpJob = await fetchWpJob(jobMeta.wordpress_job_id)
    const htmlContent = wpJob.content?.rendered || ''
    const plainContent = stripHtml(htmlContent)
    const excerpt = plainContent.substring(0, 250).trim() + (plainContent.length > 250 ? '...' : '')

    const jobRecord = {
      employer_id:      jobMeta.employer_id,
      title:            jobMeta.title,
      description:      htmlContent || plainContent,
      excerpt:          excerpt,
      job_type:         jobMeta.job_type,
      category:         'Structural',
      location_country: jobMeta.location_country,
      location_city:    jobMeta.location_city,
      location_address: jobMeta.location_address,
      salary_range:     null,
      status:           'active',
      featured:         false,
      view_count:       0,
      application_count: 0,
      posted_date:      jobMeta.posted_date,
      wordpress_job_id: jobMeta.wordpress_job_id,
    }

    const { error } = await supabase.from('jobs').insert(jobRecord)
    if (error) {
      console.log(`❌ Error: ${error.message}`)
    } else {
      console.log(`✅ Inserted`)
      imported++
    }
  }

  console.log(`\n🎉 Done! ${imported} jobs imported, ${skipped} skipped.`)
}

main()
