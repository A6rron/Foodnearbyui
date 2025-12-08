import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Construct Supabase URL
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  const isConfigured = Boolean(projectId && publicAnonKey);
  if (!isConfigured) {
    console.error('Supabase not configured: projectId or publicAnonKey missing');
  }
  return isConfigured;
};

// Test database connection
export async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Key present:', Boolean(supabaseAnonKey));
    
    const { data, error } = await supabase
      .from('events')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Connection test successful');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Connection test exception:', err);
    return { success: false, error: err.message };
  }
}

// Database types matching Supabase schema
export interface Event {
  id: string;
  event_name: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  food_type: string | null;
  verified: string | boolean | null;
  verified_by: string | null;
  verified_at: string | null;
  verification_method: string | null;
  gps_latitude: string | null;
  gps_longitude: string | null;
  sender_number: string | null;
  media_url: string | null;
  raw_text: string | null;
  confidence_scores: any;
  created_at: string;
  updated_at: string | null;
  location_maps_link: string | null;
}

// Fetch all events from database
export async function fetchEvents() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Exception fetching events:', err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}

// Add new event
export async function addEvent(event: Partial<Event>) {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select()
      .single();

    if (error) {
      console.error('Error adding event:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Exception adding event:', err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}

// Update event
export async function updateEvent(id: string, updates: Partial<Event>) {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating event:', error);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      console.error('No rows updated - event not found:', id);
      return { data: null, error: 'Event not found' };
    }

    return { data: data[0], error: null };
  } catch (err: any) {
    console.error('Exception updating event:', err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}

// Delete event
export async function deleteEvent(id: string) {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err: any) {
    console.error('Exception deleting event:', err);
    return { error: err.message || 'Unknown error' };
  }
}

// Toggle verification
export async function toggleVerification(id: string, currentStatus: boolean) {
  try {
    const newStatus = !currentStatus;
    const { data, error } = await supabase
      .from('events')
      .update({
        verified: newStatus ? 'true' : 'false',
        verified_at: newStatus ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error toggling verification:', error);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      console.error('No rows updated - event not found:', id);
      return { data: null, error: 'Event not found' };
    }

    return { data: data[0], error: null };
  } catch (err: any) {
    console.error('Exception toggling verification:', err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}

// Delete all past events (events older than current date)
export async function deletePastEvents() {
  try {
    // Get all events
    const { data: allEvents, error: fetchError } = await supabase
      .from('events')
      .select('*');

    if (fetchError) {
      console.error('Error fetching events for cleanup:', fetchError);
      return { deletedCount: 0, error: fetchError.message };
    }

    if (!allEvents || allEvents.length === 0) {
      return { deletedCount: 0, error: null };
    }

    // Filter past events
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const pastEventIds: string[] = [];
    
    for (const event of allEvents) {
      // Combine date and time to check if event is past
      let timeString = '';
      if (event.date && event.time) {
        timeString = `${event.date}, ${event.time}`;
      } else if (event.date) {
        timeString = event.date;
      }
      
      if (timeString) {
        // Simple date parsing for comparison
        const eventDate = new Date(timeString);
        
        // If date is valid and is before today, mark for deletion
        if (!isNaN(eventDate.getTime()) && eventDate < today) {
          pastEventIds.push(event.id);
        }
      }
    }

    if (pastEventIds.length === 0) {
      return { deletedCount: 0, error: null };
    }

    // Delete past events
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .in('id', pastEventIds);

    if (deleteError) {
      console.error('Error deleting past events:', deleteError);
      return { deletedCount: 0, error: deleteError.message };
    }

    console.log(`Deleted ${pastEventIds.length} past events`);
    return { deletedCount: pastEventIds.length, error: null };
  } catch (err: any) {
    console.error('Exception deleting past events:', err);
    return { deletedCount: 0, error: err.message || 'Unknown error' };
  }
}