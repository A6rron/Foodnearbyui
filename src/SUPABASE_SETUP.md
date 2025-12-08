# 🗄️ Supabase Setup Guide

Complete guide to setting up Supabase database for Food Nearby application.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Supabase Project](#create-supabase-project)
3. [Database Schema](#database-schema)
4. [Enable Real-time](#enable-real-time)
5. [Configure Application](#configure-application)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## ✅ Prerequisites

Before you begin, ensure you have:
- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Basic knowledge of SQL
- Node.js and npm installed locally

## 🚀 Create Supabase Project

### Step 1: Create New Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `food-nearby`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users (e.g., Singapore for Kerala)
   - **Pricing Plan**: Start with Free tier
4. Click **"Create New Project"**
5. Wait 2-3 minutes for provisioning

### Step 2: Get API Credentials

1. In your project dashboard, click **"Settings"** (gear icon)
2. Go to **"API"** section
3. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

## 📊 Database Schema

### Step 1: Open SQL Editor

1. In Supabase dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New query"**

### Step 2: Create Events Table

Copy and paste this SQL:

```sql
-- Create events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  location TEXT NOT NULL,
  gps_latitude TEXT,
  gps_longitude TEXT,
  date TEXT,
  time TEXT,
  food_type TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE events IS 'Free food events submitted via WhatsApp bot';
COMMENT ON COLUMN events.event_name IS 'Name of the event (e.g., "Wedding Reception")';
COMMENT ON COLUMN events.location IS 'Location name (e.g., "MES Hall, Aluva")';
COMMENT ON COLUMN events.gps_latitude IS 'GPS latitude as string (e.g., "10.1081")';
COMMENT ON COLUMN events.gps_longitude IS 'GPS longitude as string (e.g., "76.3525")';
COMMENT ON COLUMN events.date IS 'Event date (various formats: "Today", "Nov 21", "21/11/2024")';
COMMENT ON COLUMN events.time IS 'Event time (e.g., "7:00 PM", "5 PM")';
COMMENT ON COLUMN events.food_type IS 'Type of food event (e.g., "Wedding Ceremony", "Free Meal")';
COMMENT ON COLUMN events.verified IS 'Admin verification status';

-- Create indexes for better query performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_verified ON events(verified);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_location ON events(location);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

3. Click **"Run"** or press `Ctrl+Enter`
4. You should see: **"Success. No rows returned"**

### Step 3: Insert Sample Data (Optional)

```sql
-- Insert sample events for testing
INSERT INTO events (event_name, location, gps_latitude, gps_longitude, date, time, food_type, verified)
VALUES
  ('Wedding Reception', 'Eram Convention Centre, Thottumugham', '10.1106', '76.3525', 'Today', '7:45 PM', 'Wedding Ceremony', false),
  ('Marriage Food', 'Zambra Kalamassery', null, null, 'Tomorrow', '7:00 PM', 'Wedding Ceremony', true),
  ('Community Lunch', 'St. Mary''s Church, Aluva', '10.1089', '76.3525', 'Today', '1:00 PM', 'Free Meal', true),
  ('Charity Dinner', 'Temple Ground, Angamaly', '10.1907', '76.3876', 'Dec 24', '7:00 PM', 'Dinner', false);
```

## 🔴 Enable Real-time

Real-time subscriptions allow the website to update automatically when events are added/modified.

### Step 1: Enable Real-time for Events Table

```sql
-- Enable real-time for events table
ALTER TABLE events REPLICA IDENTITY FULL;
```

### Step 2: Configure Real-time Settings

1. Go to **"Database"** → **"Replication"** in Supabase dashboard
2. Find **"events"** table in the list
3. Toggle **"Enable"** for:
   - ✅ INSERT
   - ✅ UPDATE
   - ✅ DELETE
4. Click **"Save"**

## 🔒 Row Level Security (RLS)

Set up security policies to control data access.

### Step 1: Enable RLS

```sql
-- Enable Row Level Security on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Security Policies

```sql
-- Policy: Allow public read access to all events
CREATE POLICY "Allow public read access"
ON events
FOR SELECT
TO anon
USING (true);

-- Policy: Allow authenticated users to insert events
CREATE POLICY "Allow authenticated insert"
ON events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow service role to update events (for admin)
CREATE POLICY "Allow service role update"
ON events
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow service role to delete events (for admin)
CREATE POLICY "Allow service role delete"
ON events
FOR DELETE
TO service_role
USING (true);
```

**Important**: For WhatsApp bot integration, you'll need to use the **service_role** key (not the anon key) to insert/update events.

### Step 3: Grant Permissions

```sql
-- Grant necessary permissions
GRANT SELECT ON events TO anon;
GRANT ALL ON events TO authenticated;
GRANT ALL ON events TO service_role;
```

## ⚙️ Configure Application

### Step 1: Update Supabase Configuration

Open `/lib/supabase.ts` and update with your credentials:

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function isSupabaseConfigured() {
  return !!SUPABASE_URL && 
         !!SUPABASE_ANON_KEY && 
         SUPABASE_URL !== 'https://your-project-id.supabase.co';
}

// ... rest of the file
```

### Step 2: Environment Variables (Production)

For production, use environment variables:

1. Create `.env` file in project root:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Update `lib/supabase.ts`:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

3. Add `.env` to `.gitignore`:
```
.env
.env.local
```

## 🧪 Testing

### Test Database Connection

1. Start your development server:
```bash
npm run dev
```

2. Open browser console (F12)
3. Look for logs:
   - ✅ "Fetching events from Supabase..."
   - ✅ "Supabase connection successful"
   - ❌ "Supabase error: ..." (if there's an issue)

### Test Real-time Updates

1. Open your app in browser
2. Open Supabase dashboard → **Table Editor** → **events**
3. Click **"Insert row"**
4. Fill in:
   - `event_name`: "Test Event"
   - `location`: "Test Location"
   - `date`: "Today"
   - `time`: "8:00 PM"
   - Leave other fields as default
5. Click **"Save"**
6. Your app should automatically show the new event (no refresh needed)

### Test Admin Panel

1. Go to: `http://localhost:5173?admin=true`
2. Enter password: `admin123`
3. Try verifying/deleting events

## 📊 Database Queries

### Useful SQL Queries

**View all events:**
```sql
SELECT * FROM events ORDER BY created_at DESC;
```

**Count events by verification status:**
```sql
SELECT verified, COUNT(*) 
FROM events 
GROUP BY verified;
```

**Find today's events:**
```sql
SELECT * FROM events 
WHERE date ILIKE '%today%' 
ORDER BY time;
```

**Delete old past events:**
```sql
DELETE FROM events 
WHERE created_at < NOW() - INTERVAL '30 days'
AND date NOT ILIKE '%today%'
AND date NOT ILIKE '%tomorrow%';
```

**Update GPS coordinates:**
```sql
UPDATE events 
SET gps_latitude = '10.1081', 
    gps_longitude = '76.3525' 
WHERE location ILIKE '%aluva%';
```

## 🔧 Troubleshooting

### Issue: "Failed to fetch events"

**Solution**:
1. Check Supabase project is active (not paused)
2. Verify API credentials in `lib/supabase.ts`
3. Check RLS policies allow public read access
4. Look at browser console for specific error

### Issue: "Real-time not working"

**Solution**:
1. Verify `REPLICA IDENTITY FULL` is set:
   ```sql
   SELECT relname, relreplident 
   FROM pg_class 
   WHERE relname = 'events';
   ```
   (Should show `f` for FULL)

2. Check real-time is enabled in Database → Replication
3. Verify subscription code in `EventListings.tsx`

### Issue: "Cannot insert events"

**Solution**:
1. Check you're using **service_role** key for bot (not anon key)
2. Verify RLS policies allow insert
3. Check column names match schema exactly

### Issue: "GPS coordinates not showing"

**Solution**:
1. Ensure `gps_latitude` and `gps_longitude` are TEXT type (not numeric)
2. Check values are valid numbers as strings (e.g., "10.1081")
3. Verify parsing logic in `EventListings.tsx`:
   ```typescript
   const parsedLat = Number(event.gps_latitude);
   if (!isNaN(parsedLat)) lat = parsedLat;
   ```

## 📈 Monitoring

### Database Dashboard

Monitor your database:
1. Go to **"Database"** → **"Dashboard"**
2. Check:
   - **Size**: Ensure you're within free tier (500MB)
   - **Connections**: Should be < 50
   - **Queries**: Monitor slow queries

### Real-time Connections

Monitor real-time:
1. Go to **"Database"** → **"Replication"**
2. Check active subscriptions
3. Verify no errors in logs

## 🚀 Production Checklist

Before deploying to production:

- [ ] Set up environment variables (don't commit API keys!)
- [ ] Enable RLS policies
- [ ] Set up database backups
- [ ] Configure CORS settings if needed
- [ ] Set up monitoring/alerts
- [ ] Test on multiple devices
- [ ] Verify real-time subscriptions work
- [ ] Set up rate limiting for API
- [ ] Configure database connection pooling
- [ ] Test admin panel security

## 🔐 Security Best Practices

1. **Never commit API keys** to Git
2. **Use service_role key only in backend** (WhatsApp bot)
3. **Enable RLS** for all tables
4. **Validate input data** before inserting
5. **Sanitize user input** to prevent SQL injection
6. **Use HTTPS** in production
7. **Rotate keys** periodically
8. **Monitor access logs** for suspicious activity

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Real-time Guide](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Discord Community](https://discord.supabase.com)

## 💡 Tips

1. **Use Table Editor** for quick testing during development
2. **Enable query logging** to debug issues
3. **Set up webhooks** for event notifications (future feature)
4. **Use database functions** for complex logic
5. **Index frequently queried columns** for performance
6. **Regular backups** - use Supabase's automated backup feature

---

**Need Help?**
- Check [Supabase Discord](https://discord.supabase.com)
- Open an issue on GitHub
- Contact: [@A6rron](https://github.com/A6rron)

**Last Updated**: November 21, 2024  
**Version**: 2.0
