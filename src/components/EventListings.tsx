import { useState, useEffect } from 'react';
import { EventCard } from './EventCard';
import { calculateDistance } from '../utils/distance';
import { parseEventTime, formatEventTime } from '../utils/dateParser';
import { isSupabaseConfigured, fetchEvents, type Event } from '../lib/supabase';
import { Loader2, Clock } from 'lucide-react';
import { Button } from './ui/button';

interface ProcessedEvent {
  id: string | number;
  name: string;
  location: string;
  lat: number | null;
  lng: number | null;
  category: string;
  verified: boolean;
  distance: number;
  displayTime: string;
  isToday: boolean;
  eventDate: Date;
  isPast: boolean;
}

interface EventListingsProps {
  userLocation: { lat: number; lng: number } | null;
}

export function EventListings({ userLocation }: EventListingsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        setError('Database not configured');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await fetchEvents();

      if (fetchError) {
        setError(fetchError);
        setEvents([]);
      } else {
        setEvents(data || []);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err.message || 'Failed to load events');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // Polling every 30 seconds to replace real-time subscription
    const interval = setInterval(loadEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  // Process events
  const allProcessedEvents: ProcessedEvent[] = events
    .map((event) => {
      const name = event.event_name || 'Untitled Event';
      const location = event.location || 'Location TBA';
      const category = event.food_type || '';

      // Parse GPS coordinates
      let lat: number | null = null;
      let lng: number | null = null;

      if (event.gps_latitude) {
        const parsedLat = parseFloat(event.gps_latitude);
        if (!isNaN(parsedLat)) lat = parsedLat;
      }

      if (event.gps_longitude) {
        const parsedLng = parseFloat(event.gps_longitude);
        if (!isNaN(parsedLng)) lng = parsedLng;
      }

      // Combine date and time
      let timeString = '';
      if (event.date && event.time) {
        timeString = `${event.date}, ${event.time}`;
      } else if (event.date) {
        timeString = event.date;
      } else if (event.time) {
        timeString = event.time;
      }

      const { date, isToday, isPast } = parseEventTime(timeString);

      // Parse verified status
      const verified = event.verified === 'true' || event.verified === true;

      // Calculate distance
      const distance = userLocation && lat !== null && lng !== null
        ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
        : Infinity;

      return {
        id: event.id,
        name,
        location,
        lat,
        lng,
        category,
        verified,
        distance,
        displayTime: formatEventTime(date),
        isToday,
        eventDate: date,
        isPast,
      };
    })
    .sort((a, b) => {
      // Sort by date first, then distance
      if (a.eventDate.getTime() !== b.eventDate.getTime()) {
        return a.eventDate.getTime() - b.eventDate.getTime();
      }
      return a.distance - b.distance;
    });

  // Filter out past events
  const processedEvents = allProcessedEvents.filter((event) => !event.isPast);
  const pastEvents = allProcessedEvents.filter((event) => event.isPast);

  // Separate into today and upcoming
  const todayEvents = processedEvents.filter(e => e.isToday);
  const upcomingEvents = processedEvents.filter(e => !e.isToday);

  const today = new Date();
  const todayString = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="py-8 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="size-8 mx-auto mb-4 text-green-500 animate-spin" />
          <p className="text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadEvents} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (processedEvents.length === 0) {
    return (
      <div className="py-8 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">No upcoming events found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {todayEvents.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-white mb-4 sm:mb-6 font-semibold text-base sm:text-lg">Today ({todayString})</h2>
            <div className="flex flex-col gap-3 sm:gap-4">
              {todayEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-white mb-4 sm:mb-6 font-semibold text-base sm:text-lg">Upcoming Events</h2>
            <div className="flex flex-col gap-3 sm:gap-4">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-800">
            <a
              href="#past-events"
              className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors group py-3 px-4 -mx-4 rounded touch-manipulation"
            >
              <Clock className="size-4 sm:size-5" />
              <span className="font-medium text-sm sm:text-base">View Past Events</span>
              <span className="text-gray-600 group-hover:text-gray-400 text-sm">({pastEvents.length})</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}