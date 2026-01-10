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
  Trash,
  Clock,
  MapPin,
  ExternalLink,
  Settings,
  MoreVertical,
  Filter
} from 'lucide-react';
import {
  fetchEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  toggleVerification,
  deletePastEvents,
  testConnection,
  type Event
} from '../lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { formatEventTime, parseEventTime } from '../utils/dateParser';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

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
        await deletePastEvents();
        loadEvents();
      };

      autoCleanup();

      // Polling every 30 seconds
      const interval = setInterval(loadEvents, 30000);
      return () => clearInterval(interval);
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
      if (toggleError.includes('not found')) {
        await loadEvents();
        return;
      }
      alert(`Error toggling verification: ${toggleError}`);
    } else {
      await loadEvents();
    }
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
      // Filter out past events
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
        if (!isNaN(eventDate.getTime()) && eventDate < today) {
          return false;
        }
      }

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        (event.event_name || '').toLowerCase().includes(searchLower) ||
        (event.location || '').toLowerCase().includes(searchLower) ||
        (event.food_type || '').toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (filterVerified === 'verified') {
        return event.verified === 'true' || event.verified === true;
      } else if (filterVerified === 'unverified') {
        return event.verified === 'false' || event.verified === false || !event.verified;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <nav className="fixed top-0 w-full bg-[#0f172a]/80 backdrop-blur-md border-b border-gray-800 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <Lock className="size-4 text-green-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-lg font-bold tracking-tight">Food Nearby</span>
                <span className="text-gray-500 text-xs font-mono">ADMIN PLANEL</span>
              </div>
            </div>
          </div>
        </nav>

        <Card className="w-full max-w-md bg-gray-900/50 backdrop-blur-xl border border-gray-800 shadow-2xl relative z-10 mx-4">
          <CardHeader className="text-center pb-8 border-b border-gray-800/50">
            <div className="mx-auto mb-6 size-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center border border-gray-700 shadow-inner">
              <Settings className="size-7 text-white" />
            </div>
            <CardTitle className="text-2xl text-white font-bold tracking-tight">Admin Access</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Please enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white pl-4 pr-10 py-6 focus:border-green-500 focus:ring-green-500/20 transition-all rounded-xl"
                    placeholder="Enter admin password"
                    autoComplete="current-password"
                    autoFocus
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                  <XCircle className="size-4 text-red-500" />
                  <p className="text-red-400 text-sm font-medium">{loginError}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-[0.98]"
              >
                Authenticate
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-green-500/30">
      {/* Navbar - Matching Home Page style */}
      <nav className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-md border-b border-gray-800/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <Lock className="size-4 text-green-500" />
            </div>
            <span className="text-white text-lg font-bold tracking-tight">Food Nearby <span className="text-gray-500 font-normal">Admin</span></span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}
              size="sm"
              className="bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 rounded-lg font-medium"
            >
              <Plus className="size-4 mr-2" />
              New Event
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAuthenticated(false);
                setEvents([]);
              }}
              className="text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <ArrowLeft className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simple Header - Like Home Page Hero but smaller */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage all community food events.</p>

          {/* Minimal Filter Bar */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white pl-10 h-10 rounded-lg focus:ring-green-500/20 focus:border-green-500 w-full"
              />
            </div>
            <Select value={filterVerified} onValueChange={(v: any) => setFilterVerified(v)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-10 w-[140px] rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white">All Events</SelectItem>
                <SelectItem value="verified" className="text-white">Verified</SelectItem>
                <SelectItem value="unverified" className="text-white">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Event List - EXACT Style as EventCard.tsx */}
        <div className="flex flex-col gap-4">
          {loading && events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="size-10 text-green-500 animate-spin mb-4" />
              <p className="text-gray-400">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No events found.
            </div>
          ) : (
            filteredEvents.map((event) => {
              // Prepare data to match EventCardProps as much as possible
              const isVerified = event.verified === 'true' || event.verified === true;

              let timeString = '';
              if (event.date && event.time) {
                timeString = `${event.date}, ${event.time}`;
              } else if (event.date) {
                timeString = event.date;
              } else if (event.time) {
                timeString = event.time;
              }
              const { date, isToday } = parseEventTime(timeString);
              const displayTime = formatEventTime(date);

              // Mock coordinates processing if needed, mostly for display
              const hasCoordinates = event.gps_latitude && event.gps_longitude;
              const googleMapsUrl = event.location_maps_link || (hasCoordinates
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location || '')}`
                : null);

              return (
                <div key={event.id} className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all group">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-start gap-2 mb-2.5 sm:mb-3 flex-wrap">
                        <h3 className="text-white text-base sm:text-lg font-semibold">{event.event_name || 'Untitled Event'}</h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isToday && (
                            <Badge className="bg-red-500 hover:bg-red-500 rounded-full text-[10px] sm:text-xs px-2 py-0.5">
                              Today
                            </Badge>
                          )}
                          {isVerified && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center flex-shrink-0 cursor-help">
                                    <CheckCircle2 className="size-4 sm:size-5 text-green-500 transition-all hover:scale-110 hover:text-green-400" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Verified by admin</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {!isVerified && (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 bg-yellow-500/10 text-[10px]">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>

                      {event.food_type && (
                        <div className="text-gray-400 mb-2.5 sm:mb-3 text-sm">{event.food_type}</div>
                      )}

                      <div className="flex flex-col gap-2">
                        {/* Location */}
                        <div className="flex items-start gap-2 text-gray-300">
                          <MapPin className="size-3.5 sm:size-4 flex-shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm break-words flex-1">{event.location || 'Location not specified'}</span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <Clock className="size-3.5 sm:size-4 flex-shrink-0" />
                            <span>{displayTime}</span>
                          </div>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-500">ID: {String(event.id).slice(-4)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Helper Actions (Desktop & Mobile Unified) */}
                    <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-4 border-t sm:border-t-0 sm:border-l border-gray-700/50 pt-3 sm:pt-0 sm:pl-4 min-w-[140px] justify-end">
                      <Button
                        size="sm"
                        variant={isVerified ? "ghost" : "default"}
                        onClick={() => handleToggleVerification(event)}
                        className={isVerified ? "text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2" : "bg-green-600 hover:bg-green-500 text-white h-8 px-3 text-xs"}
                      >
                        {isVerified ? <XCircle className="size-4" /> : "Verify"}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 text-gray-200">
                          <DropdownMenuItem onClick={() => openEditDialog(event)} className="hover:bg-gray-800 cursor-pointer">
                            <Pencil className="size-4 mr-2" /> Edit Details
                          </DropdownMenuItem>
                          {googleMapsUrl && (
                            <DropdownMenuItem asChild>
                              <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="flex items-center hover:bg-gray-800 cursor-pointer">
                                <ExternalLink className="size-4 mr-2" /> Open Maps
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openDeleteDialog(event)} className="hover:bg-gray-800 text-red-400 focus:text-red-400 cursor-pointer">
                            <Trash2 className="size-4 mr-2 text-red-400" /> Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="bg-gray-900/95 border-gray-700 text-white max-w-2xl backdrop-blur-xl w-[95vw] sm:w-full p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {showAddDialog ? <Plus className="size-5 text-green-500" /> : <Pencil className="size-5 text-blue-400" />}
              {showAddDialog ? 'Add New Event' : 'Edit Event'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Fill in the details below. Required fields are marked with verification status.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:gap-6">
            <div className="grid gap-2">
              <Label className="text-gray-300">Event Name</Label>
              <Input
                value={formData.event_name}
                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white focus:border-green-500"
                placeholder="e.g. Community Lunch"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-gray-300">Date</Label>
                <Input
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white focus:border-green-500"
                  placeholder="e.g. 12 Nov 2025"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-gray-300">Time</Label>
                <Input
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white focus:border-green-500"
                  placeholder="e.g. 7:00 PM"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-gray-300">Location</Label>
              <Textarea
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white focus:border-green-500 resize-none"
                rows={2}
                placeholder="Address or place name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-gray-300">Maps Link (Optional)</Label>
                <Input
                  value={formData.location_maps_link}
                  onChange={(e) => setFormData({ ...formData, location_maps_link: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white focus:border-green-500"
                  placeholder="https://maps.google..."
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-gray-300">Food Type (Optional)</Label>
                <Input
                  value={formData.food_type}
                  onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white focus:border-green-500"
                  placeholder="e.g. Vegetarian, Buffet"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-gray-300">Verification</Label>
              <Select
                value={formData.verified}
                onValueChange={(v) => setFormData({ ...formData, verified: v })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="true">Verified</SelectItem>
                  <SelectItem value="false">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50 mt-4">
            <Button variant="ghost" onClick={() => { setShowAddDialog(false); setShowEditDialog(false); }} className="text-gray-400 hover:text-white">Cancel</Button>
            <Button onClick={showAddDialog ? handleAddEvent : handleEditEvent} className="bg-green-600 hover:bg-green-500 text-white">
              {showAddDialog ? 'Add Event' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-sm backdrop-blur-xl w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash className="size-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4 mt-2">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="text-gray-400 hover:text-white">Cancel</Button>
            <Button onClick={handleDeleteEvent} variant="destructive" className="bg-red-600 hover:bg-red-500">Delete Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
