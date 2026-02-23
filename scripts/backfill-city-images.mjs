/**
 * Backfill city images for existing jobs that have no featured_image.
 * Uses the Wikipedia REST API (no API key needed).
 *
 * HOW TO RUN:
 *   1. Replace SERVICE_ROLE_KEY below with your key from:
 *      Supabase → Project Settings → API → service_role (secret)
 *   2. node scripts/backfill-city-images.mjs
 */

const SUPABASE_URL = 'https://tpidiusbxsknhbnlbdxp.supabase.co'
const SERVICE_ROLE_KEY = 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE'

async function fetchCityImage(city, country) {
  const query = city || country
  if (!query) return null
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.thumbnail?.source || data.originalimage?.source || null
  } catch {
    return null
  }
}

async function main() {
  if (SERVICE_ROLE_KEY === 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE') {
    console.error('❌ Please set your SERVICE_ROLE_KEY in the script before running.')
    process.exit(1)
  }

  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  }

  // Fetch all jobs with no featured_image
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?select=id,title,location_city,location_country&featured_image=is.null`,
    { headers }
  )
  const jobs = await res.json()

  if (!Array.isArray(jobs) || jobs.length === 0) {
    console.log('✅ No jobs without images found.')
    return
  }

  console.log(`Found ${jobs.length} jobs without images. Fetching city photos...\n`)

  for (const job of jobs) {
    const imageUrl = await fetchCityImage(job.location_city, job.location_country)

    if (!imageUrl) {
      console.log(`⏭  ${job.title} (${job.location_city || job.location_country}) — no Wikipedia image found`)
      continue
    }

    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?id=eq.${job.id}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ featured_image: imageUrl }),
      }
    )

    if (updateRes.ok) {
      console.log(`✅ ${job.title} (${job.location_city || job.location_country}) — image set`)
    } else {
      console.log(`❌ ${job.title} — update failed`)
    }

    // Small delay to be polite to the Wikipedia API
    await new Promise(r => setTimeout(r, 300))
  }

  console.log('\nDone!')
}

main().catch(console.error)
