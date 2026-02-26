import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data: allJobs } = await supabase.from('jobs').select('id, title, employer_id')
const { data: allProfiles } = await supabase.from('profiles').select('id, email')

const profileIds = new Set(allProfiles.map(p => p.id))
const orphaned = allJobs.filter(j => !profileIds.has(j.employer_id))

console.log(`Total jobs: ${allJobs.length}`)
console.log(`Orphaned jobs (no matching profile): ${orphaned.length}`)
console.log('\nSample orphaned employer_ids:')
orphaned.slice(0, 5).forEach(j => console.log(' ', j.title, '| employer_id:', j.employer_id))

// Check for duplicate emails
const emailCount = {}
allProfiles.forEach(p => { emailCount[p.email] = (emailCount[p.email] || 0) + 1 })
const dupes = Object.entries(emailCount).filter(([, c]) => c > 1)
console.log(`\nDuplicate emails in profiles: ${dupes.length}`)
if (dupes.length) console.log('Examples:', dupes.slice(0, 3))
