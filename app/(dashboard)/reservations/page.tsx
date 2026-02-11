"use client";



import { useState, useEffect, useMemo } from 'react';

import { useAuth } from '@/contexts/AuthContext';

import { Card } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Calendar, User, Phone, Plus, Check, X, ChevronLeft, ChevronRight, Clock, Users, Bell, MessageSquare } from 'lucide-react';

import type { Reservation, Table } from '@/types/restaurant';

import { useReservations, useCreateReservation, useUpdateReservation, useTables } from '@/hooks/api';

import { toast } from 'sonner';



interface WaitlistEntry {

  id: string;

  restaurantId: string;

  customerName: string;

  customerMobile: string;

  partySize: number;

  addedAt: string;

  estimatedWait: number; // in minutes

  status: 'waiting' | 'notified' | 'seated' | 'left';

  notes?: string;

}



export default function Reservations() {

  const { restaurant } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [showAddDialog, setShowAddDialog] = useState(false);

  const [showSeatDialog, setShowSeatDialog] = useState(false);

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const [activeTab, setActiveTab] = useState<'reservations' | 'waitlist'>('reservations');



  // Waitlist state

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);

  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false);

  const [showSeatWaitlistDialog, setShowSeatWaitlistDialog] = useState(false);

  const [selectedWaitlistEntry, setSelectedWaitlistEntry] = useState<WaitlistEntry | null>(null);



  // Form states

  const [customerName, setCustomerName] = useState('');

  const [customerMobile, setCustomerMobile] = useState('');

  const [partySize, setPartySize] = useState('2');

  const [reservationDate, setReservationDate] = useState(selectedDate);

  const [reservationTime, setReservationTime] = useState('19:00');

  const [selectedTableId, setSelectedTableId] = useState('');

  const [notes, setNotes] = useState('');

  // React Query hooks
  const { data: reservationsData } = useReservations(restaurant?.id);
  const { data: tablesData } = useTables(restaurant?.id);
  const createReservationMutation = useCreateReservation(restaurant?.id);
  const updateReservationMutation = useUpdateReservation(restaurant?.id);

  const reservations = useMemo(() => reservationsData?.reservations || [], [reservationsData]);
  const tables = useMemo(() => tablesData?.tables?.filter((t: Table) => !t.mergedWith) || [], [tablesData]);

  // Load waitlist from localStorage
  useEffect(() => {
    if (!restaurant) return;
    const savedWaitlist = JSON.parse(localStorage.getItem(`waitlist_${restaurant.id}`) || '[]');
    setWaitlist(savedWaitlist.filter((w: WaitlistEntry) => w.status === 'waiting' || w.status === 'notified'));
  }, [restaurant?.id]);



  const saveWaitlist = (newWaitlist: WaitlistEntry[]) => {

    if (!restaurant) return;

    localStorage.setItem(`waitlist_${restaurant.id}`, JSON.stringify(newWaitlist));

    setWaitlist(newWaitlist.filter(w => w.status === 'waiting' || w.status === 'notified'));

  };



  // Calculate estimated wait time based on occupied tables and party size

  const calculateEstimatedWait = (partySize: number) => {

    const occupiedTables = tables.filter(t => t.status === 'occupied');

    const suitableTables = tables.filter(t => t.capacity >= partySize);

    const availableSuitable = suitableTables.filter(t => t.status === 'available').length;



    if (availableSuitable > 0) return 0;



    // Estimate based on average dining time (45 min) and queue position

    const waitingForSize = waitlist.filter(w =>

      w.status === 'waiting' && w.partySize <= partySize

    ).length;



    const baseWait = occupiedTables.length > 0 ? 30 : 0; // Base 30 min if tables are occupied

    const queueWait = waitingForSize * 15; // 15 min per party ahead



    return Math.min(baseWait + queueWait, 120); // Cap at 2 hours

  };



  const handleAddToWaitlist = () => {

    if (!restaurant) return;

    if (!customerName || !customerMobile) {

      toast.error('Please fill in customer name and mobile');

      return;

    }



    const entry: WaitlistEntry = {

      id: `wait_${Date.now()}`,

      restaurantId: restaurant.id,

      customerName,

      customerMobile,

      partySize: parseInt(partySize) || 2,

      addedAt: new Date().toISOString(),

      estimatedWait: calculateEstimatedWait(parseInt(partySize) || 2),

      status: 'waiting',

      notes: notes || undefined,

    };



    const allWaitlist = JSON.parse(localStorage.getItem(`waitlist_${restaurant.id}`) || '[]');

    allWaitlist.push(entry);

    saveWaitlist(allWaitlist);



    resetForm();

    setShowWaitlistDialog(false);

    toast.success(`Added ${customerName} to waitlist (Est. wait: ${entry.estimatedWait} min)`);

  };



  const handleNotifyWaitlist = (entry: WaitlistEntry) => {

    if (!restaurant) return;

    const allWaitlist = JSON.parse(localStorage.getItem(`waitlist_${restaurant.id}`) || '[]');

    const updated = allWaitlist.map((w: WaitlistEntry) =>

      w.id === entry.id ? { ...w, status: 'notified' as const } : w

    );

    saveWaitlist(updated);

    toast.success(`Notified ${entry.customerName} - their table is ready!`);

  };



  const handleRemoveFromWaitlist = (entry: WaitlistEntry, reason: 'seated' | 'left') => {

    if (!restaurant) return;

    const allWaitlist = JSON.parse(localStorage.getItem(`waitlist_${restaurant.id}`) || '[]');

    const updated = allWaitlist.map((w: WaitlistEntry) =>

      w.id === entry.id ? { ...w, status: reason } : w

    );

    saveWaitlist(updated);

    toast.success(reason === 'seated' ? `${entry.customerName} has been seated` : `${entry.customerName} removed from waitlist`);

  };



  const handleSeatFromWaitlist = () => {

    if (!restaurant || !selectedWaitlistEntry || !selectedTableId) {

      toast.error('Please select a table');

      return;

    }



    // Mark as seated in waitlist

    handleRemoveFromWaitlist(selectedWaitlistEntry, 'seated');



    setShowSeatWaitlistDialog(false);

    setSelectedWaitlistEntry(null);

    setSelectedTableId('');

  };



  // Get elapsed time since added to waitlist

  const getWaitingTime = (addedAt: string) => {

    const diff = Date.now() - new Date(addedAt).getTime();

    const minutes = Math.floor(diff / 60000);

    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);

    const mins = minutes % 60;

    return `${hours}h ${mins}m`;

  };



  const handleAddReservation = () => {

    if (!restaurant) return;

    if (!customerName || !customerMobile || !reservationDate || !reservationTime) {

      toast.error('Please fill in all required fields');

      return;

    }



    const reservation: Reservation = {

      id: `res_${Date.now()}`,

      restaurantId: restaurant.id,

      customerName,

      customerMobile,

      partySize: parseInt(partySize) || 2,

      date: reservationDate,

      time: reservationTime,

      status: 'confirmed',

      notes: notes || undefined,

      createdAt: new Date().toISOString()

    };



    createReservationMutation.mutate(
      {
        restaurantId: restaurant.id,
        customerName,
        customerMobile,
        partySize: parseInt(partySize) || 2,
        date: reservationDate,
        time: reservationTime,
        notes: notes || undefined,
      } as any,
      {
        onSuccess: () => {
          resetForm();
          setShowAddDialog(false);
        },
      }
    );

  };



  const handleSeatReservation = () => {

    if (!restaurant || !selectedReservation || !selectedTableId) {

      toast.error('Please select a table');

      return;

    }



    updateReservationMutation.mutate(
      {
        reservationId: selectedReservation.id,
        status: 'seated',
        tableId: selectedTableId,
      },
      {
        onSuccess: () => {
          setShowSeatDialog(false);
          setSelectedReservation(null);
          toast.success('Guest seated successfully');
        },
      }
    );

  };



  const handleCancelReservation = (reservationId: string) => {

    if (!restaurant) return;

    if (confirm('Are you sure you want to cancel this reservation?')) {

      updateReservationMutation.mutate({ reservationId: reservationId, status: 'cancelled' });

    }

  };



  const handleMarkNoShow = (reservationId: string) => {

    if (!restaurant) return;

    if (confirm('Mark this reservation as no-show?')) {

      updateReservationMutation.mutate({ reservationId: reservationId, status: 'noShow' });

    }

  };



  const resetForm = () => {

    setCustomerName('');

    setCustomerMobile('');

    setPartySize('2');

    setReservationDate(selectedDate);

    setReservationTime('19:00');

    setNotes('');

  };



  const filteredReservations = reservations.filter(r => r.date === selectedDate);



  const reservationsByStatus = {

    confirmed: filteredReservations.filter(r => r.status === 'confirmed'),

    seated: filteredReservations.filter(r => r.status === 'seated'),

    cancelled: filteredReservations.filter(r => r.status === 'cancelled'),

    noShow: filteredReservations.filter(r => r.status === 'noShow'),

  };



  const getAvailableTables = (partySize: number) => {

    return tables.filter(t =>

      t.status === 'available' &&

      t.capacity >= partySize &&

      !t.mergedWith

    );

  };



  const navigateDate = (days: number) => {

    const date = new Date(selectedDate);

    date.setDate(date.getDate() + days);

    setSelectedDate(date.toISOString().split('T')[0]);

  };



  const getStatusBadge = (status: string) => {

    switch (status) {

      case 'confirmed':

        return <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">Confirmed</span>;

      case 'seated':

        return <span className="px-2 py-1 bg-info/10 text-info rounded-full text-xs font-medium">Seated</span>;

      case 'cancelled':

        return <span className="px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium">Cancelled</span>;

      case 'noShow':

        return <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">No Show</span>;

      default:

        return null;

    }

  };



  if (!restaurant) {

    return null;

  }



  return (

    <div className="min-h-screen bg-background">

      <main className="p-4 md:p-6">

        {/* Header */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">

          <div className="flex items-center gap-3">

            <div className="bg-primary p-3 rounded-xl">

              <Calendar className="h-6 w-6 text-white" />

            </div>

            <div>

              <h1 className="text-xl md:text-2xl font-bold text-foreground">Reservations & Waitlist</h1>

              <p className="text-muted-foreground text-sm">Manage table bookings and walk-ins</p>

            </div>

          </div>



          <div className="flex gap-2">

            <Button

              onClick={() => {

                resetForm();

                setShowWaitlistDialog(true);

              }}

              variant="outline"

              className="border-warning text-warning hover:bg-warning/10"

            >

              <Users className="h-4 w-4 mr-2" />

              Add to Waitlist

            </Button>

            <Button

              onClick={() => {

                resetForm();

                setReservationDate(selectedDate);

                setShowAddDialog(true);

              }}

              className="bg-primary hover:bg-primary/90"

            >

              <Plus className="h-4 w-4 mr-2" />

              New Reservation

            </Button>

          </div>

        </div>



        {/* Tab Navigation */}

        <div className="flex gap-2 mb-6">

          <button

            onClick={() => setActiveTab('reservations')}

            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${

              activeTab === 'reservations'

                ? 'bg-primary text-white'

                : 'bg-muted text-muted-foreground hover:bg-muted/80'

            }`}

          >

            <Calendar className="h-4 w-4" />

            Reservations

          </button>

          <button

            onClick={() => setActiveTab('waitlist')}

            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${

              activeTab === 'waitlist'

                ? 'bg-warning text-white'

                : 'bg-muted text-muted-foreground hover:bg-muted/80'

            }`}

          >

            <Clock className="h-4 w-4" />

            Waitlist

            {waitlist.length > 0 && (

              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">

                {waitlist.length}

              </span>

            )}

          </button>

        </div>



        {activeTab === 'reservations' && (

          <>

            {/* Date Navigation */}

            <Card className="p-4 mb-6">

              <div className="flex items-center justify-between">

                <button

                  onClick={() => navigateDate(-1)}

                  className="p-2 hover:bg-muted rounded-lg"

                >

                  <ChevronLeft className="h-5 w-5" />

                </button>

                <div className="text-center">

                  <div className="text-lg font-bold text-foreground">

                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}

                  </div>

                  <div className="text-sm text-muted-foreground">

                    {filteredReservations.filter(r => r.status === 'confirmed').length} confirmed bookings

                  </div>

                </div>

                <button

                  onClick={() => navigateDate(1)}

                  className="p-2 hover:bg-muted rounded-lg"

                >

                  <ChevronRight className="h-5 w-5" />

                </button>

              </div>

              <input

                type="date"

                value={selectedDate}

                onChange={(e) => setSelectedDate(e.target.value)}

                className="w-full mt-3 p-2 border border-border rounded-lg bg-background"

              />

            </Card>



            {/* Summary Cards */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <Card className="p-4 bg-primary/10 border-primary/20">

            <div className="text-primary text-xs">Confirmed</div>

            <div className="text-2xl font-bold text-primary">{reservationsByStatus.confirmed.length}</div>

          </Card>

          <Card className="p-4 bg-info/10 border-info/20">

            <div className="text-info text-xs">Seated</div>

            <div className="text-2xl font-bold text-info">{reservationsByStatus.seated.length}</div>

          </Card>

          <Card className="p-4 bg-destructive/10 border-destructive/20">

            <div className="text-destructive text-xs">Cancelled</div>

            <div className="text-2xl font-bold text-destructive">{reservationsByStatus.cancelled.length}</div>

          </Card>

          <Card className="p-4 bg-muted">

            <div className="text-muted-foreground text-xs">No Show</div>

            <div className="text-2xl font-bold text-foreground">{reservationsByStatus.noShow.length}</div>

          </Card>

        </div>



        {/* Reservations List */}

        <Card className="overflow-hidden">

          <div className="p-4 border-b bg-muted">

            <h3 className="font-semibold text-foreground">Bookings for {selectedDate}</h3>

          </div>



          {filteredReservations.length > 0 ? (

            <div className="divide-y">

              {filteredReservations

                .sort((a, b) => a.time.localeCompare(b.time))

                .map((reservation) => (

                <div key={reservation.id} className="p-4 hover:bg-muted/50">

                  <div className="flex items-start justify-between">

                    <div className="flex items-start gap-4">

                      <div className="text-center min-w-[60px]">

                        <div className="text-xl font-bold text-foreground">{reservation.time}</div>

                        <div className="text-xs text-muted-foreground">

                          {new Date(`${reservation.date}T${reservation.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}

                        </div>

                      </div>



                      <div>

                        <div className="flex items-center gap-2">

                          <span className="font-medium text-foreground">{reservation.customerName}</span>

                          {getStatusBadge(reservation.status)}

                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">

                          <span className="flex items-center gap-1">

                            <Phone className="h-3 w-3" />

                            {reservation.customerMobile}

                          </span>

                          <span className="flex items-center gap-1">

                            <User className="h-3 w-3" />

                            {reservation.partySize} guests

                          </span>

                          {reservation.tableId && (

                            <span className="text-primary">

                              Table {tables.find(t => t.id === reservation.tableId)?.tableNumber}

                            </span>

                          )}

                        </div>

                        {reservation.notes && (

                          <div className="text-sm text-muted-foreground mt-2">{reservation.notes}</div>

                        )}

                      </div>

                    </div>



                    {/* Actions */}

                    <div className="flex items-center gap-2">

                      {reservation.status === 'confirmed' && (

                        <>

                          <button

                            onClick={() => {

                              setSelectedReservation(reservation);

                              setSelectedTableId('');

                              setShowSeatDialog(true);

                            }}

                            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"

                            title="Seat Guest"

                          >

                            <Check className="h-4 w-4" />

                          </button>

                          <button

                            onClick={() => handleMarkNoShow(reservation.id)}

                            className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"

                            title="Mark No-Show"

                          >

                            <X className="h-4 w-4" />

                          </button>

                          <button

                            onClick={() => handleCancelReservation(reservation.id)}

                            className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20"

                            title="Cancel"

                          >

                            <X className="h-4 w-4" />

                          </button>

                        </>

                      )}

                    </div>

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="p-12 text-center text-muted-foreground">

              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />

              <p>No reservations for this date</p>

              <Button

                onClick={() => setShowAddDialog(true)}

                variant="outline"

                className="mt-4"

              >

                Create First Reservation

              </Button>

            </div>

          )}

        </Card>

          </>

        )}



        {/* Waitlist Tab Content */}

        {activeTab === 'waitlist' && (

          <>

            {/* Waitlist Summary */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

              <Card className="p-4 bg-warning/10 border-warning/20">

                <div className="text-warning text-xs">Waiting</div>

                <div className="text-2xl font-bold text-warning">

                  {waitlist.filter(w => w.status === 'waiting').length}

                </div>

              </Card>

              <Card className="p-4 bg-primary/10 border-primary/20">

                <div className="text-primary text-xs">Notified</div>

                <div className="text-2xl font-bold text-primary">

                  {waitlist.filter(w => w.status === 'notified').length}

                </div>

              </Card>

              <Card className="p-4 bg-primary/10 border-primary/20">

                <div className="text-primary text-xs">Available Tables</div>

                <div className="text-2xl font-bold text-primary">

                  {tables.filter(t => t.status === 'available').length}

                </div>

              </Card>

              <Card className="p-4 bg-muted">

                <div className="text-muted-foreground text-xs">Est. Wait (2 pax)</div>

                <div className="text-2xl font-bold text-foreground">

                  {calculateEstimatedWait(2)} min

                </div>

              </Card>

            </div>



            {/* Waitlist Entries */}

            <Card className="overflow-hidden">

              <div className="p-4 border-b bg-warning/10">

                <h3 className="font-semibold text-foreground flex items-center gap-2">

                  <Clock className="h-4 w-4 text-warning" />

                  Current Waitlist

                </h3>

              </div>



              {waitlist.length > 0 ? (

                <div className="divide-y">

                  {waitlist.map((entry, index) => (

                    <div key={entry.id} className={`p-4 ${entry.status === 'notified' ? 'bg-primary/10' : 'hover:bg-muted/50'}`}>

                      <div className="flex items-start justify-between">

                        <div className="flex items-start gap-4">

                          {/* Position in queue */}

                          <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-warning font-bold text-sm">

                            {index + 1}

                          </div>



                          <div>

                            <div className="flex items-center gap-2">

                              <span className="font-medium text-foreground">{entry.customerName}</span>

                              {entry.status === 'notified' && (

                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">

                                  Notified

                                </span>

                              )}

                            </div>

                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">

                              <span className="flex items-center gap-1">

                                <Phone className="h-3 w-3" />

                                {entry.customerMobile}

                              </span>

                              <span className="flex items-center gap-1">

                                <Users className="h-3 w-3" />

                                {entry.partySize} guests

                              </span>

                              <span className="flex items-center gap-1 text-warning">

                                <Clock className="h-3 w-3" />

                                Waiting {getWaitingTime(entry.addedAt)}

                              </span>

                            </div>

                            {entry.notes && (

                              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">

                                <MessageSquare className="h-3 w-3" />

                                {entry.notes}

                              </div>

                            )}

                          </div>

                        </div>



                        {/* Actions */}

                        <div className="flex items-center gap-2">

                          {entry.status === 'waiting' && (

                            <button

                              onClick={() => handleNotifyWaitlist(entry)}

                              className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"

                              title="Notify Guest"

                            >

                              <Bell className="h-4 w-4" />

                            </button>

                          )}

                          <button

                            onClick={() => {

                              setSelectedWaitlistEntry(entry);

                              setSelectedTableId('');

                              setShowSeatWaitlistDialog(true);

                            }}

                            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"

                            title="Seat Guest"

                          >

                            <Check className="h-4 w-4" />

                          </button>

                          <button

                            onClick={() => handleRemoveFromWaitlist(entry, 'left')}

                            className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20"

                            title="Remove from Waitlist"

                          >

                            <X className="h-4 w-4" />

                          </button>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              ) : (

                <div className="p-12 text-center text-muted-foreground">

                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />

                  <p>No guests on the waitlist</p>

                  <p className="text-sm mt-1">Walk-ins will appear here when added</p>

                  <Button

                    onClick={() => {

                      resetForm();

                      setShowWaitlistDialog(true);

                    }}

                    variant="outline"

                    className="mt-4"

                  >

                    Add to Waitlist

                  </Button>

                </div>

              )}

            </Card>

          </>

        )}



        {/* Add Reservation Dialog */}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>

          <DialogContent className="sm:max-w-md">

            <DialogHeader>

              <DialogTitle>New Reservation</DialogTitle>

            </DialogHeader>

            <div className="space-y-4">

              <div>

                <label className="text-xs text-muted-foreground">Customer Name *</label>

                <Input

                  value={customerName}

                  onChange={(e) => setCustomerName(e.target.value)}

                  placeholder="Guest name"

                />

              </div>

              <div>

                <label className="text-xs text-muted-foreground">Mobile Number *</label>

                <Input

                  value={customerMobile}

                  onChange={(e) => setCustomerMobile(e.target.value)}

                  placeholder="Contact number"

                />

              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="text-xs text-muted-foreground">Date *</label>

                  <Input

                    type="date"

                    value={reservationDate}

                    onChange={(e) => setReservationDate(e.target.value)}

                  />

                </div>

                <div>

                  <label className="text-xs text-muted-foreground">Time *</label>

                  <Input

                    type="time"

                    value={reservationTime}

                    onChange={(e) => setReservationTime(e.target.value)}

                  />

                </div>

              </div>

              <div>

                <label className="text-xs text-muted-foreground">Party Size</label>

                <Input

                  type="number"

                  value={partySize}

                  onChange={(e) => setPartySize(e.target.value)}

                  min="1"

                />

              </div>

              <div>

                <label className="text-xs text-muted-foreground">Notes</label>

                <Input

                  value={notes}

                  onChange={(e) => setNotes(e.target.value)}

                  placeholder="Special requests, occasion, etc."

                />

              </div>

              <div className="flex gap-3">

                <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>

                  Cancel

                </Button>

                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleAddReservation}>

                  Create Reservation

                </Button>

              </div>

            </div>

          </DialogContent>

        </Dialog>



        {/* Seat Dialog */}

        <Dialog open={showSeatDialog} onOpenChange={setShowSeatDialog}>

          <DialogContent className="sm:max-w-md">

            <DialogHeader>

              <DialogTitle>Seat Guest - {selectedReservation?.customerName}</DialogTitle>

            </DialogHeader>

            <div className="space-y-4">

              <p className="text-sm text-muted-foreground">

                Party size: {selectedReservation?.partySize} guests

              </p>

              <div>

                <label className="text-xs text-muted-foreground">Select Table</label>

                <div className="grid grid-cols-4 gap-2 mt-2">

                  {getAvailableTables(selectedReservation?.partySize || 2).map((table) => (

                    <button

                      key={table.id}

                      onClick={() => setSelectedTableId(table.id)}

                      className={`p-3 rounded-lg border text-center transition-colors ${

                        selectedTableId === table.id

                          ? 'bg-primary text-white border-primary'

                          : 'bg-background border-border hover:border-primary/30'

                      }`}

                    >

                      <div className="font-bold">{table.tableNumber}</div>

                      <div className="text-xs opacity-70">{table.capacity} seats</div>

                    </button>

                  ))}

                </div>

                {getAvailableTables(selectedReservation?.partySize || 2).length === 0 && (

                  <p className="text-warning text-sm mt-2">No available tables for this party size</p>

                )}

              </div>

              <div className="flex gap-3">

                <Button variant="outline" className="flex-1" onClick={() => setShowSeatDialog(false)}>

                  Cancel

                </Button>

                <Button

                  className="flex-1 bg-primary hover:bg-primary/90"

                  onClick={handleSeatReservation}

                  disabled={!selectedTableId}

                >

                  Seat Guest

                </Button>

              </div>

            </div>

          </DialogContent>

        </Dialog>



        {/* Add to Waitlist Dialog */}

        <Dialog open={showWaitlistDialog} onOpenChange={setShowWaitlistDialog}>

          <DialogContent className="sm:max-w-md">

            <DialogHeader>

              <DialogTitle className="flex items-center gap-2">

                <Clock className="h-5 w-5 text-warning" />

                Add to Waitlist

              </DialogTitle>

            </DialogHeader>

            <div className="space-y-4">

              <div>

                <label className="text-xs text-muted-foreground">Customer Name *</label>

                <Input

                  value={customerName}

                  onChange={(e) => setCustomerName(e.target.value)}

                  placeholder="Guest name"

                />

              </div>

              <div>

                <label className="text-xs text-muted-foreground">Mobile Number *</label>

                <Input

                  value={customerMobile}

                  onChange={(e) => setCustomerMobile(e.target.value)}

                  placeholder="Contact number for notification"

                />

              </div>

              <div>

                <label className="text-xs text-muted-foreground">Party Size</label>

                <Input

                  type="number"

                  value={partySize}

                  onChange={(e) => setPartySize(e.target.value)}

                  min="1"

                />

              </div>

              <div>

                <label className="text-xs text-muted-foreground">Notes</label>

                <Input

                  value={notes}

                  onChange={(e) => setNotes(e.target.value)}

                  placeholder="Special requests, preferences..."

                />

              </div>



              {/* Estimated wait preview */}

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">

                <div className="text-sm text-warning font-medium">Estimated Wait Time</div>

                <div className="text-2xl font-bold text-warning">

                  {calculateEstimatedWait(parseInt(partySize) || 2)} minutes

                </div>

                <div className="text-xs text-warning mt-1">

                  Based on current occupancy and queue

                </div>

              </div>



              <div className="flex gap-3">

                <Button variant="outline" className="flex-1" onClick={() => setShowWaitlistDialog(false)}>

                  Cancel

                </Button>

                <Button className="flex-1 bg-warning hover:bg-warning/90" onClick={handleAddToWaitlist}>

                  Add to Waitlist

                </Button>

              </div>

            </div>

          </DialogContent>

        </Dialog>



        {/* Seat from Waitlist Dialog */}

        <Dialog open={showSeatWaitlistDialog} onOpenChange={setShowSeatWaitlistDialog}>

          <DialogContent className="sm:max-w-md">

            <DialogHeader>

              <DialogTitle>Seat Guest - {selectedWaitlistEntry?.customerName}</DialogTitle>

            </DialogHeader>

            <div className="space-y-4">

              <div className="bg-muted rounded-lg p-3">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-muted-foreground">Party size:</span>

                  <span className="font-medium">{selectedWaitlistEntry?.partySize} guests</span>

                </div>

                <div className="flex items-center justify-between text-sm mt-1">

                  <span className="text-muted-foreground">Waited:</span>

                  <span className="font-medium text-warning">

                    {selectedWaitlistEntry ? getWaitingTime(selectedWaitlistEntry.addedAt) : ''}

                  </span>

                </div>

              </div>



              <div>

                <label className="text-xs text-muted-foreground">Select Table</label>

                <div className="grid grid-cols-4 gap-2 mt-2">

                  {getAvailableTables(selectedWaitlistEntry?.partySize || 2).map((table) => (

                    <button

                      key={table.id}

                      onClick={() => setSelectedTableId(table.id)}

                      className={`p-3 rounded-lg border text-center transition-colors ${

                        selectedTableId === table.id

                          ? 'bg-primary text-white border-primary'

                          : 'bg-background border-border hover:border-primary/30'

                      }`}

                    >

                      <div className="font-bold">{table.tableNumber}</div>

                      <div className="text-xs opacity-70">{table.capacity} seats</div>

                    </button>

                  ))}

                </div>

                {getAvailableTables(selectedWaitlistEntry?.partySize || 2).length === 0 && (

                  <p className="text-warning text-sm mt-2">No available tables for this party size</p>

                )}

              </div>

              <div className="flex gap-3">

                <Button variant="outline" className="flex-1" onClick={() => setShowSeatWaitlistDialog(false)}>

                  Cancel

                </Button>

                <Button

                  className="flex-1 bg-primary hover:bg-primary/90"

                  onClick={handleSeatFromWaitlist}

                  disabled={!selectedTableId}

                >

                  Seat Guest

                </Button>

              </div>

            </div>

          </DialogContent>

        </Dialog>

      </main>

    </div>

  );

}



