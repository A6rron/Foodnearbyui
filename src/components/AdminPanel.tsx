import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  Lock, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  Loader2,
  Trash
} from 'lucide-react';
import { 
  supabase, 
  isSupabaseConfigured, 
  fetchEvents, 
  addEvent, 
  updateEvent, 
  deleteEvent, 
  toggleVerification,
  deletePastEvents,
  testConnection,
  type Event 
} from '../lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const ADMIN_PASSWORD = 'admin123';

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const [formData, setFormData] = useState({
    event_name: '',
    date: '',
    time: '',
    location: '',
    food_type: '',
    gps_latitude: '',
    gps_longitude: '',
    location_maps_link: '',
    verified: 'false'
  });

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Incorrect password');
    }
  };

  // Fetch events from database
  const loadEvents = async () => {
    setLoading(true);
    setError('');
    
    const { data, error: fetchError } = await fetchEvents();
    
    if (fetchError) {
      setError(fetchError);
      setEvents([]);
    } else {
      setEvents(data || []);
    }
    
    setLoading(false);
  };

  // Load events when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Automatically clean up past events on load
      const autoCleanup = async () => {
        const { deletedCount } = await deletePastEvents();
        if (deletedCount > 0) {
          console.log(`Auto-cleanup: Deleted ${deletedCount} past event(s)`);
        }
        // Load events after cleanup
        loadEvents();
      };
      
      autoCleanup();
      
      // Set up real-time subscription
      if (isSupabaseConfigured()) {
        const channel = supabase
          .channel('admin_events')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'events' 
          }, () => {
            loadEvents();
          })
          .subscribe();

        return () => {
          channel.unsubscribe();
        };
      }
    }
  }, [isAuthenticated]);

  // Reset form
  const resetForm = () => {
    setFormData({
      event_name: '',
      date: '',
      time: '',
      location: '',
      food_type: '',
      gps_latitude: '',
      gps_longitude: '',
      location_maps_link: '',
      verified: 'false'
    });
  };

  // Handle add event
  const handleAddEvent = async () => {
    setLoading(true);
    
    const { error: addError } = await addEvent({
      ...formData,
      verified: formData.verified,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    if (addError) {
      alert(`Error adding event: ${addError}`);
    } else {
      setShowAddDialog(false);
      resetForm();
      await loadEvents();
    }
    
    setLoading(false);
  };

  // Handle edit event
  const handleEditEvent = async () => {
    if (!selectedEvent) return;
    
    setLoading(true);
    
    const { error: updateError } = await updateEvent(selectedEvent.id, {
      ...formData,
      updated_at: new Date().toISOString()
    });
    
    if (updateError) {
      console.error('Error updating event:', updateError);
      
      // If event not found, it might have been deleted - refresh the list
      if (updateError.includes('not found')) {
        setShowEditDialog(false);
        setSelectedEvent(null);
        resetForm();
        await loadEvents();
        alert('Event no longer exists. The event list has been refreshed.');
      } else {
        alert(`Error updating event: ${updateError}`);
      }
    } else {
      setShowEditDialog(false);
      setSelectedEvent(null);
      resetForm();
      await loadEvents();
    }
    
    setLoading(false);
  };

  // Handle delete event
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    setLoading(true);
    
    const { error: deleteError } = await deleteEvent(selectedEvent.id);
    
    if (deleteError) {
      console.error('Error deleting event:', deleteError);
      
      // If event not found, it might have been already deleted - just refresh
      if (deleteError.includes('not found')) {
        setShowDeleteDialog(false);
        setSelectedEvent(null);
        await loadEvents();
      } else {
        alert(`Error deleting event: ${deleteError}`);
      }
    } else {
      setShowDeleteDialog(false);
      setSelectedEvent(null);
      await loadEvents();
    }
    
    setLoading(false);
  };

  // Handle toggle verification
  const handleToggleVerification = async (event: Event) => {
    const isVerified = event.verified === 'true' || event.verified === true;
    
    const { error: toggleError } = await toggleVerification(event.id, isVerified);
    
    if (toggleError) {
      console.error('Error toggling verification:', toggleError);
      
      // If event not found, it might have been deleted - refresh the list
      if (toggleError.includes('not found')) {
        await loadEvents();
        return;
      }
      
      alert(`Error toggling verification: ${toggleError}`);
    } else {
      await loadEvents();
    }
  };

  // Handle cleanup past events
  const handleCleanupPastEvents = async () => {
    if (!confirm('Delete all past events? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    const { deletedCount, error: cleanupError } = await deletePastEvents();
    
    if (cleanupError) {
      console.error('Error cleaning up past events:', cleanupError);
      alert(`Error cleaning up past events: ${cleanupError}`);
    } else {
      alert(`Successfully deleted ${deletedCount} past event${deletedCount === 1 ? '' : 's'}`);
      await loadEvents();
    }
    
    setLoading(false);
  };

  // Open edit dialog
  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      event_name: event.event_name || '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      food_type: event.food_type || '',
      gps_latitude: event.gps_latitude || '',
      gps_longitude: event.gps_longitude || '',
      location_maps_link: event.location_maps_link || '',
      verified: typeof event.verified === 'boolean' 
        ? (event.verified ? 'true' : 'false')
        : (event.verified || 'false')
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (event: Event) => {
    setSelectedEvent(event);
    setShowDeleteDialog(true);
  };

  // Filter and sort events
  const filteredEvents = events
    .filter(event => {
      // Filter out past events - only show current and future events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let timeString = '';
      if (event.date && event.time) {
        timeString = `${event.date}, ${event.time}`;
      } else if (event.date) {
        timeString = event.date;
      }
      
      if (timeString) {
        const eventDate = new Date(timeString);
        // Skip if valid date and is in the past
        if (!isNaN(eventDate.getTime()) && eventDate < today) {
          return false;
        }
      }
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (event.event_name || '').toLowerCase().includes(searchLower) ||
        (event.location || '').toLowerCase().includes(searchLower) ||
        (event.food_type || '').toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
      
      // Verification filter
      if (filterVerified === 'verified') {
        return event.verified === 'true' || event.verified === true;
      } else if (filterVerified === 'unverified') {
        return event.verified === 'false' || event.verified === false || !event.verified;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return (a.event_name || '').localeCompare(b.event_name || '');
      }
    });

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <Card className="bg-[#1f2937] border-green-500/30 max-w-md w-full shadow-xl shadow-green-500/10">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="size-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <Lock className="size-8 text-green-400" />
              </div>
            </div>
            <CardTitle className="text-white text-2xl">Admin Panel</CardTitle>
            <CardDescription className="text-gray-300">
              Enter password to manage events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-white font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0f172a] border-gray-600 text-white mt-2 focus:border-green-500 focus:ring-green-500"
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                />
              </div>
              {loginError && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-2 rounded">{loginError}</p>
              )}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-medium">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.location.hash = '';
              setIsAuthenticated(false);
            }}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back
          </Button>
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400 mt-1">Manage food events - showing only current & future events</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto shadow-lg shadow-green-500/20"
            >
              <Plus className="size-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Events</p>
                  <p className="text-white mt-1">{filteredEvents.length}</p>
                </div>
                <div className="size-12 rounded-full bg-gray-700 flex items-center justify-center">
                  <CheckCircle2 className="size-6 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Verified</p>
                  <p className="text-white mt-1">
                    {events.filter(e => e.verified === 'true' || e.verified === true).length}
                  </p>
                </div>
                <div className="size-12 rounded-full bg-gray-700 flex items-center justify-center">
                  <CheckCircle2 className="size-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Unverified</p>
                  <p className="text-white mt-1">
                    {events.filter(e => e.verified === 'false' || e.verified === false || !e.verified).length}
                  </p>
                </div>
                <div className="size-12 rounded-full bg-gray-700 flex items-center justify-center">
                  <XCircle className="size-6 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-[#1f2937] border-gray-700 mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="text-white text-sm mb-2 block font-medium">Search Events</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className="bg-[#111827] border-gray-600 text-white pl-10 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="filter" className="text-white text-sm mb-2 block font-medium">Filter by Status</Label>
                <Select value={filterVerified} onValueChange={(value: any) => setFilterVerified(value)}>
                  <SelectTrigger className="bg-[#111827] border-gray-600 text-white focus:border-green-500 focus:ring-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f2937] border-gray-600">
                    <SelectItem value="all" className="text-white">All Events</SelectItem>
                    <SelectItem value="verified" className="text-white">Verified Only</SelectItem>
                    <SelectItem value="unverified" className="text-white">Unverified Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sort" className="text-white text-sm mb-2 block font-medium">Sort Events</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="bg-[#111827] border-gray-600 text-white focus:border-green-500 focus:ring-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f2937] border-gray-600">
                    <SelectItem value="newest" className="text-white">Newest First</SelectItem>
                    <SelectItem value="oldest" className="text-white">Oldest First</SelectItem>
                    <SelectItem value="name" className="text-white">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && events.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-green-500" />
          </div>
        )}

        {/* Events list */}
        {!loading && events.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No events found. Click "Add Event" to create your first event.
          </div>
        )}

        {filteredEvents.length > 0 && (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const isVerified = event.verified === 'true' || event.verified === true;
              
              return (
                <Card key={event.id} className="bg-[#1f2937] border-gray-600 hover:border-green-500/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {event.event_name || 'Untitled Event'}
                          </h3>
                          {isVerified && (
                            <CheckCircle2 className="size-5 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-300">
                          {event.food_type && (
                            <p><span className="text-gray-400 font-medium">Type:</span> {event.food_type}</p>
                          )}
                          {event.location && (
                            <p><span className="text-gray-400 font-medium">Location:</span> {event.location}</p>
                          )}
                          {(event.date || event.time) && (
                            <p>
                              <span className="text-gray-400 font-medium">Time:</span>{' '}
                              {event.date && event.time ? `${event.date}, ${event.time}` : event.date || event.time}
                            </p>
                          )}
                          {(event.gps_latitude && event.gps_longitude) && (
                            <p>
                              <span className="text-gray-400 font-medium">GPS:</span>{' '}
                              {event.gps_latitude}, {event.gps_longitude}
                            </p>
                          )}
                        </div>
                        
                        <div className="mt-3">
                          <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                            {new Date(event.created_at).toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          variant={isVerified ? "default" : "outline"}
                          onClick={() => handleToggleVerification(event)}
                          className={isVerified ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-500 text-gray-300 hover:bg-green-600 hover:text-white"}
                          title={isVerified ? "Verified" : "Unverified"}
                        >
                          {isVerified ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            <XCircle className="size-4" />
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(event)}
                          className="border-gray-500 text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                          title="Edit event"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteDialog(event)}
                          className="border-gray-500 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600"
                          title="Delete event"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setShowEditDialog(false);
            resetForm();
          }
        }}>
          <DialogContent className="bg-[#1f2937] border-green-500/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">{showAddDialog ? 'Add New Event' : 'Edit Event'}</DialogTitle>
              <DialogDescription className="text-gray-300">
                Fill in the event details below
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="event_name" className="text-white font-medium">Event Name *</Label>
                <Input
                  id="event_name"
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  className="bg-[#0f172a] border-gray-600 text-white mt-2 focus:border-green-500 focus:ring-green-500"
                  placeholder="e.g., Wedding Reception"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-white font-medium">Date</Label>
                  <Input
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-[#0f172a] border-gray-600 text-white mt-2 focus:border-green-500 focus:ring-green-500"
                    placeholder="e.g., 24 Nov 2025"
                  />
                </div>
                
                <div>
                  <Label htmlFor="time" className="text-white font-medium">Time</Label>
                  <Input
                    id="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="bg-[#0f172a] border-gray-600 text-white mt-2 focus:border-green-500 focus:ring-green-500"
                    placeholder="e.g., 7:00 PM"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="location" className="text-white font-medium">Location *</Label>
                <Textarea
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-[#0f172a] border-gray-600 text-white mt-2 focus:border-green-500 focus:ring-green-500"
                  placeholder="e.g., Eram Convention Centre, Aluva"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="food_type" className="text-white font-medium">Food Type</Label>
                <Input
                  id="food_type"
                  value={formData.food_type}
                  onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                  className="bg-[#0f172a] border-gray-600 text-white mt-2 focus:border-green-500 focus:ring-green-500"
                  placeholder="e.g., Wedding Ceremony, Free Meal"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gps_latitude" className="text-white font-medium">GPS Latitude</Label>
                  <Input
                    id="gps_latitude"
                    value={formData.gps_latitude}
                    onChange={(e) => setFormData({ ...formData, gps_latitude: e.target.value })}
                    className="bg-[#0f172a] border-gray-600 text-white mt-2 focus:border-green-500 focus:ring-green-500"
                    placeholder="e.g., 10.1081"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gps_longitude" className="text-white font-medium">GPS Longitude</Label>
                  <Input
                    id="gps_longitude"
                    value={formData.gps_longitude}
                    onChange={(e) => setFormData({ ...formData, gps_longitude: e.target.value })}
                    className="bg-[#0f172a] border-gray-600 text-white mt-2 focus:border-green-500 focus:ring-green-500"
                    placeholder="e.g., 76.3525"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="location_maps_link" className="text-white font-medium">Maps Link</Label>
                <Input
                  id="location_maps_link"
                  value={formData.location_maps_link}
                  onChange={(e) => setFormData({ ...formData, location_maps_link: e.target.value })}
                  className="bg-[#0f172a] border-gray-600 text-white mt-2 focus:border-green-500 focus:ring-green-500"
                  placeholder="Google Maps URL"
                />
              </div>
              
              <div>
                <Label htmlFor="verified" className="text-white font-medium">Verification Status</Label>
                <Select value={formData.verified} onValueChange={(value) => setFormData({ ...formData, verified: value })}>
                  <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white mt-2 focus:border-green-500 focus:ring-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f2937] border-gray-600">
                    <SelectItem value="false" className="text-white">Unverified</SelectItem>
                    <SelectItem value="true" className="text-white">Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter className="mt-6 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setShowEditDialog(false);
                  resetForm();
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={showAddDialog ? handleAddEvent : handleEditEvent}
                disabled={loading || !formData.event_name || !formData.location}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  showAddDialog ? 'Add Event' : 'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-[#1f2937] border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete "{selectedEvent?.event_name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedEvent(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteEvent}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Event'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}