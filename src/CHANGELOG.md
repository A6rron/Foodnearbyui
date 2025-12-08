# 📝 Changelog

All notable changes to the Food Nearby project.

## [2.0.0] - 2024-11-21

### 🎉 Major Changes

#### Past Events Page
- **NEW**: Dedicated Past Events page accessible via `#past-events` hash route
- **REMOVED**: Dropdown/collapsible past events section from home page
- **ADDED**: "View Past Events" link at bottom of event listings (with count badge)
- **IMPROVED**: Past events now displayed in dedicated full-page view
- **FEATURE**: Back to Home button on past events page
- **SORTING**: Past events sorted by most recent first
- **STYLING**: Dimmed event cards (60% opacity) with hover effect (80%)

#### Navigation & Routing
- **ADDED**: Hash-based routing system in `App.tsx`
- **ROUTES**:
  - `/` or `#` → Home page (Today + Upcoming events)
  - `#past-events` → Past Events page
  - `?admin=true` → Admin panel
- **FEATURE**: Browser back button support for navigation
- **FEATURE**: URL updates when navigating between pages

#### UI Improvements
- **IMPROVED**: Mobile-responsive How It Works popover
- **FEATURE**: Responsive width (full-width on mobile, fixed on desktop)
- **FEATURE**: Adaptive text sizes for mobile/desktop
- **STYLING**: Green bullet points for better visibility
- **STYLING**: Example cards with borders and improved contrast
- **FEATURE**: Centered flow diagram for better mobile layout

### 📚 Documentation

#### New Files
- **README.md** - Complete project documentation with setup guide
- **PROJECT_STRUCTURE.md** - Detailed file structure and architecture
- **SUPABASE_SETUP.md** - Step-by-step database setup guide
- **META_INFO.md** - SEO and marketing meta information
- **CHANGELOG.md** - This file

#### Updated Content
- Complete feature documentation
- Installation instructions
- Tech stack details
- Database schema documentation
- Troubleshooting guides
- Contributing guidelines

### 🔧 Technical Changes

#### Components
- **CREATED**: `/components/PastEventsPage.tsx`
- **DELETED**: `/components/PastEventsSection.tsx`
- **UPDATED**: `/components/EventListings.tsx` - Removed past events dropdown, added link
- **UPDATED**: `/components/HowItWorksPopover.tsx` - Mobile-responsive design
- **UPDATED**: `/App.tsx` - Added routing logic

#### Routing System
```typescript
// Hash-based navigation
const [currentPage, setCurrentPage] = useState<'home' | 'past-events'>('home');

useEffect(() => {
  const handleHashChange = () => {
    const hash = window.location.hash;
    if (hash === '#past-events') {
      setCurrentPage('past-events');
    } else {
      setCurrentPage('home');
    }
  };
  
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
  
  return () => {
    window.removeEventListener('hashchange', handleHashChange);
  };
}, []);
```

#### Data Flow
- Past events fetched separately on Past Events page
- Real-time subscriptions on both pages
- Shared event processing logic
- Consistent distance calculations

### 🎨 Design Updates

#### Colors
- Background: `#0f172a`
- Navbar: `#111827`
- Cards: `#1f2937`
- Past events opacity: 60% (hover: 80%)

#### Typography
- Mobile: Smaller text sizes (`text-xs`, `text-sm`)
- Desktop: Standard sizes (`sm:text-sm`, `sm:text-base`)
- Responsive headings throughout

#### Spacing
- Mobile: Tighter gaps (`space-y-3`, `p-4`)
- Desktop: Standard spacing (`sm:space-y-4`, `sm:p-5`)

### 🐛 Bug Fixes
- Fixed popover overflow on mobile devices
- Fixed text readability on small screens
- Fixed navigation state management
- Fixed real-time subscription cleanup

### ⚡ Performance
- Lazy loading of Past Events page
- Separate data fetching per page
- Optimized real-time subscriptions
- Efficient event filtering and sorting

## [1.0.0] - 2024-11-20

### Initial Release

#### Core Features
- Auto-location detection with Aluva fallback
- WhatsApp bot integration (+91 7304483935)
- Real-time Supabase database
- Today/Upcoming event sections
- Distance-based sorting
- Google Maps integration
- Admin verification system
- Dark theme UI

#### Components
- Navbar with GitHub link
- Hero section with location icons
- Event listings with cards
- Event cards with badges
- Footer with Figma logo
- Admin panel with authentication

#### Database
- Supabase PostgreSQL
- Events table with schema
- Real-time subscriptions
- Row Level Security

#### WhatsApp Bot
- AI-powered text extraction
- Image/poster scanning
- Multiple submission formats
- Automatic database updates

---

## 🔮 Upcoming Features

### Version 2.1 (Planned)
- [ ] Search and filter functionality
- [ ] Event categories dropdown
- [ ] Distance filter slider
- [ ] Calendar view for events
- [ ] Export events to Google Calendar

### Version 2.2 (Planned)
- [ ] User accounts and profiles
- [ ] Favorite events feature
- [ ] Event reminders
- [ ] Push notifications
- [ ] Social sharing buttons

### Version 3.0 (Future)
- [ ] Mobile apps (iOS/Android)
- [ ] Multi-language support (Malayalam, Hindi)
- [ ] Event photos gallery
- [ ] Rating and review system
- [ ] Event organizer profiles

---

## 📋 Version History

| Version | Date | Description |
|---------|------|-------------|
| **2.0.0** | 2024-11-21 | Past Events page, mobile improvements, documentation |
| **1.0.0** | 2024-11-20 | Initial release with core features |

---

## 🔄 Migration Guide

### From v1.0 to v2.0

#### For Users
- **Past Events**: Now accessible via dedicated page instead of dropdown
- **Navigation**: Use "View Past Events" link at bottom of home page
- **URL**: Past events accessible at `yoursite.com#past-events`

#### For Developers
1. Update `App.tsx` to include routing logic
2. Delete `/components/PastEventsSection.tsx`
3. Create `/components/PastEventsPage.tsx`
4. Update `EventListings.tsx` to remove past events dropdown
5. Test navigation between pages
6. Verify real-time subscriptions work on both pages

#### Breaking Changes
- ⚠️ `PastEventsSection` component removed
- ⚠️ Past events no longer shown on home page
- ✅ New routing system requires hash-based navigation

---

## 📝 Notes

### Semantic Versioning
This project follows [Semantic Versioning](https://semver.org/):
- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backwards compatible
- **Patch** (0.0.X): Bug fixes, backwards compatible

### Changelog Format
This changelog follows [Keep a Changelog](https://keepachangelog.com/):
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes

---

**Maintained by**: [@A6rron](https://github.com/A6rron)  
**Project**: [food-nearby-bot](https://github.com/A6rron/food-nearby-bot)  
**Last Updated**: November 21, 2024
