# Update Job Posters Guide

Quick guide to update the `employer_id` and `poster_id` fields for all jobs in your Supabase database.

## Quick Start

### Prerequisites

Before running this script, ensure:

1. ✅ Users have been uploaded (`npm run upload:users`)
2. ✅ Jobs exist in the Supabase database
3. ✅ `osteojob-jobs.json` file is in the project root

### Run the Update

```bash
npm run update:job-posters
```

## What This Script Does

The script updates both `employer_id` and `poster_id` fields for all jobs by:

1. Reading job data from `osteojob-jobs.json` (244 jobs)
2. Loading all profiles from Supabase (to lookup WordPress user IDs)
3. Loading all jobs from Supabase for matching
4. **Extracting WordPress user ID** from each job (`author_id` or `_job_employer_posted_by`)
5. **Finding matching profile** by `wordpress_user_id` field
6. **Using profile's UUID** for both `employer_id` and `poster_id`
7. **Matching jobs by title, location, and posted date** (since job IDs differ)
8. **Fallback to placeholder** (`00000000-0000-0000-0000-000000000001`) if no profile found

**Note**: If the `poster_id` column doesn't exist in your database, the script will only update `employer_id` and notify you. You can re-run the script after adding the column.

## Job Matching Strategy

Since WordPress job IDs don't match Supabase UUIDs, the script uses **multiple fields** to find the correct job:

### Matching Criteria (ALL must match):

1. **Title** - Exact match (case-insensitive, normalized spaces)
2. **Location Country** - Must match if available
3. **Location City** - Must match if available
4. **Posted Date** - Must match within 1 second (handles timezone differences)

### Handling Duplicate Titles

If multiple jobs have identical titles:
- The script compares location and date to find the unique match
- If still multiple matches, it uses the **first match** and logs a warning
- Total multiple matches are reported in the summary

## Employer ID Extraction

For each job, the script finds the employer ID in this order:

1. **`meta._job_employer_posted_by`** - The WordPress Job Board plugin's employer field
2. **`author_id`** - Falls back to the WordPress post author

## Employer ID Lookup

The script finds the correct employer UUID using the `wordpress_user_id` field:

### How it works:

1. **Extract WordPress ID** from job JSON:
   - Tries `meta._job_employer_posted_by` first
   - Falls back to `author_id`

2. **Lookup Profile**:
   - Searches profiles table where `wordpress_user_id = <WordPress ID>`
   - Uses the profile's UUID as employer_id

3. **Placeholder Fallback**:
   - If no matching profile found, uses `00000000-0000-0000-0000-000000000001`
   - You'll see a warning in the output for these jobs

### Example:
```
WordPress Job → author_id: "329"
↓
Lookup Profile → WHERE wordpress_user_id = '329'
↓
Use Profile UUID → employer_id = <profile.id>
```

**Important**: Profiles must have `wordpress_user_id` set for matching to work!

## Expected Output

```
🚀 Starting job poster ID updates...

📖 Reading jobs from osteojob-jobs.json...
✓ Found 244 jobs

📊 Jobs with employer info: 240
⚠️  Jobs without employer info: 4

📥 Loading all profiles from Supabase for WordPress ID lookup...
✓ Loaded 2501 profiles from Supabase
✓ 240 profiles have wordpress_user_id set

📥 Loading all jobs from Supabase for matching...
✓ Loaded 244 jobs from Supabase

📦 Processing 240 jobs...
────────────────────────────────────────────────────────────────────────────────
✅ [1/240] Updated "Associate Osteopath" (Whangarei, New-Zealand)
✅ [2/240] Updated "Associate osteopath" (Maidstone, United Kingdom)
⚠️  [3/240] Job "Locum Osteopath" - WordPress user 999 not found, using placeholder
✅ [3/240] Updated "Locum Osteopath" (London, United Kingdom) (placeholder)
⚠️  [4/240] Job "Osteopath Needed" - Not found in database
...

================================================================================
📈 Update Summary
================================================================================
Total jobs in file:      244
Jobs in Supabase:        244
Profiles loaded:         2501
✅ Updated:              235
⚠️  Used placeholder:     5
⚠️  Not found in DB:      5
⚠️  Multiple matches:     3
⚠️  Skipped (no emp):     4
❌ Errors:               0
⏱️  Duration:             10.50s
================================================================================

⚠️  Note: Some jobs used placeholder employer ID.
   5 job(s) had WordPress user IDs not found in profiles table.
   These jobs were assigned to placeholder employer: 00000000-0000-0000-0000-000000000001
   Ensure profiles have wordpress_user_id set, then re-run this script.

✅ Update completed successfully! Updated 235 job(s).
```

## Understanding the Results

### Updated ✅
Jobs that were successfully found in the database and had their fields updated:
- `employer_id` is always updated
- `poster_id` is updated if the column exists (both set to same value)

### poster_id Column Behavior

The script attempts to update **both** `employer_id` and `poster_id` to the same value since the poster is always the employer.

**If `poster_id` column exists:**
- Both fields are updated successfully
- No special message shown

**If `poster_id` column doesn't exist:**
- Only `employer_id` is updated
- Script shows: "📝 Note: poster_id column not found in database"
- You can add the column later and re-run the script

