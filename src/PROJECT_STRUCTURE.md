# 📁 Food Nearby - Project Structure

Complete documentation of the project's file structure and organization.

## 📂 Root Structure

```
food-nearby/
├── src/
│   ├── components/        # React components
│   ├── lib/              # Libraries and utilities
│   ├── utils/            # Helper functions
│   ├── styles/           # Global styles
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── docs/                 # Documentation files
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS config
└── vite.config.ts        # Vite configuration
```

## 🎨 Component Structure

### `/components` Directory

#### Core Components

**App.tsx** - Main application component
- Handles routing (home, past-events, admin)
- Manages location detection
- Coordinates page navigation
```typescript
export default function App() {
  // Location state management
  // Page routing logic
  // Admin panel access
}
```

**Navbar.tsx** - Top navigation bar
- Sticky positioning
- GitHub link
- How It Works popover
- Dark theme (#111827)
```typescript
export function Navbar() {
  // Navigation items
  // Logo/branding
}
```

**Hero.tsx** - Hero section with gradient
- Location status display
- Clickable location icons
- Gradient background
- Aluva, Kerala fallback info
```typescript
export function Hero({ 
  locationStatus, 
  onLocationClick 
}) {
  // Location detection UI
  // WhatsApp submission button
}
```

**EventListings.tsx** - Main events display
- Fetches events from Supabase
- Real-time subscriptions
- Sorts events (Today/Upcoming)
- Distance calculations
- Link to Past Events page
```typescript
export function EventListings({ userLocation }) {
  // Fetch events
  // Process and sort
  // Render Today/Upcoming sections
  // Show past events link
}
```

**EventCard.tsx** - Individual event card
- Event details display
- Distance badge
- Verified badge with tooltip
- Map link with hover effect
- "Today" badge for current events
```typescript
export function EventCard({ event }) {
  // Event name, location, time
  // Distance display
  // Verified status
  // Map integration
}
```

**PastEventsPage.tsx** - Past events page
- Shows historical events
- Back to home button
- Dimmed event cards
- Sorted by most recent first
```typescript
export function PastEventsPage({ userLocation }) {
  // Fetch all events
  // Filter past events
  // Sort by date descending
}
```

**HowItWorksPopover.tsx** - Info popover
- Mobile-responsive design
- Submission types
- Flow diagram
- Examples
```typescript
export function HowItWorksPopover() {
  // Popover trigger
  // Content sections
  // Mobile optimizations
}
```

**Footer.tsx** - Bottom footer
- Figma "6" logo (dimmed)
- Copyright info
- Links
```typescript
export function Footer() {
  // Logo display
  // Footer links
}
```

**AdminPanel.tsx** - Admin interface
- Password protection (admin123)
- Event verification
- Event deletion
- Real-time updates
```typescript
export function AdminPanel() {
  // Authentication
  // Event management
  // Verify/delete actions
}
```

#### Shadcn/ui Components (`/components/ui`)

Pre-built UI components from Shadcn:

- **button.tsx** - Button component with variants
- **card.tsx** - Card container with header/content/footer
- **badge.tsx** - Badge/tag component
- **popover.tsx** - Popover for How It Works
- **tooltip.tsx** - Tooltip for verified badges
- **dialog.tsx** - Modal dialogs
- **input.tsx** - Form inputs
- **alert.tsx** - Alert messages
- **skeleton.tsx** - Loading skeletons
- **scroll-area.tsx** - Custom scrollbars
- And more...

## 🛠️ Utilities

### `/lib` Directory

**supabase.ts** - Supabase client configuration
```typescript
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Event type definition
export interface Event {
  id: number;
  event_name: string;
  location: string;
  gps_latitude: string;
  gps_longitude: string;
  date: string;
  time: string;
  food_type: string;
  verified: boolean;
  created_at: string;
}

// Fetch events function
export async function fetchEventsFromSupabase() {
  // Query events table
  // Handle errors
  // Return processed data
}

// Check if configured
export function isSupabaseConfigured() {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}
```

### `/utils` Directory

**distance.ts** - Haversine distance calculation
```typescript
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number | null, 
  lng2: number | null
): number {
  // Return Infinity if coordinates missing
  // Use Haversine formula
  // Return distance in kilometers
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
```

**dateParser.ts** - Smart date parsing
```typescript
export function parseEventTime(timeString: string) {
  // Parse "today", "tomorrow"
  // Handle various date formats
  // Return { date, isToday, isPast }
}

export function formatEventTime(date: Date): string {
  // Format for display
  // "Today, 5:00 PM"
  // "Nov 21, 7:00 PM"
}

// Supported formats:
// - "Today", "Tomorrow"
// - "Nov 21", "December 25"
// - "21/11/2024", "2024-11-21"
// - "5 PM today", "7:00 PM tomorrow"
```

## 🎨 Styles

### `/styles` Directory

**globals.css** - Global styles and Tailwind
```css
@import 'tailwindcss';

/* Custom CSS variables */
:root {
  --background: #0f172a;
  --card: #1f2937;
  --navbar: #111827;
}

/* Typography defaults */
body {
  font-family: 'Inter', sans-serif;
}

code {
  font-family: 'JetBrains Mono', monospace;
}

/* Custom utility classes */
.gradient-hero {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}
```

## 📊 Database Schema

### Supabase Tables

**events** table:
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

-- Indexes for performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_verified ON events(verified);
CREATE INDEX idx_events_created_at ON events(created_at);

-- Enable real-time
ALTER TABLE events REPLICA IDENTITY FULL;
```

## 🔄 Data Flow

### Application Data Flow

```
┌─────────────────────────────────────────────────┐
│                   User Action                   │
└─────────────────┬───────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
    v                           v
┌───────────┐            ┌──────────────┐
│ Location  │            │  WhatsApp    │
│ Detection │            │  Submission  │
└─────┬─────┘            └──────┬───────┘
      │                         │
      v                         v
┌─────────────────────────────────────────────────┐
│              Supabase Database                  │
│  - Events table                                 │
│  - Real-time subscriptions                      │
│  - Row Level Security                           │
└─────────────────┬───────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
    v                           v
┌───────────┐            ┌──────────────┐
│  Home     │            │ Past Events  │
│  Page     │            │    Page      │
└───────────┘            └──────────────┘
```

### Event Processing Flow

```
WhatsApp Message
      │
      v
    Bot AI
      │
      v
  Extract Data
      │
      v
Supabase Insert
      │
      v
Real-time Update
      │
      v
React Component
      │
      v
Process & Filter
      │
      v
Sort by Time/Distance
      │
      v
    Display
```

## 🚀 Routing

### Hash-based Navigation

```typescript
// Home page
window.location.hash = ''

// Past events page
window.location.hash = '#past-events'

// Admin panel
window.location.search = '?admin=true'
```

### Route Handling in App.tsx

```typescript
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

## 📦 Dependencies

### Core Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.0.0",
  "@supabase/supabase-js": "^2.38.0",
  "lucide-react": "^0.292.0",
  "tailwindcss": "^4.0.0",
  "vite": "^5.0.0"
}
```

### UI Component Dependencies
```json
{
  "@radix-ui/react-popover": "^1.0.7",
  "@radix-ui/react-tooltip": "^1.0.7",
  "@radix-ui/react-dialog": "^1.0.5",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

## 🔧 Configuration Files

### **tsconfig.json** - TypeScript config
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### **vite.config.ts** - Vite configuration
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### **package.json** - Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

## 📝 Documentation Files

- **README.md** - Main project documentation
- **PROJECT_STRUCTURE.md** - This file
- **META_INFO.md** - SEO and meta information
- **SUPABASE_SETUP.md** - Database setup guide

## 🎯 Key Features by File

| Feature | Primary File | Supporting Files |
|---------|-------------|------------------|
| Location Detection | App.tsx | Hero.tsx, utils/distance.ts |
| Event Display | EventListings.tsx | EventCard.tsx |
| Past Events | PastEventsPage.tsx | EventCard.tsx |
| Real-time Updates | lib/supabase.ts | EventListings.tsx, PastEventsPage.tsx |
| Date Parsing | utils/dateParser.ts | EventListings.tsx, PastEventsPage.tsx |
| Distance Calculation | utils/distance.ts | EventListings.tsx |
| Admin Panel | AdminPanel.tsx | lib/supabase.ts |
| How It Works | HowItWorksPopover.tsx | Navbar.tsx |
| Navigation | App.tsx | All page components |

## 🔍 File Relationships

```
App.tsx
├── Navbar.tsx
│   └── HowItWorksPopover.tsx
├── Hero.tsx
├── EventListings.tsx
│   └── EventCard.tsx
├── PastEventsPage.tsx
│   └── EventCard.tsx
├── AdminPanel.tsx
└── Footer.tsx

lib/supabase.ts
└── Used by: EventListings, PastEventsPage, AdminPanel

utils/distance.ts
└── Used by: EventListings, PastEventsPage

utils/dateParser.ts
└── Used by: EventListings, PastEventsPage
```

## 🏗️ Build Output

```
dist/
├── assets/
│   ├── index-[hash].css
│   ├── index-[hash].js
│   └── vendor-[hash].js
├── index.html
└── vite.svg
```

## 📱 Responsive Breakpoints

Tailwind CSS breakpoints used:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

**Last Updated**: November 21, 2024  
**Version**: 2.0  
**Author**: A6rron
