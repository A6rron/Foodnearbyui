# 🚀 Quick Start Guide

Get Food Nearby up and running in 5 minutes!

## ⚡ TL;DR

```bash
# 1. Clone and install
git clone https://github.com/A6rron/food-nearby.git
cd food-nearby
npm install

# 2. Configure Supabase (see step 3 below)
# Edit /lib/supabase.ts with your credentials

# 3. Run
npm run dev
```

## 📋 Prerequisites

- ✅ Node.js 18+ installed
- ✅ Supabase account (free tier works)
- ✅ 5 minutes of your time

## 🔧 Step-by-Step Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/A6rron/food-nearby.git
cd food-nearby
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- React + TypeScript
- Tailwind CSS
- Supabase client
- UI components
- And more...

### Step 3: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in details:
   - Name: `food-nearby`
   - Password: (choose a strong one)
   - Region: (closest to you)
4. Wait 2-3 minutes for setup

### Step 4: Create Database Table

1. In Supabase, go to **SQL Editor**
2. Run this SQL:

```sql
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
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable real-time
ALTER TABLE events REPLICA IDENTITY FULL;

-- Create indexes
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_verified ON events(verified);
```

3. Go to **Database** → **Replication**
4. Enable real-time for `events` table

### Step 5: Get API Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### Step 6: Configure Application

Edit `/lib/supabase.ts`:

```typescript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

Replace with your actual credentials from step 5.

### Step 7: Add Sample Data (Optional)

In Supabase SQL Editor:

```sql
INSERT INTO events (event_name, location, gps_latitude, gps_longitude, date, time, food_type, verified)
VALUES
  ('Wedding Reception', 'Eram Convention Centre, Thottumugham', '10.1106', '76.3525', 'Today', '7:45 PM', 'Wedding Ceremony', false),
  ('Community Lunch', 'St. Mary''s Church, Aluva', '10.1089', '76.3525', 'Today', '1:00 PM', 'Free Meal', true);
```

### Step 8: Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Step 9: Test Features

✅ **Location Detection**: Click location icon in hero section  
✅ **Real-time Updates**: Add event in Supabase, see it appear instantly  
✅ **Past Events**: Navigate to `#past-events` to see past events page  
✅ **Admin Panel**: Visit `?admin=true`, password: `admin123`

### Step 10: Build for Production

```bash
npm run build
```

Deploy the `dist/` folder to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting

## 🎯 Quick Tests

### Test Real-time

1. Open app in browser
2. Open Supabase Table Editor
3. Insert new event
4. Watch it appear in app (no refresh!)

### Test Location

1. Click location icon in hero
2. Allow browser location access
3. Events should re-sort by distance

### Test Admin

1. Go to `http://localhost:5173?admin=true`
2. Password: `admin123`
3. Try verifying/deleting events

### Test Past Events

1. Insert event with past date in Supabase
2. Click "View Past Events" link
3. See past events page

## 📱 Test on Mobile

```bash
# Get your local IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Access from phone
http://192.168.x.x:5173
```

## 🐛 Common Issues

### "Failed to fetch events"
**Solution**: Check Supabase credentials in `/lib/supabase.ts`

### "Real-time not working"
**Solution**: Enable real-time in Supabase Database → Replication

### "No events showing"
**Solution**: Add sample data (Step 7)

### "Location not detected"
**Solution**: Allow browser location access. Fallback: Aluva, Kerala

## 🎨 Customization

### Change Colors

Edit `/styles/globals.css`:

```css
:root {
  --background: #0f172a;  /* Change this */
  --navbar: #111827;      /* And this */
  --card: #1f2937;        /* And this */
}
```

### Change Default Location

Edit `/App.tsx`:

```typescript
const FALLBACK_LOCATION = {
  lat: 10.1081,  // Your latitude
  lng: 76.3525,  // Your longitude
};
```

### Change WhatsApp Number

Edit `/components/Hero.tsx`:

```typescript
const WHATSAPP_NUMBER = '+917304483935';  // Your number
```

## 📚 Next Steps

1. **Read Full Docs**: Check `README.md` for complete documentation
2. **Setup WhatsApp Bot**: See [food-nearby-bot](https://github.com/A6rron/food-nearby-bot)
3. **Configure Security**: Read `SUPABASE_SETUP.md` for RLS policies
4. **Deploy**: Follow deployment guide in README

## 🔗 Useful Links

- 📖 [Full Documentation](./README.md)
- 🗄️ [Supabase Setup Guide](./SUPABASE_SETUP.md)
- 🏗️ [Project Structure](./PROJECT_STRUCTURE.md)
- 📝 [Changelog](./CHANGELOG.md)
- 🤖 [WhatsApp Bot Repo](https://github.com/A6rron/food-nearby-bot)

## 💡 Pro Tips

1. **Use mock data first** - Test UI without Supabase
2. **Enable dev tools** - Check console for logs
3. **Test real-time immediately** - Verify it works before building features
4. **Use Table Editor** - Faster than writing SQL for testing
5. **Check mobile responsiveness** - Use browser dev tools

## 🎉 You're Done!

Your Food Nearby app should now be running! 🍽️

### What You Have:
✅ Auto-location detection  
✅ Real-time event updates  
✅ Today/Upcoming/Past events  
✅ Google Maps integration  
✅ Admin panel  
✅ Dark theme UI  
✅ Mobile responsive  

### What's Next:
- Set up WhatsApp bot for submissions
- Deploy to production
- Share with your community
- Customize for your needs

---

**Need Help?**
- 📧 Open an issue on GitHub
- 💬 Check Supabase Discord
- 📱 WhatsApp: +91 7304483935

**Built with ❤️ by [@A6rron](https://github.com/A6rron)**

---

**Time taken**: ~5 minutes ⏱️  
**Difficulty**: Easy 🟢  
**Cost**: Free with Supabase free tier 💰
