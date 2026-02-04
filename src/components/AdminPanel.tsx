import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import {
    Lock,
    Plus,
    Search,
    Pencil,
    Trash2,
    XCircle,
    Loader2,
    MoreVertical,
    CheckCircle2,
    MapPin,
    Clock,
    Calendar,
    Utensils,
    LogOut,
    RefreshCw,
    LayoutDashboard,
    Filter
} from 'lucide-react';
import {
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleVerification,
    deletePastEvents,
    type Event
} from '../lib/supabase';
import { cn } from './ui/utils';

const ADMIN_PASSWORD = 'admin123';

export function AdminPanel() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loadingLogin, setLoadingLogin] = useState(false);

    // Data State
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [currentEvent, setCurrentEvent] = useState<Partial<Event>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

    // Initial Load & Auth Check
    useEffect(() => {
        const storedAuth = sessionStorage.getItem('admin_auth');
        if (storedAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadEvents();
            // Auto-refresh every 30 seconds
            const interval = setInterval(loadEvents, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingLogin(true);
        setLoginError('');

        // Simulate network delay for effect
        await new Promise(resolve => setTimeout(resolve, 600));

        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem('admin_auth', 'true');
        } else {
            setLoginError('Incorrect password. Access denied.');
        }
        setLoadingLogin(false);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_auth');
        setPassword('');
    };

    const loadEvents = async () => {
        setLoading(true);
        setError('');

        // Auto cleanup past events first
        await deletePastEvents();

        const { data, error: fetchError } = await fetchEvents();
        if (fetchError) {
            setError(fetchError);
            setEvents([]);
        } else {
            setEvents(data || []);
        }
        setLoading(false);
    };

    const handleAdd = () => {
        setDialogMode('add');
        setCurrentEvent({
            verified: 'false',
            created_at: new Date().toISOString()
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (event: Event) => {
        setDialogMode('edit');
        setCurrentEvent({ ...event });
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (event: Event) => {
        setEventToDelete(event);
        setIsDeleteDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (dialogMode === 'add') {
                const { error: addError } = await addEvent({
                    ...currentEvent,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                if (addError) throw new Error(addError);
            } else {
                if (!currentEvent.id) throw new Error("Event ID missing");
                const { error: updateError } = await updateEvent(currentEvent.id, {
                    ...currentEvent,
                    updated_at: new Date().toISOString()
                });
                if (updateError) throw new Error(updateError);
            }

            await loadEvents();
            setIsDialogOpen(false);
        } catch (err: any) {
            alert(`Operation failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!eventToDelete) return;
        setIsSubmitting(true);
        try {
            const { error: deleteError } = await deleteEvent(eventToDelete.id);
            if (deleteError) throw new Error(deleteError);
            await loadEvents();
            setIsDeleteDialogOpen(false);
            setEventToDelete(null);
        } catch (err: any) {
            alert(`Delete failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleVerify = async (event: Event) => {
        const currentStatus = event.verified === 'true' || event.verified === true;
        const { error: toggleError } = await toggleVerification(event.id, currentStatus);

        if (toggleError) {
            alert(`Status update failed: ${toggleError}`);
        } else {
            await loadEvents();
        }
    };

    // Filtering
    const filteredEvents = events.filter(event => {
        const matchesSearch =
            (event.event_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.food_type || '').toLowerCase().includes(searchQuery.toLowerCase());

        const isVerified = event.verified === 'true' || event.verified === true;
        const matchesStatus =
            statusFilter === 'all' ? true :
                statusFilter === 'verified' ? isVerified :
                    !isVerified;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-green-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
                </div>

                <Card className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl border-gray-800 shadow-2xl relative z-10">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto size-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
                            <Lock className="size-6 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">Admin Access</CardTitle>
                        <CardDescription className="text-gray-400">Authenticate to manage events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-gray-300">Password</Label>
                                <div className="relative">
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-gray-800/50 border-gray-700 text-white pl-10 h-11"
                                        placeholder="••••••••"
                                    />
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                                </div>
                            </div>
                            {loginError && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
                                    <XCircle className="size-4" />
                                    {loginError}
                                </div>
                            )}
                            <Button type="submit" className="w-full h-11 bg-green-600 hover:bg-green-500 text-white font-medium shadow-lg shadow-green-900/20" disabled={loadingLogin}>
                                {loadingLogin ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                                {loadingLogin ? 'Verifying...' : 'Login System'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-100 flex flex-col">
            {/* Top Navigation */}
            <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-[#0f172a]/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
                    <div className="flex flex-col">
                        <span
                            className="text-white text-base sm:text-lg tracking-wide leading-tight"
                            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
                        >
                            Food Nearby
                        </span>
                        <span
                            className="text-gray-500 tracking-wide text-[10px] sm:text-xs"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                            - Admin Panel
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={loadEvents} disabled={loading} className="text-gray-400 hover:text-white hidden sm:flex">
                            <RefreshCw className={cn("size-4 mr-2", loading && "animate-spin")} />
                            Refresh
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <LogOut className="size-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                        <Input
                            placeholder="Search by name, location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-gray-900 border-gray-800 text-white h-10 w-full focus:bg-gray-800 transition-colors"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                            <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-800 h-10 text-gray-300">
                                <Filter className="size-3.5 mr-2 text-gray-500" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-800 text-gray-300">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="verified">Verified Only</SelectItem>
                                <SelectItem value="pending">Pending Only</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="h-10 w-px bg-gray-800 hidden sm:block mx-1"></div>

                        <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 h-10 px-5 w-full sm:w-auto">
                            <Plus className="size-4 mr-2" />
                            Add Event
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <Card className="bg-gray-900/40 border-gray-800 backdrop-blur-sm overflow-hidden">
                    {events.length === 0 && loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Loader2 className="size-8 animate-spin text-green-500 mb-4" />
                            <p>Loading ecosystem data...</p>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                            <div className="size-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                                <Search className="size-8 opacity-50" />
                            </div>
                            <p className="text-lg font-medium text-gray-400">No events found</p>
                            <p className="text-sm">Try adjusting your filters or add a new event.</p>
                            <Button variant="link" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="text-green-500 mt-2">Clear all filters</Button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-900/80">
                                        <TableRow className="border-gray-800 hover:bg-transparent">
                                            <TableHead className="text-gray-400 font-medium">Event Name</TableHead>
                                            <TableHead className="text-gray-400 font-medium">Location</TableHead>
                                            <TableHead className="text-gray-400 font-medium">Date & Time</TableHead>
                                            <TableHead className="text-gray-400 font-medium">Status</TableHead>
                                            <TableHead className="text-right text-gray-400 font-medium h-12">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEvents.map((event) => {
                                            const isVerified = event.verified === 'true' || event.verified === true;
                                            return (
                                                <TableRow key={event.id} className="border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                                    <TableCell className="font-medium text-white">
                                                        <div className="flex flex-col">
                                                            <span>{event.event_name || 'Untitled'}</span>
                                                            <span className="text-xs text-gray-500 font-normal">{event.food_type}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center text-gray-300">
                                                            <MapPin className="size-3.5 mr-2 text-gray-500" />
                                                            <span className="truncate max-w-[200px]" title={event.location || ''}>{event.location || 'N/A'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm text-gray-300">
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <Calendar className="size-3.5 text-gray-500" />
                                                                {event.date || 'TBA'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                                <Clock className="size-3.5" />
                                                                {event.time || 'TBA'}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={isVerified ? "default" : "secondary"} className={cn(
                                                            "font-normal",
                                                            isVerified
                                                                ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20"
                                                                : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20"
                                                        )}>
                                                            {isVerified ? 'Verified' : 'Pending'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                                                                    <MoreVertical className="size-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-gray-200">
                                                                <DropdownMatchItem onClick={() => handleEdit(event)} icon={Pencil} label="Edit Details" />
                                                                <DropdownMatchItem
                                                                    onClick={() => handleToggleVerify(event)}
                                                                    icon={isVerified ? XCircle : CheckCircle2}
                                                                    label={isVerified ? "Mark Unverified" : "Mark Verified"}
                                                                    className={isVerified ? "text-yellow-400 focus:text-yellow-400 hover:text-yellow-400 focus:bg-yellow-950/30" : "text-green-400 focus:text-green-400 hover:text-green-400 focus:bg-green-950/30"}
                                                                />
                                                                <DropdownMenuSeparator className="bg-gray-800" />
                                                                <DropdownMatchItem onClick={() => handleDeleteClick(event)} icon={Trash2} label="Delete Event" className="text-red-400 focus:text-red-400 focus:bg-red-950/30" />
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden flex flex-col gap-3 p-4">
                                {filteredEvents.map((event) => {
                                    const isVerified = event.verified === 'true' || event.verified === true;
                                    return (
                                        <div key={event.id} className="bg-gray-800/30 border border-gray-800 rounded-xl p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-white">{event.event_name || 'Untitled'}</h3>
                                                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                                        <Utensils className="size-3" /> {event.food_type || 'General Food'}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className={cn("text-xs border-0", isVerified ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500")}>
                                                    {isVerified ? 'Verified' : 'Pending'}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 bg-gray-900/50 p-3 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="size-3.5 text-gray-500" />
                                                    <span className="truncate">{event.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="size-3.5 text-gray-500" />
                                                    <span className="truncate">{event.time}</span>
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2">
                                                    <MapPin className="size-3.5 text-gray-500" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(event)} className="h-8 px-2 text-gray-400">Edit</Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleToggleVerify(event)} className={cn("h-8 px-2", isVerified ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300")}>
                                                    {isVerified ? 'Unverify' : 'Verify'}
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(event)} className="h-8 px-2 text-red-400">Delete</Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </Card>
            </main>

            {/* Add/Edit Dialog */}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent style={{ backgroundColor: '#0f172a' }} className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-800 p-6 shadow-xl sm:rounded-lg text-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {dialogMode === 'add' ? <Plus className="size-5 text-green-500" /> : <Pencil className="size-5 text-blue-500" />}
                            {dialogMode === 'add' ? 'Create New Event' : 'Edit Event Details'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {dialogMode === 'add' ? 'Fill in the details to publish a new food event.' : 'Update the information for this event.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-300">Event Name</Label>
                                <Input
                                    value={currentEvent.event_name || ''}
                                    onChange={(e) => setCurrentEvent({ ...currentEvent, event_name: e.target.value })}
                                    className="bg-gray-900 border-gray-800 focus:border-green-500/50"
                                    placeholder="e.g. Community Lunch"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Date</Label>
                                    <Input
                                        value={currentEvent.date || ''}
                                        onChange={(e) => setCurrentEvent({ ...currentEvent, date: e.target.value })}
                                        className="bg-gray-900 border-gray-800 focus:border-green-500/50"
                                        placeholder="e.g. 12 Nov 2025"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Time</Label>
                                    <Input
                                        value={currentEvent.time || ''}
                                        onChange={(e) => setCurrentEvent({ ...currentEvent, time: e.target.value })}
                                        className="bg-gray-900 border-gray-800 focus:border-green-500/50"
                                        placeholder="e.g. 1:00 PM"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-300">Location Address</Label>
                                <Textarea
                                    value={currentEvent.location || ''}
                                    onChange={(e) => setCurrentEvent({ ...currentEvent, location: e.target.value })}
                                    className="bg-gray-900 border-gray-800 focus:border-green-500/50 min-h-[80px]"
                                    placeholder="Full address of the event..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Food Type</Label>
                                    <Input
                                        value={currentEvent.food_type || ''}
                                        onChange={(e) => setCurrentEvent({ ...currentEvent, food_type: e.target.value })}
                                        className="bg-gray-900 border-gray-800 focus:border-green-500/50"
                                        placeholder="e.g. Meals, Snacks"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Verification</Label>
                                    <Select
                                        value={String(currentEvent.verified) === 'true' ? 'true' : 'false'}
                                        onValueChange={(v) => setCurrentEvent({ ...currentEvent, verified: v })}
                                    >
                                        <SelectTrigger className="bg-gray-900 border-gray-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-800 text-gray-300">
                                            <SelectItem value="true">Verified</SelectItem>
                                            <SelectItem value="false">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 p-4 rounded-xl border border-dashed border-gray-800 space-y-3">
                                <div className="flex items-center gap-2 text-sm text-blue-400 font-medium pb-1 border-b border-gray-800/50 mb-1">
                                    <MapPin className="size-4" /> GPS Coordinates (Optional)
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Latitude</Label>
                                        <Input
                                            value={currentEvent.gps_latitude || ''}
                                            onChange={(e) => setCurrentEvent({ ...currentEvent, gps_latitude: e.target.value })}
                                            className="bg-gray-950 border-gray-800 h-9 text-sm"
                                            placeholder="10.000"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Longitude</Label>
                                        <Input
                                            value={currentEvent.gps_longitude || ''}
                                            onChange={(e) => setCurrentEvent({ ...currentEvent, gps_longitude: e.target.value })}
                                            className="bg-gray-950 border-gray-800 h-9 text-sm"
                                            placeholder="76.000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Google Maps Link</Label>
                                    <Input
                                        value={currentEvent.location_maps_link || ''}
                                        onChange={(e) => setCurrentEvent({ ...currentEvent, location_maps_link: e.target.value })}
                                        className="bg-gray-950 border-gray-800 h-9 text-sm"
                                        placeholder="https://maps.google.com/..."
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-400 hover:text-white hover:bg-white/5">Cancel</Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-500 text-white min-w-[100px]" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : (dialogMode === 'add' ? 'Create' : 'Save Changes')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent style={{ backgroundColor: '#0f172a' }} className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-800 p-6 shadow-xl sm:rounded-lg text-white">
                    <DialogHeader>
                        <DialogTitle className="text-red-400 flex items-center gap-2">
                            <Trash2 className="size-5" />
                            Delete Event
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Are you sure you want to permanently delete <span className="text-white font-medium">"{eventToDelete?.event_name}"</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="text-gray-400">Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-500">
                            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function DropdownMatchItem({ onClick, icon: Icon, label, className }: any) {
    return (
        <DropdownMenuItem onClick={onClick} className={cn("cursor-pointer hover:bg-gray-800 focus:bg-gray-800 py-2.5", className)}>
            <Icon className="size-4 mr-2" />
            {label}
        </DropdownMenuItem>
    );
}