To add the `poster_id` column to your database:
```sql
ALTER TABLE jobs ADD COLUMN poster_id UUID REFERENCES profiles(id);
```

Then re-run: `npm run update:job-posters`

### Used Placeholder ⚠️

Jobs that were assigned the placeholder employer ID:
- WordPress user ID from job wasn't found in profiles table
- Assigned to: `00000000-0000-0000-0000-000000000001`

**Why this happens:**
- Profile doesn't have `wordpress_user_id` set
- WordPress user was never imported to profiles
- Mismatch between job's author_id and profile wordpress_user_id

**How to fix:**
1. Ensure profiles have `wordpress_user_id` populated
2. Run user upload script if users aren't in database
3. Re-run this script to update with correct employer IDs

### Not Found in DB ⚠️
Jobs from the JSON file that don't exist in Supabase:
- Jobs may not have been imported yet
- Job titles, locations, or dates were modified after import
- Check if you need to import jobs first

### Multiple Matches ⚠️
Jobs that matched more than one database record:
- Usually happens with generic titles like "Osteopath Required"
- Script uses the first match (earliest by date)
- Verify these jobs manually if accuracy is critical

### Skipped (no emp) ⚠️
Jobs that don't have employer information in the WordPress data:
- No `_job_employer_posted_by` in meta
- No `author_id` field
- These jobs cannot be assigned to an employer

### Errors ❌
Jobs that encountered errors during update:
- Database permission issues
- Invalid data
- Network problems

## Common Issues

### "Jobs not found in database"

**Problem**: Script reports many jobs as "not found"

**Solutions**:
1. Verify jobs exist in Supabase: Check the jobs table in your dashboard
2. Compare job titles, locations, and dates between WordPress and Supabase
3. If data was modified after import, matching may fail
4. Check that jobs were imported with the same field values

### "Multiple matches found"

**Problem**: Some jobs match multiple database records

**Explanation**: This is normal for jobs with:
- Generic titles (e.g., "Osteopath Required", "Associate Osteopath")
- Same location and posted date

**Solution**:
- The script uses the first match automatically
- If critical, review these jobs manually and update if needed
- Consider adding more specific matching criteria

### "No employer ID found"

**Problem**: Some jobs are skipped with no employer info

**Solution**: This is normal for jobs that don't have employer data in WordPress. These jobs need manual assignment or should be excluded.

### "Permission denied"

**Problem**: Can't update jobs due to permissions

**Solutions**:
1. Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` file
2. Verify your database role has UPDATE permissions on the jobs table

## Matching Algorithm Details

The script uses a smart matching algorithm:

```javascript
// 1. Normalize all strings (lowercase, trim, remove extra spaces)
// 2. Match criteria:
titleMatch = normalize(wpTitle) === normalize(dbTitle)
locationMatch = normalize(wpLocation) === normalize(dbLocation)
cityMatch = normalize(wpCity) === normalize(dbCity)
dateMatch = Math.abs(wpDate - dbDate) < 1000ms  // 1 second tolerance

// 3. Final match requires:
match = titleMatch && locationMatch && cityMatch && dateMatch
```

### Why Date Tolerance?

The 1-second tolerance handles:
- Timezone differences during import
- Rounding differences in timestamp conversion
- Slight variations in date parsing

## Verification After Update

After running the script, verify the updates:

1. **Check Supabase Dashboard**
   - Go to Table Editor → jobs
   - Verify `employer_id` field is populated
   - Check a few sample jobs

2. **Test on Frontend**
   - Visit a job page on your website
   - Verify employer information displays correctly
   - Check that employer profiles link properly

3. **Query the Database**
   ```sql
   SELECT id, title, employer_id, location_city, location_country
   FROM jobs
   WHERE employer_id IS NOT NULL
   LIMIT 10;
   ```

4. **Verify Multiple Matches** (if any)
   ```sql
   -- Check jobs that had multiple matches
   SELECT title, COUNT(*) as count
   FROM jobs
   GROUP BY title
   HAVING COUNT(*) > 1;
   ```

## Safe to Re-run

This script is **safe to re-run** multiple times:
- Uses UPDATE queries (not INSERT)
- Idempotent (same result each time)
- Won't create duplicates
- Only updates `employer_id` field
- Loads fresh data from database each run

## Performance

- **Loading phase**: Loads all Supabase jobs into memory (~1-2 seconds)
- **Matching**: In-memory comparison (very fast)
- **Updates**: Sequential with 100ms delay every 10 jobs
- **Estimated time**: ~10-15 seconds for 244 jobs

## Script Execution Order

For a complete migration from WordPress to Supabase:

1. **Upload Users** (required first)
   ```bash
   npm run upload:users
   ```

2. **Import Jobs** (must be done before this script)
   ```bash
   # Use your job import script
   ```

3. **Update Job Posters** (this script)
   ```bash
   npm run update:job-posters
   ```

## Additional Help

- **Full documentation**: See `scripts/README.md`
- **Test connection**: Run `npm run test:db` first
- **Troubleshooting**: Check the detailed troubleshooting section in `scripts/README.md`

## Files

```
scripts/
├── update-job-posters.js    # Main update script (updated with matching logic)
├── bulk-upload-users.js     # User upload (prerequisite)
├── test-connection.js       # Connection tester
└── README.md               # Detailed documentation
```
