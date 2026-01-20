# Bulk Upload Scripts

This directory contains utility scripts for managing data migrations to Supabase.

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
