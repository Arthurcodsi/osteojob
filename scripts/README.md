# Bulk Upload Scripts

This directory contains utility scripts for managing data migrations to Supabase.

## Scripts Overview

1. **bulk-upload-users.js** - Bulk upload users from WordPress export
2. **update-job-posters.js** - Update employer_id for all jobs
3. **test-connection.js** - Test Supabase database connection

---

## User Upload Script

### bulk-upload-users.js

Bulk uploads users from `osteojob-users.json` to the Supabase `profiles` table.

#### Features

- **Batch Processing**: Uploads users in batches of 100 for optimal performance
- **Progress Tracking**: Shows real-time progress with batch completion status
- **Duplicate Handling**: Uses upsert to gracefully handle existing users
- **Error Handling**: Tracks and reports errors without stopping the entire process
- **Statistics**: Provides detailed summary of inserted, duplicate, and failed records

#### Prerequisites

1. Ensure `.env.local` file exists with Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Optional, for better permissions
   ```

2. Ensure `osteojob-users.json` exists in the project root

#### Usage

Run the script using npm:

```bash
npm run upload:users
```

Or directly with node:

```bash
node scripts/bulk-upload-users.js
```

#### Data Mapping

WordPress user fields are mapped to Supabase profile fields as follows:

| WordPress Field | Supabase Field | Notes |
|----------------|----------------|-------|
| `id` | `id` | Prefixed with 'wp-' to create unique ID |
| `email` | `email` | Primary identifier for duplicates |
| `first_name + last_name` | `full_name` | Falls back to display_name or username |
| `roles` | `user_type` | 'employer' if role contains 'employer', else 'candidate' |
| `description` | `bio` | User biography |
| `registered` | `created_at` | Registration timestamp |

#### Output

The script provides detailed progress output:

```
🚀 Starting bulk user upload...

📖 Reading users from osteojob-users.json...
✓ Found 2501 users

📦 Processing 26 batches of 100 users each...

  ✅ Batch 1/26: Inserted 100 users
  📊 Progress: 4% (100/2501)

  ✅ Batch 2/26: Inserted 100 users
  📊 Progress: 8% (200/2501)

...

============================================================
📈 Upload Summary
============================================================
Total users:     2501
✅ Inserted:     2450
⚠️  Duplicates:  51
❌ Errors:       0
⏱️  Duration:     12.34s
============================================================

✅ Upload completed successfully!
```

#### Troubleshooting

**Missing credentials error:**
- Ensure `.env.local` file exists and contains valid Supabase credentials

**Duplicate key errors:**
- The script handles duplicates gracefully using upsert
- Duplicates are counted and reported in the summary

**Permission errors:**
- Use `SUPABASE_SERVICE_ROLE_KEY` instead of anon key for full permissions
- Ensure the Supabase user has INSERT permissions on the `profiles` table

**File not found:**
- Ensure `osteojob-users.json` exists in the project root directory

---

## Job Poster Update Script

### update-job-posters.js

Updates the `employer_id` field for all jobs in Supabase using the correct poster IDs from `osteojob-jobs.json`.

#### Features

- **Job Matching**: Matches jobs by their WordPress ID
- **Employer ID Resolution**: Maps WordPress user IDs to Supabase UUIDs
- **Progress Tracking**: Shows real-time update progress per job
- **Batch Processing**: Updates jobs in batches of 50
- **Error Handling**: Tracks jobs not found or failed updates
- **Statistics**: Detailed summary of updated/skipped/failed records

#### Prerequisites

1. Ensure `.env.local` file exists with Supabase credentials
2. Ensure `osteojob-jobs.json` exists in the project root
3. **Important**: Users must be uploaded first using `upload:users` script
4. Jobs must exist in the database (imported beforehand)

#### Usage

Run the script using npm:

```bash
npm run update:job-posters
```

Or directly with node:

```bash
node scripts/update-job-posters.js
```

#### How It Works

1. **Reads** `osteojob-jobs.json` (244 jobs)
2. **Extracts** employer ID from each job:
   - First tries `meta._job_employer_posted_by`
   - Falls back to `author_id`
3. **Generates** employer UUID using same logic as user upload
4. **Matches** jobs by generating UUID from WordPress job ID
5. **Updates** only the `employer_id` field for each matched job

#### Employer ID Resolution

The script determines the employer (poster) in this order:

1. `meta._job_employer_posted_by` (WordPress job board plugin field)
2. `author_id` (WordPress post author)

Then converts WordPress user ID to UUID:
```javascript
// Same UUID generation as user upload
UUID = v5(`wp-user-{wordpress_user_id}`, NAMESPACE)
```

#### Output

```
🚀 Starting job poster ID updates...

📖 Reading jobs from osteojob-jobs.json...
✓ Found 244 jobs

📊 Jobs with employer info: 240
⚠️  Jobs without employer info: 4

📦 Processing 5 batches of up to 50 jobs each...

📦 Processing Batch 1/5 (50 jobs)...
  ✅ Updated job #14340: "Associate Osteopath"
  ✅ Updated job #13749: "Associate osteopath"
  ...
  📊 Progress: 20% (50/240)

...

============================================================
📈 Update Summary
============================================================
Total jobs in file:    244
✅ Updated:            235
⚠️  Not found in DB:    5
⚠️  Skipped (no emp):   4
❌ Errors:             0
⏱️  Duration:           8.50s
============================================================

✅ Update completed successfully!
```

#### Job Matching Strategy

The script generates a deterministic UUID for each WordPress job:
- **Pattern**: `wp-job-{wordpress_job_id}`
- **Namespace**: Same as user UUID namespace
- **Result**: Consistent job UUIDs across runs

**Note**: This assumes jobs were imported with the same UUID generation logic. If jobs were imported differently, the matching strategy may need adjustment.

#### Troubleshooting

**"Jobs not found in database":**
- Jobs must be imported to Supabase before updating poster IDs
- Verify jobs exist: Check Supabase dashboard → jobs table
- Ensure job import used the same UUID generation pattern

**"No employer ID found":**
- Some jobs may not have employer information in WordPress data
- These jobs are skipped and counted in the summary

**"All jobs show as not found":**
- Jobs might have been imported with different IDs
- Check the UUID generation pattern used during job import
- May need to modify the `findJobByWpId()` function to match your import logic

**Permission errors:**
- Use `SUPABASE_SERVICE_ROLE_KEY` for full update permissions
- Ensure the Supabase user has UPDATE permissions on the `jobs` table

#### Important Notes

- **Order matters**: Run `upload:users` before this script
- **Safe to re-run**: Updates are idempotent (same result each time)
- **Only updates employer_id**: Other job fields remain unchanged
- **Batch processing**: 50 jobs per batch with 100ms delay between batches
