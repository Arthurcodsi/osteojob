# Bulk User Upload Guide

This guide explains how to upload the 2,501 users from `osteojob-users.json` to your Supabase database.

## Quick Start

### Step 1: Test Database Connection

Before uploading, verify your Supabase connection:

```bash
npm run test:db
```

Expected output:
```
✅ All tests passed! Ready to upload users.
```

### Step 2: Upload Users

Run the bulk upload script:

```bash
npm run upload:users
```

## What the Script Does

1. **Reads** `osteojob-users.json` (2,501 users)
2. **Transforms** WordPress user data to Supabase profile format
3. **Uploads** in batches of 100 for optimal performance
4. **Handles duplicates** gracefully using upsert (insert or update)
5. **Tracks progress** with real-time status updates
6. **Reports statistics** at completion

## Data Transformation

### WordPress → Supabase Mapping

| WordPress | Supabase | Transformation |
|-----------|----------|----------------|
| `id` | `id` | Converted to deterministic UUID using UUID v5 |
| `email` | `email` | Direct mapping (unique identifier) |
| `first_name + last_name` | `full_name` | Combined, falls back to display_name/username |
| `roles` | `user_type` | Maps to 'employer' or 'candidate' |
| `description` | `bio` | User biography/description |
| `registered` | `created_at` | ISO timestamp format |

### User Type Detection

- Contains `wp_job_board_pro_employer` role → `employer`
- Otherwise → `candidate`

## Expected Output

```
🚀 Starting bulk user upload...

📖 Reading users from osteojob-users.json...
✓ Found 2501 users

📦 Processing 26 batches of 100 users each...

  ✅ Batch 1/26: Inserted 100 users
  📊 Progress: 4% (100/2501)

  ✅ Batch 2/26: Inserted 100 users
  📊 Progress: 8% (200/2501)

  ... (continues for all batches)

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

## Features

### Batch Processing
- Uploads 100 users per batch
- Includes 100ms delay between batches to avoid rate limiting
- Continues even if individual batches fail

### Duplicate Handling
- Uses `upsert` with `email` as conflict key
- Existing users are updated instead of causing errors
- Duplicate count tracked in statistics

### Progress Tracking
- Real-time batch completion updates
- Percentage progress indicator
- Total records processed counter

### Error Handling
- Captures and logs errors without stopping upload
- Tracks error count in final summary
- Provides detailed error messages for debugging

## UUID Generation

The script generates deterministic UUIDs using UUID v5:
- **Namespace**: `6ba7b810-9dad-11d1-80b4-00c04fd430c8`
- **Name**: `wp-user-{wordpress_id}`
- **Result**: Same WordPress user always gets the same UUID

This ensures:
- Valid UUID format for Supabase
- Consistent IDs across multiple runs
- No duplicates from re-running the script

## Configuration

### Batch Size
To change the batch size, edit `scripts/bulk-upload-users.js`:

```javascript
const BATCH_SIZE = 100 // Change this value
```

Recommended values:
- **100** (default): Good balance of speed and reliability
- **50**: More conservative, better for slower connections
- **200**: Faster but may hit rate limits

### Delay Between Batches
To adjust the delay, edit the timeout in the script:

```javascript
await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
```

## Troubleshooting

### "Missing Supabase credentials"
- Ensure `.env.local` exists with valid credentials
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### "Duplicate key errors"
- This is normal if re-running the script
- Duplicates are handled gracefully and counted in the summary

### "Permission denied"
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` for full permissions
- Verify your Supabase user has INSERT permissions on `profiles` table

### "Connection timeout"
- Reduce `BATCH_SIZE` to process fewer records per batch
- Check your internet connection
- Verify Supabase service is accessible

### "Invalid UUID format"
- The script now generates proper UUIDs automatically
- If you see this error, ensure you're using the latest version of the script

## Post-Upload Verification

After upload completes, verify the data in Supabase:

1. **Open Supabase Dashboard**
2. **Navigate to Table Editor → profiles**
3. **Check record count** matches uploaded count
4. **Verify sample records** have correct data
5. **Test login** with a sample user email

## Re-running the Script

The script is **safe to re-run**:
- Existing users are updated (not duplicated)
- Same UUIDs are generated for same WordPress IDs
- Only new users are inserted

## Files Created

```
scripts/
├── bulk-upload-users.js    # Main upload script
├── test-connection.js       # Connection test script
└── README.md               # Detailed documentation
```

## Support

If you encounter issues:
1. Run `npm run test:db` to verify connection
2. Check the error messages in the output
3. Review the troubleshooting section above
4. Verify your Supabase credentials and permissions
