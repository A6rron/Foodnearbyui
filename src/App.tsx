import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { EventListings } from './components/EventListings';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';
import { PastEventsPage } from './components/PastEventsPage';

// Default fallback location: Aluva, Kerala (10.1081, 76.3525)
const FALLBACK_LOCATION = {
  lat: 10.1081,
  lng: 76.3525,
};

export default function App() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(FALLBACK_LOCATION);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'past-events'>('home');

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      setLocationStatus('loading');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationStatus('success');
        },
        () => {
          // On error, keep using Aluva fallback
          setUserLocation(FALLBACK_LOCATION);
          setLocationStatus('error');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      // Geolocation not available
      setUserLocation(FALLBACK_LOCATION);
      setLocationStatus('error');
    }
  };

  useEffect(() => {
    // Set default location immediately
    setUserLocation(FALLBACK_LOCATION);
    
    // Wait 100ms then try to detect real location
    setTimeout(() => {
      detectLocation();
    }, 100);

    // Check URL for admin access (supports ?admin=true, #admin, and /admin path)
    const urlParams = new URLSearchParams(window.location.search);
    const checkAdminAccess = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      if (urlParams.get('admin') === 'true' || hash === '#admin' || pathname === '/admin') {
        setShowAdmin(true);
      }
    };

    checkAdminAccess();

    // Check URL hash for navigation
    const handleHashChange = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      if (hash === '#admin' || pathname === '/admin') {
        setShowAdmin(true);
      } else if (hash === '#past-events') {
        setCurrentPage('past-events');
      } else {
        setCurrentPage('home');
        setShowAdmin(false);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleLocationClick = () => {
    detectLocation();
  };

  // Show admin panel if accessed via ?admin=true
  if (showAdmin) {
    return <AdminPanel />;
  }

  // Show Past Events page
  if (currentPage === 'past-events') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-gray-100">
        <Navbar />
        <PastEventsPage userLocation={userLocation} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100">
      <Navbar />
      <Hero 
        locationStatus={locationStatus}
        onLocationClick={handleLocationClick}
      />
      <EventListings userLocation={userLocation} />
      <Footer />
    </div>
  );
}