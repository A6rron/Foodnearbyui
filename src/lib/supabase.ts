// Replaced Supabase with MongoDB (Custom API)
export const isSupabaseConfigured = () => true;

const API_URL = 'http://localhost:4000/api';

// Export a dummy supabase object to prevent crashes in components that might import it
// We will still need to remove usage, but this helps compilation if we miss one.
export const supabase = {
  channel: () => ({
    on: () => ({
      subscribe: () => ({
        unsubscribe: () => { }
      })
    })
  })
};

export type Event = {
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
};

// Test database connection
export async function testConnection() {
  try {
    const res = await fetch(`${API_URL}/events`);
    if (!res.ok) throw new Error('Failed to connect to API');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Fetch all events
export async function fetchEvents() {
  try {
    const res = await fetch(`${API_URL}/events`);
    const json = await res.json();
    return { data: json.data, error: json.error };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

// Add new event
export async function addEvent(event: Partial<Event>) {
  try {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    const json = await res.json();
    return { data: json.data, error: json.error };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

// Update event
export async function updateEvent(id: string, updates: Partial<Event>) {
  try {
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    return { data: json.data, error: json.error };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

// Delete event
export async function deleteEvent(id: string) {
  try {
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    return { error: json.error };
  } catch (err: any) {
    return { error: err.message };
  }
}

// Toggle verification
export async function toggleVerification(id: string, currentStatus: boolean) {
  const newStatus = !currentStatus;
  return updateEvent(id, {
    verified: newStatus ? 'true' : 'false',
    verified_at: newStatus ? new Date().toISOString() : null,
  });
}

// Delete all past events
export async function deletePastEvents() {
  try {
    const res = await fetch(`${API_URL}/events/cleanup/past`, {
      method: 'DELETE'
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { deletedCount: 0, error: err.message };
  }
}