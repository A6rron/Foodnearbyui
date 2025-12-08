import { useState, useEffect } from 'react';
import { EventCard } from './EventCard';
import { calculateDistance } from '../utils/distance';
import { parseEventTime, formatEventTime } from '../utils/dateParser';
import { supabase, isSupabaseConfigured, fetchEvents, type Event } from '../lib/supabase';
import { Loader2, ArrowLeft, Clock } from 'lucide-react';
import { Button } from './ui/button';

const isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development';

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

interface PastEventsPageProps {
  userLocation: { lat: number; lng: number } | null;
}

export function PastEventsPage({ userLocation }: PastEventsPageProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setSupabaseError(null);
      
      if (!isSupabaseConfigured()) {
        console.warn('Supabase is not configured. No past events to display.');
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data, error } = await fetchEvents();

      if (error) {
        setSupabaseError(error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setSupabaseError('No past events found.');
        setEvents([]);
        setLoading(false);
        return;
      }

      setEvents(data);
      setSupabaseError(null);
      setLoading(false);
      
    } catch (err: any) {
      console.error('Error fetching past events:', err);
      const errorMessage = err?.message || String(err) || 'Failed to load past events';
      setSupabaseError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    
    if (isSupabaseConfigured()) {
      const subscription = supabase
        .channel('past_events_channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'events' },
          () => {
            loadEvents();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Process events
  const allProcessedEvents: ProcessedEvent[] = events
    .map((event) => {
      const name = event.event_name ?? '';
      const location = event.location ?? '';
      const category = event.food_type ?? '';
      
      let lat: number | null = null;
      let lng: number | null = null;
      
      if (event.gps_latitude) {
        const parsedLat = Number(event.gps_latitude);
        if (!isNaN(parsedLat)) lat = parsedLat;
      }
      
      if (event.gps_longitude) {
        const parsedLng = Number(event.gps_longitude);
        if (!isNaN(parsedLng)) lng = parsedLng;
      }
      
      let timeString = '';
      if (event.date && event.time) {
        timeString = `${event.date}, ${event.time}`;
      } else if (event.date) {
        timeString = event.date;
      } else if (event.time) {
        timeString = event.time;
      }
      
      const { date, isToday, isPast } = parseEventTime(timeString);
      
      const verified = typeof event.verified === 'boolean' 
        ? event.verified 
        : event.verified === 'true';
      
      const distance = userLocation 
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
    .filter((event) => event.isPast) // Only show past events
    .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime()); // Most recent first

  const handleGoBack = () => {
    window.location.hash = '';
  };

  if (loading) {
    return (
      <div className="py-16 bg-[#0f172a] min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="size-8 mx-auto mb-4 text-green-500 animate-spin" />
          <p className="text-gray-400">Loading past events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-[#0f172a] min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={handleGoBack}
            variant="ghost"
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Clock className="size-6 text-gray-400" />
            <h1 className="text-white font-semibold text-2xl">Past Events</h1>
          </div>
          <p className="text-gray-400 text-sm">
            These events have already occurred. Showing most recent first.
          </p>
        </div>

        {/* Error State */}
        {supabaseError && allProcessedEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{supabaseError}</p>
            <Button onClick={loadEvents} variant="outline">
              Retry
            </Button>
          </div>
        )}

        {/* No Events State */}
        {!supabaseError && allProcessedEvents.length === 0 && (
          <div className="text-center py-12">
            <Clock className="size-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No past events found.</p>
            <p className="text-gray-500 text-sm mt-2">
              Past events will appear here once they've occurred.
            </p>
          </div>
        )}

        {/* Events List */}
        {allProcessedEvents.length > 0 && (
          <div>
            <div className="text-gray-500 text-sm mb-4">
              {allProcessedEvents.length} past {allProcessedEvents.length === 1 ? 'event' : 'events'}
            </div>
            <div className="flex flex-col gap-4">
              {allProcessedEvents.map(event => (
                <div key={event.id} className="opacity-60 hover:opacity-80 transition-opacity">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}