'use client'

import { useState, useMemo } from 'react'
import { Eye, Plus, Trash2, Users, Clock, DollarSign, MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TableStatus {
  id: string
  name: string
  zone: 'Indoor' | 'Terrace' | 'Bar'
  shape: 'round' | 'rect'
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  waiter?: string
  pax?: number
  timeSeated?: string
  orderItems?: string[]
  orderTotal?: number
}

interface Zone {
  id: string
  name: string
  label: string
}

export default function RestaurantFloorMap() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [seatDialogOpen, setSeatDialogOpen] = useState(false)
  const [selectedPax, setSelectedPax] = useState<string>('')
  const [selectedWaiter, setSelectedWaiter] = useState<string>('')

  const zones: Zone[] = [
    { id: 'A', name: 'Zone A', label: 'Indoor' },
    { id: 'B', name: 'Zone B', label: 'Terrace' },
    { id: 'C', name: 'Zone C', label: 'Bar' },
  ]

  const waiters = ['James', 'Sarah', 'Mike', 'Anna', 'David', 'Emma', 'Lucas', 'Olivia']

  const tables: TableStatus[] = [
    // Zone A - Indoor (7 tables)
    { id: 'T1', name: 'T1', zone: 'Indoor', shape: 'round', capacity: 4, status: 'available' },
    { id: 'T2', name: 'T2', zone: 'Indoor', shape: 'round', capacity: 4, status: 'occupied', waiter: 'James', pax: 4, timeSeated: '12:30', orderItems: ['Salmon', 'Caesar Salad', 'Pasta'], orderTotal: 4500 },
    { id: 'T3', name: 'T3', zone: 'Indoor', shape: 'rect', capacity: 6, status: 'occupied', waiter: 'Sarah', pax: 2, timeSeated: '12:15', orderItems: ['Burger', 'Fries'], orderTotal: 2200 },
    { id: 'T4', name: 'T4', zone: 'Indoor', shape: 'round', capacity: 4, status: 'reserved' },
    { id: 'T5', name: 'T5', zone: 'Indoor', shape: 'rect', capacity: 6, status: 'available' },
    { id: 'T6', name: 'T6', zone: 'Indoor', shape: 'rect', capacity: 6, status: 'occupied', waiter: 'Mike', pax: 6, timeSeated: '11:45', orderItems: ['Pasta Carbonara (x2)', 'Grilled Veg', 'Lobster Bisque'], orderTotal: 7800 },
    { id: 'T7', name: 'T7', zone: 'Indoor', shape: 'round', capacity: 4, status: 'cleaning' },
    // Zone B - Terrace (4 tables)
    { id: 'T8', name: 'T8', zone: 'Terrace', shape: 'round', capacity: 4, status: 'occupied', waiter: 'Anna', pax: 3, timeSeated: '12:50', orderItems: ['Mojito', 'Espresso Martini', 'Iced Latte'], orderTotal: 3100 },
    { id: 'T9', name: 'T9', zone: 'Terrace', shape: 'rect', capacity: 6, status: 'available' },
    { id: 'T10', name: 'T10', zone: 'Terrace', shape: 'round', capacity: 4, status: 'available' },
    { id: 'T11', name: 'T11', zone: 'Terrace', shape: 'rect', capacity: 6, status: 'occupied', waiter: 'David', pax: 5, timeSeated: '12:00', orderItems: ['Steak Medium Rare', 'Truffle Fries', 'Vegetables'], orderTotal: 5600 },
    // Zone C - Bar (4 tables)
    { id: 'B1', name: 'B1', zone: 'Bar', shape: 'round', capacity: 2, status: 'available' },
    { id: 'B2', name: 'B2', zone: 'Bar', shape: 'round', capacity: 2, status: 'occupied', waiter: 'Emma', pax: 2, timeSeated: '13:05', orderItems: ['Fish & Chips', 'Coleslaw'], orderTotal: 1850 },
    { id: 'B3', name: 'B3', zone: 'Bar', shape: 'round', capacity: 2, status: 'available' },
    { id: 'B4', name: 'B4', zone: 'Bar', shape: 'round', capacity: 2, status: 'available' },
  ]

  const currentTable = selectedTable ? tables.find(t => t.id === selectedTable) : null

  const filteredTables = useMemo(() => {
    if (filterStatus === 'all') {
      return tables
    }
    return tables.filter(t => t.status === filterStatus)
  }, [filterStatus])

  const stats = useMemo(() => {
    const available = tables.filter(t => t.status === 'available').length
    const occupied = tables.filter(t => t.status === 'occupied').length
    const reserved = tables.filter(t => t.status === 'reserved').length
    const cleaning = tables.filter(t => t.status === 'cleaning').length
    const totalPax = tables.reduce((sum, t) => sum + (t.pax || 0), 0)
    return { available, occupied, reserved, cleaning, totalPax }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/20 border-green-500/70 hover:border-green-400'
      case 'occupied':
        return 'bg-amber-500/20 border-amber-500/70 hover:border-amber-400'
      case 'reserved':
        return 'bg-blue-500/20 border-blue-500/70 hover:border-blue-400'
      case 'cleaning':
        return 'bg-red-500/20 border-red-500/70 hover:border-red-400'
      default:
        return 'bg-slate-500/10 border-slate-500/50'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/20 border-green-500/50 text-green-300'
      case 'occupied':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-300'
      case 'reserved':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-300'
      case 'cleaning':
        return 'bg-red-500/20 border-red-500/50 text-red-300'
      default:
        return 'bg-slate-500/20 border-slate-500/50 text-slate-300'
    }
  }

  const renderTable = (table: TableStatus) => {
    const isSelected = selectedTable === table.id
    const baseClasses = `
      border-2 rounded-lg transition-all duration-200 cursor-pointer
      font-bold text-white flex flex-col items-center justify-center
      ${getStatusColor(table.status)}
      ${isSelected ? 'ring-2 ring-cyan-400 shadow-lg' : 'hover:shadow-md'}
    `

    if (table.shape === 'round') {
      return (
        <button
          key={table.id}
          className={`w-20 h-20 rounded-full ${baseClasses}`}
          onClick={() => setSelectedTable(table.id)}
        >
          <div className="text-sm">{table.name}</div>
          {table.pax && <div className="text-xs text-slate-300">{table.pax}p</div>}
        </button>
      )
    } else {
      return (
        <button
          key={table.id}
          className={`w-24 h-20 ${baseClasses}`}
          onClick={() => setSelectedTable(table.id)}
        >
          <div className="text-sm">{table.name}</div>
          {table.pax && <div className="text-xs text-slate-300">{table.pax}/{table.capacity}</div>}
        </button>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1">Floor Plan</h1>
          <p className="text-slate-400">Interactive table management</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Tables</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Status Legend & Stats */}
      <div className="mb-8 grid grid-cols-5 gap-4">
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Available</p>
              <p className="text-2xl font-bold text-green-400">{stats.available}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Occupied</p>
              <p className="text-2xl font-bold text-amber-400">{stats.occupied}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Reserved</p>
              <p className="text-2xl font-bold text-blue-400">{stats.reserved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Cleaning</p>
              <p className="text-2xl font-bold text-red-400">{stats.cleaning}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Total Pax Today</p>
              <p className="text-2xl font-bold text-blue-300">{stats.totalPax}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floor Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Floor Plan */}
        <div className="lg:col-span-2">
          {zones.map(zone => {
            const zoneTableIds = {
              'A': ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
              'B': ['T8', 'T9', 'T10', 'T11'],
              'C': ['B1', 'B2', 'B3', 'B4'],
            }
            const zoneInZones = zoneTableIds[zone.id as keyof typeof zoneTableIds] || []
            const zoneTables = tables.filter(t => zoneInZones.includes(t.id))

            return (
              <Card key={zone.id} className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl mb-8">
                <CardHeader>
                  <CardTitle className="text-white">{zone.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-6">
                    {zoneTables.map(table => renderTable(table))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Side Panel */}
        <div>
          {currentTable ? (
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">{currentTable.name}</CardTitle>
                  <Badge variant="outline" className={`${getStatusBadgeColor(currentTable.status)}`}>
                    {currentTable.status}
                  </Badge>
                </div>
                <CardDescription className="text-slate-400">{currentTable.zone} • {currentTable.shape}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Capacity</p>
                  <p className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {currentTable.capacity} seats
                  </p>
                </div>

                {currentTable.status === 'available' && (
                  <Dialog open={seatDialogOpen} onOpenChange={setSeatDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Seat Guests
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Seat Guests at {currentTable.name}</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          Enter guest details to open POS
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-white">Number of Guests</Label>
                          <Input
                            type="number"
                            min="1"
                            max={currentTable.capacity}
                            value={selectedPax}
                            onChange={(e) => setSelectedPax(e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white mt-1"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Assign Waiter</Label>
                          <Select value={selectedWaiter} onValueChange={setSelectedWaiter}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                              <SelectValue placeholder="Select waiter" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              {waiters.map(waiter => (
                                <SelectItem key={waiter} value={waiter}>
                                  {waiter}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          Open POS
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {currentTable.status === 'occupied' && (
                  <>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Waiter</p>
                        <p className="text-sm font-semibold text-white">{currentTable.waiter}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Party Size</p>
                        <p className="text-sm font-semibold text-white">{currentTable.pax} / {currentTable.capacity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Time Seated</p>
                        <p className="text-sm font-semibold text-white flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {currentTable.timeSeated}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Order Items</p>
                        <div className="text-sm text-slate-300 space-y-1">
                          {currentTable.orderItems?.map((item, idx) => (
                            <p key={idx}>• {item}</p>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-600">
                        <p className="text-xs text-slate-400 mb-1">Order Total</p>
                        <p className="text-lg font-bold text-white flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          KES {currentTable.orderTotal}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Eye className="w-4 h-4 mr-2" />
                      View Order
                    </Button>
                    <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                      Mark for Cleaning
                    </Button>
                  </>
                )}

                {currentTable.status === 'reserved' && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Guest Name</p>
                      <p className="text-sm font-semibold text-white">Johnson</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Party Size</p>
                      <p className="text-sm font-semibold text-white">6 guests</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Reservation Time</p>
                      <p className="text-sm font-semibold text-white">2:00 PM</p>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Seat Party
                    </Button>
                  </div>
                )}

                {currentTable.status === 'cleaning' && (
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Mark Available
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setSelectedTable(null)}
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 mt-4"
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
              <CardContent className="pt-6">
                <div className="text-center text-slate-400 py-8">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Select a table to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
