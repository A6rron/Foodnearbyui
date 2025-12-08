# 🍽️ Food Nearby

**Find free food events near you in real-time**

Food Nearby is a web application that helps you discover free food events like weddings, catering, and community gatherings in your area. Submit events via WhatsApp and get instant updates with auto-location detection.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)

## ✨ Features

### 🎯 Core Features
- **Auto-location Detection** - Automatically finds events near you (fallback: Aluva, Kerala)
- **Real-time Updates** - Events sync instantly via Supabase real-time subscriptions
- **WhatsApp Integration** - Submit events by sending messages to +91 7304483935
- **Distance-based Sorting** - Events sorted by time first, then proximity
- **Google Maps Integration** - Click locations to open in Google Maps
- **Verified Events** - Green checkmarks for admin-verified events with hover tooltips
- **Dark Theme** - Beautiful dark UI with specific colors (#0f172a, #111827, #1f2937)
- **Mobile Responsive** - Fully responsive design with mobile-optimized UI

### 📱 User Interface
- **Sticky Navbar** - GitHub link and "How It Works" popover
- **Gradient Hero Section** - Clickable location icons for manual location detection
- **Event Sections**:
  - **Today** - Events happening today with red "Today" badges
  - **Upcoming** - Future events sorted by date
  - **Past Events Page** - Separate page for historical events (accessible via link)
- **Event Cards** - Rounded cards with hover effects showing:
  - Event name and category
  - Location with GPS coordinates
  - Distance from user (in km)
  - Verified badge (if admin-verified)
  - Map link icon with hover effect

### 🤖 WhatsApp Bot Integration
- **Multiple Submission Methods**:
  - Send event posters/flyers (AI extracts details)
  - Type event details ("Marriage at MES Hall, 5 PM today")
  - Share photos with GPS location
- **Smart Date Parsing** - Understands "today", "tomorrow", natural dates
- **Automatic Processing** - Bot extracts event details and updates database

### 👨‍💼 Admin Panel
- Access via `?admin=true` with password `admin123`
- Verify/unverify events
- Delete events
- Real-time event management

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS 4.0** for styling
- **Vite** for build tooling
- **Shadcn/ui** components
- **Lucide React** for icons
- **Motion** (Framer Motion) for animations

### Backend
- **Supabase** - PostgreSQL database
- **Real-time Subscriptions** - Live event updates
- **Row Level Security** - Secure data access

### Database Schema
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_name TEXT,
  location TEXT,
  gps_latitude TEXT,
  gps_longitude TEXT,
  date TEXT,
  time TEXT,
  food_type TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### WhatsApp Bot
- **Repository**: [food-nearby-bot](https://github.com/A6rron/food-nearby-bot)
- **AI-powered** text/image extraction
- **Automatic** database updates
- **Multi-format** support (posters, text, photos)

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- Supabase account
- WhatsApp Business API (optional, for bot)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/A6rron/food-nearby.git
   cd food-nearby
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Create a new Supabase project
   - Run the database schema (see Database section above)
   - Copy your Supabase URL and Anon Key
   - Update `/lib/supabase.ts` with your credentials

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🗺️ How It Works

### User Flow
```
User → WhatsApp (+91 7304483935) → Bot → Supabase → Website
```

1. **User submits event** via WhatsApp (poster, text, or photo)
2. **Bot processes** submission and extracts event details
3. **Database updates** in real-time via Supabase
4. **Website refreshes** automatically with new events
5. **Users see events** sorted by time and distance

### Navigation
- **Home Page** (`/`) - Today and upcoming events
- **Past Events** (`#past-events`) - Historical events
- **Admin Panel** (`?admin=true`) - Event management

## 🎨 Design Specifications

### Colors
- **Background**: `#0f172a`
- **Navbar**: `#111827`
- **Cards**: `#1f2937`
- **Accent**: Green (`#10b981` for verified badges)
- **Alert**: Red (`#dc2626` for "Today" badges)

### Typography
- **Primary Font**: Inter
- **Code Font**: JetBrains Mono

### Components
- **Navbar**: Sticky, with GitHub link and How It Works popover
- **Hero**: Gradient background with location icons
- **Event Cards**: Rounded with hover effects
- **Badges**: Green verified badges, red "Today" badges
- **Footer**: Figma logo with dimmed styling

## 📱 Features in Detail

### Location Detection
```typescript
// Fallback location: Aluva, Kerala
const FALLBACK_LOCATION = {
  lat: 10.1081,
  lng: 76.3525,
};

// Auto-detect on page load
navigator.geolocation.getCurrentPosition(
  (position) => {
    setUserLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
  },
  () => {
    // Use fallback on error
    setUserLocation(FALLBACK_LOCATION);
  }
);
```

### Distance Calculation
Uses Haversine formula for accurate distance calculation:
```typescript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}
```

### Smart Date Parsing
Supports multiple date formats:
- "Today", "Tomorrow"
- "Nov 21", "December 25"
- "21/11/2024", "2024-11-21"
- "5 PM today", "7:00 PM tomorrow"

### Real-time Subscriptions
```typescript
const subscription = supabase
  .channel('events_channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'events' },
    (payload) => {
      // Refetch events when changes occur
      fetchEvents();
    }
  )
  .subscribe();
```

## 🔒 Admin Access

Access the admin panel:
```
https://yourwebsite.com?admin=true
Password: admin123
```

### Admin Features
- ✅ Verify events (adds green checkmark)
- ❌ Delete events
- 🔄 Real-time updates
- 📊 View all events including unverified

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling (no inline styles unless necessary)
- Maintain dark theme consistency
- Test on both desktop and mobile
- Ensure Supabase real-time works correctly

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

**Food Nearby - At Your Risk**

This application provides community-submitted event information. We do not verify the safety, quality, or availability of food at events. Always:
- Verify event details before attending
- Check food safety and hygiene
- Attend events at your own discretion
- Follow local health guidelines

## 🙏 Acknowledgments

- **Shadcn/ui** - Beautiful UI components
- **Supabase** - Backend infrastructure
- **Tailwind CSS** - Styling framework
- **Lucide Icons** - Icon library
- **Community Contributors** - Event submissions

## 📞 Contact

- **WhatsApp Bot**: +91 7304483935
- **GitHub**: [@A6rron](https://github.com/A6rron)
- **Repository**: [food-nearby-bot](https://github.com/A6rron/food-nearby-bot)

## 🚀 Roadmap

- [ ] Email notifications for new events
- [ ] Event categories filter
- [ ] Event rating system
- [ ] User profiles and favorites
- [ ] iOS/Android mobile apps
- [ ] Multi-language support (Malayalam, Hindi)
- [ ] Event photos gallery
- [ ] Social media sharing

---

**Built with ❤️ by [A6rron](https://github.com/A6rron)**

**Food Nearby - Find Free Food Events Near You**
