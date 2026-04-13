'use client'

import { useState, useMemo } from 'react'
import { Calendar, Phone, Mail, Users, Clock, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Reservation {
  id: string
  guestName: string
  phone: string
  email: string
  date: string
  time: string
  partySize: number
  tablePreference?: string
  specialRequests?: string
  status: 'booked' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
  estimatedDuration: number
}

export default function RestaurantReservations() {
  const [currentTab, setCurrentTab] = useState<'today' | 'tomorrow' | 'week'>('today')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    guestName: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    partySize: '',
    tablePreference: '',
    specialRequests: '',
    status: 'booked',
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const reservations: Reservation[] = [
    {
      id: 'R1',
      guestName: 'Smith',
      phone: '+254 712 345 678',
      email: 'smith@example.com',
      date: '2024-01-15',
      time: '12:00',
      partySize: 4,
      tablePreference: 'Window',
      specialRequests: 'Birthday celebration',
      status: 'confirmed',
      estimatedDuration: 120,
    },
    {
      id: 'R2',
      guestName: 'Johnson',
      phone: '+254 723 456 789',
      email: 'johnson@example.com',
      date: '2024-01-15',
      time: '14:00',
      partySize: 6,
      tablePreference: 'Corner',
      specialRequests: 'Business meeting',
      status: 'booked',
      estimatedDuration: 90,
    },
    {
      id: 'R3',
      guestName: 'Walker',
      phone: '+254 734 567 890',
      email: 'walker@example.com',
      date: '2024-01-15',
      time: '18:30',
      partySize: 2,
      tablePreference: 'Intimate',
      specialRequests: 'Anniversary dinner',
      status: 'confirmed',
      estimatedDuration: 150,
    },
    {
      id: 'R4',
      guestName: 'Adams',
      phone: '+254 745 678 901',
      email: 'adams@example.com',
      date: '2024-01-15',
      time: '19:00',
      partySize: 8,
      tablePreference: 'Group',
      specialRequests: 'Vegetarian options required',
      status: 'booked',
      estimatedDuration: 120,
    },
    {
      id: 'R5',
      guestName: 'Brown',
      phone: '+254 756 789 012',
      email: 'brown@example.com',
      date: '2024-01-15',
      time: '12:30',
      partySize: 2,
      tablePreference: 'Bar seating',
      specialRequests: 'Gluten-free menu',
      status: 'seated',
      estimatedDuration: 90,
    },
    {
      id: 'R6',
      guestName: 'Davis',
      phone: '+254 767 890 123',
      email: 'davis@example.com',
      date: '2024-01-15',
      time: '13:00',
      partySize: 5,
      tablePreference: 'Patio',
      specialRequests: '',
      status: 'completed',
      estimatedDuration: 120,
    },
    {
      id: 'R7',
      guestName: 'Martinez',
      phone: '+254 778 901 234',
      email: 'martinez@example.com',
      date: '2024-01-15',
      time: '11:30',
      partySize: 3,
      tablePreference: 'Quiet area',
      specialRequests: 'Shellfish allergy',
      status: 'no_show',
      estimatedDuration: 120,
    },
    {
      id: 'R8',
      guestName: 'Garcia',
      phone: '+254 789 012 345',
      email: 'garcia@example.com',
      date: '2024-01-15',
      time: '20:00',
      partySize: 4,
      tablePreference: 'Window',
      specialRequests: 'Wine pairing',
      status: 'booked',
      estimatedDuration: 150,
    },
  ]

  const filteredReservations = useMemo(() => {
    let filtered = reservations
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus)
    }
    return filtered.sort((a, b) => a.time.localeCompare(b.time))
  }, [filterStatus])

  const stats = useMemo(() => {
    const booked = reservations.filter(r => r.status === 'booked').length
    const confirmed = reservations.filter(r => r.status === 'confirmed').length
    const seated = reservations.filter(r => r.status === 'seated').length
    const completed = reservations.filter(r => r.status === 'completed').length
    return { booked, confirmed, seated, completed }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-300'
      case 'confirmed':
        return 'bg-green-500/20 border-green-500/50 text-green-300'
      case 'seated':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-300'
      case 'completed':
        return 'bg-slate-500/20 border-slate-500/50 text-slate-300'
      case 'cancelled':
        return 'bg-red-500/20 border-red-500/50 text-red-300'
      case 'no_show':
        return 'bg-red-500/20 border-red-500/50 text-red-300'
      default:
        return 'bg-slate-500/20 border-slate-500/50 text-slate-300'
    }
  }

  const handleSelectReservation = (id: string) => {
    const res = reservations.find(r => r.id === id)
    if (res) {
      setSelectedReservation(id)
      setFormData({
        guestName: res.guestName,
        phone: res.phone,
        email: res.email,
        date: res.date,
        time: res.time,
        partySize: res.partySize.toString(),
        tablePreference: res.tablePreference || '',
        specialRequests: res.specialRequests || '',
        status: res.status,
      })
    }
  }

  const handleNewReservation = () => {
    setSelectedReservation(null)
    setFormData({
      guestName: '',
      phone: '',
      email: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      partySize: '',
      tablePreference: '',
      specialRequests: '',
      status: 'booked',
    })
    setIsDialogOpen(true)
  }

  const timelineHours = [
    '12pm', '12:30pm', '1pm', '1:30pm', '2pm', '2:30pm',
    '3pm', '3:30pm', '4pm', '4:30pm', '5pm', '5:30pm',
    '6pm', '6:30pm', '7pm', '7:30pm', '8pm', '8:30pm',
    '9pm', '9:30pm',
  ]

  const getTimelinePosition = (time: string) => {
    const [hour, minute] = time.split(':')
    const h = parseInt(hour)
    const m = parseInt(minute)
    const startHour = 12
    const totalMinutes = (h - startHour) * 60 + m
    return (totalMinutes / 30) * 100
  }

  const getTimelineWidth = (duration: number) => {
    return (duration / 30) * 100
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1">Reservations</h1>
          <p className="text-slate-400">Manage bookings and table assignments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewReservation} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {selectedReservation ? 'Edit Reservation' : 'New Reservation'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {selectedReservation ? 'Update guest details' : 'Create a new reservation'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Guest Name</Label>
                  <Input
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label className="text-white">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    placeholder="+254 712 345 678"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder="guest@example.com"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-white">Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-white">Time</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-white">Party Size</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.partySize}
                    onChange={(e) => setFormData({ ...formData, partySize: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Table Preference</Label>
                  <Select value={formData.tablePreference} onValueChange={(val) => setFormData({ ...formData, tablePreference: val })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="Window">Window</SelectItem>
                      <SelectItem value="Corner">Corner</SelectItem>
                      <SelectItem value="Intimate">Intimate</SelectItem>
                      <SelectItem value="Group">Group</SelectItem>
                      <SelectItem value="Bar">Bar seating</SelectItem>
                      <SelectItem value="Patio">Patio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="seated">Seated</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-white">Special Requests</Label>
                <Textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder="Dietary restrictions, occasion, notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {selectedReservation ? 'Update' : 'Create'} Reservation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2">
        {(['today', 'tomorrow', 'week'] as const).map(tab => (
          <Button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            variant={currentTab === tab ? 'default' : 'outline'}
            className={`capitalize ${
              currentTab === tab
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab === 'today' ? 'Today' : tab === 'tomorrow' ? 'Tomorrow' : 'This Week'}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Booked</p>
              <p className="text-2xl font-bold text-blue-400">{stats.booked}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Confirmed</p>
              <p className="text-2xl font-bold text-green-400">{stats.confirmed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Seated</p>
              <p className="text-2xl font-bold text-amber-400">{stats.seated}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Completed</p>
              <p className="text-2xl font-bold text-slate-300">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline View */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Reservation Timeline</CardTitle>
              <CardDescription className="text-slate-400">12pm - 10pm service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto pb-4">
                <div className="min-w-max">
                  {/* Timeline Header */}
                  <div className="flex gap-2 mb-4 px-4">
                    <div className="w-24 flex-shrink-0"></div>
                    <div className="flex gap-2">
                      {timelineHours.map(hour => (
                        <div key={hour} className="w-12 text-xs text-slate-400 text-center">
                          {hour}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Rows */}
                  {filteredReservations.map(res => (
                    <div key={res.id} className="flex gap-2 mb-3 items-center px-4">
                      <div className="w-24 flex-shrink-0">
                        <p className="text-sm font-semibold text-white">{res.guestName}</p>
                        <p className="text-xs text-slate-400">{res.partySize}p</p>
                      </div>
                      <div className="flex-1 h-10 relative bg-slate-700/20 rounded-lg">
                        <div
                          className={`absolute h-full rounded-lg border-l-4 flex items-center px-2 text-xs font-semibold text-white cursor-pointer transition-all hover:shadow-lg ${getStatusColor(res.status)}`}
                          style={{
                            left: `${getTimelinePosition(res.time)}%`,
                            width: `${getTimelineWidth(res.estimatedDuration)}%`,
                          }}
                          onClick={() => handleSelectReservation(res.id)}
                        >
                          {res.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List View & Filters */}
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl h-fit">
          <CardHeader>
            <CardTitle className="text-white">Reservations</CardTitle>
            <div className="mt-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="seated">Seated</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredReservations.map(res => (
                <div
                  key={res.id}
                  onClick={() => handleSelectReservation(res.id)}
                  className="p-3 rounded-lg bg-slate-700/20 border border-slate-700/30 hover:border-slate-600/50 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">{res.guestName}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {res.time}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(res.status)}`}>
                      {res.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-300">
                    <Users className="w-3 h-3 inline mr-1" />
                    {res.partySize} people
                  </div>
                  {res.specialRequests && (
                    <div className="text-xs text-slate-400 mt-1">
                      {res.specialRequests.substring(0, 40)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waitlist Section */}
      <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl mt-6">
        <CardHeader>
          <CardTitle className="text-white">Waitlist</CardTitle>
          <CardDescription className="text-slate-400">Guests waiting for available tables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <p>No guests on waitlist</p>
            <p className="text-sm mt-2">All tables available for current reservations</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
