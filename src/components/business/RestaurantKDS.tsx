'use client'

import { useState, useMemo, useEffect } from 'react'
import { Clock, Volume2, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface KOTItem {
  name: string
  qty: number
  modifiers?: string[]
}

interface KOT {
  id: string
  orderNumber: string
  table: string
  channel: 'dine-in' | 'delivery' | 'takeout'
  items: KOTItem[]
  station: 'Grill' | 'Cold' | 'Hot' | 'Drinks' | 'Pass'
  status: 'queued' | 'in_prep' | 'ready' | 'served'
  createdAt: Date
  elapsedSeconds: number
}

const STATION_SLAS: Record<string, number> = {
  'Grill': 14 * 60,
  'Cold': 8 * 60,
  'Hot': 12 * 60,
  'Drinks': 5 * 60,
  'Pass': 3 * 60,
}

export default function RestaurantKDS() {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [kotElapsed, setKotElapsed] = useState<Record<string, number>>({})
  const [kotStatus, setKotStatus] = useState<Record<string, KOT['status']>>({})
  const [filterStation, setFilterStation] = useState<string>('all')
  const [overdue, setOverdue] = useState<Set<string>>(new Set())

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const mockKOTs: KOT[] = [
    {
      id: 'K1',
      orderNumber: '#2401',
      table: 'T2',
      channel: 'dine-in',
      items: [
        { name: 'Grilled Salmon', qty: 1, modifiers: ['Medium', 'Extra Lemon'] },
        { name: 'Caesar Salad', qty: 1, modifiers: ['No Croutons'] },
      ],
      station: 'Grill',
      status: 'queued',
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      elapsedSeconds: 300,
    },
    {
      id: 'K2',
      orderNumber: '#2402',
      table: 'T3',
      channel: 'dine-in',
      items: [
        { name: 'Burger', qty: 1, modifiers: ['Medium', 'No Onions'] },
        { name: 'Fries', qty: 1, modifiers: ['Extra Salt'] },
      ],
      station: 'Grill',
      status: 'in_prep',
      createdAt: new Date(Date.now() - 3 * 60 * 1000),
      elapsedSeconds: 180,
    },
    {
      id: 'K3',
      orderNumber: '#2403',
      table: 'T6',
      channel: 'dine-in',
      items: [
        { name: 'Pasta Carbonara', qty: 2, modifiers: ['Al Dente'] },
        { name: 'Grilled Vegetables', qty: 1 },
      ],
      station: 'Hot',
      status: 'in_prep',
      createdAt: new Date(Date.now() - 5 * 60 * 1000 - 20 * 1000),
      elapsedSeconds: 320,
    },
    {
      id: 'K4',
      orderNumber: '#2404',
      table: 'T8',
      channel: 'dine-in',
      items: [
        { name: 'Mojito', qty: 1 },
        { name: 'Espresso Martini', qty: 1 },
        { name: 'Iced Latte', qty: 1 },
      ],
      station: 'Drinks',
      status: 'ready',
      createdAt: new Date(Date.now() - 2 * 60 * 1000),
      elapsedSeconds: 120,
    },
    {
      id: 'K5',
      orderNumber: '#2405',
      table: 'T11',
      channel: 'dine-in',
      items: [
        { name: 'Steak', qty: 1, modifiers: ['Medium Rare'] },
        { name: 'Truffle Fries', qty: 1 },
      ],
      station: 'Grill',
      status: 'in_prep',
      createdAt: new Date(Date.now() - 4 * 60 * 1000 - 50 * 1000),
      elapsedSeconds: 290,
    },
    {
      id: 'K6',
      orderNumber: '#2406',
      table: 'T14',
      channel: 'dine-in',
      items: [
        { name: 'Fish & Chips', qty: 1 },
        { name: 'Coleslaw', qty: 1 },
      ],
      station: 'Grill',
      status: 'queued',
      createdAt: new Date(Date.now() - 90 * 1000),
      elapsedSeconds: 90,
    },
    {
      id: 'K7',
      orderNumber: '#2407',
      table: 'T2',
      channel: 'dine-in',
      items: [
        { name: 'Chocolate Mousse', qty: 1 },
        { name: 'Tiramisu', qty: 1 },
      ],
      station: 'Cold',
      status: 'ready',
      createdAt: new Date(Date.now() - 90 * 1000),
      elapsedSeconds: 90,
    },
    {
      id: 'K8',
      orderNumber: '#2408',
      table: 'T6',
      channel: 'dine-in',
      items: [
        { name: 'Lobster Bisque', qty: 1 },
        { name: 'Bread Basket', qty: 1 },
      ],
      station: 'Hot',
      status: 'queued',
      createdAt: new Date(Date.now() - 60 * 1000),
      elapsedSeconds: 60,
    },
    {
      id: 'K9',
      orderNumber: '#2409',
      table: 'Delivery',
      channel: 'delivery',
      items: [
        { name: 'Chicken Tikka Masala', qty: 2, modifiers: ['Medium Spice'] },
        { name: 'Basmati Rice', qty: 1 },
        { name: 'Naan', qty: 2 },
      ],
      station: 'Hot',
      status: 'queued',
      createdAt: new Date(Date.now() - 2 * 60 * 1000),
      elapsedSeconds: 120,
    },
    {
      id: 'K10',
      orderNumber: '#2410',
      table: 'Takeout',
      channel: 'takeout',
      items: [
        { name: 'Turkey Club Sandwich', qty: 1, modifiers: ['Toasted'] },
        { name: 'Sweet Potato Fries', qty: 1 },
      ],
      station: 'Grill',
      status: 'ready',
      createdAt: new Date(Date.now() - 3 * 60 * 1000),
      elapsedSeconds: 180,
    },
    {
      id: 'K11',
      orderNumber: '#2411',
      table: 'T9',
      channel: 'dine-in',
      items: [
        { name: 'Caprese Salad', qty: 1 },
        { name: 'Focaccia Bread', qty: 1 },
      ],
      station: 'Cold',
      status: 'in_prep',
      createdAt: new Date(Date.now() - 4 * 60 * 1000),
      elapsedSeconds: 240,
    },
    {
      id: 'K12',
      orderNumber: '#2412',
      table: 'T13',
      channel: 'dine-in',
      items: [
        { name: 'Duck Confit', qty: 2 },
        { name: 'Herb Puree', qty: 1 },
      ],
      station: 'Hot',
      status: 'in_prep',
      createdAt: new Date(Date.now() - 6 * 60 * 1000),
      elapsedSeconds: 360,
    },
  ]

  // Initialize status from mock data
  useEffect(() => {
    const initialStatus: Record<string, KOT['status']> = {}
    mockKOTs.forEach(kot => {
      initialStatus[kot.id] = kotStatus[kot.id] || kot.status
    })
    setKotStatus(initialStatus)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setKotElapsed(prev => {
        const updated = { ...prev }
        mockKOTs.forEach(kot => {
          updated[kot.id] = (updated[kot.id] || kot.elapsedSeconds) + 1
        })
        return updated
      })

      // Check for overdue tickets
      const overdueSLAs = new Set<string>()
      mockKOTs.forEach(kot => {
        const elapsed = kotElapsed[kot.id] || kot.elapsedSeconds
        const sla = STATION_SLAS[kot.station] || 600
        if (elapsed > sla && (kotStatus[kot.id] === 'queued' || kotStatus[kot.id] === 'in_prep')) {
          overdueSLAs.add(kot.id)
        }
      })
      setOverdue(overdueSLAs)
    }, 1000)
    return () => clearInterval(timer)
  }, [kotStatus])

  const stations = ['Grill', 'Cold', 'Hot', 'Drinks', 'Pass']

  const filteredKOTs = useMemo(() => {
    if (filterStation === 'all') {
      return mockKOTs
    }
    return mockKOTs.filter(kot => kot.station === filterStation)
  }, [filterStation])

  const kotsByStation = useMemo(() => {
    const grouped: Record<string, typeof mockKOTs> = {}
    stations.forEach(station => {
      grouped[station] = filteredKOTs.filter(kot => kot.station === station).sort((a, b) => {
        const statusOrder = { 'queued': 0, 'in_prep': 1, 'ready': 2, 'served': 3 }
        const statusDiff = statusOrder[a.status] - statusOrder[b.status]
        if (statusDiff !== 0) return statusDiff
        return (kotElapsed[a.id] || a.elapsedSeconds) - (kotElapsed[b.id] || b.elapsedSeconds)
      })
    })
    return grouped
  }, [filteredKOTs, kotElapsed])

  const stats = useMemo(() => {
    const allKOTs = Object.values(kotsByStation).flat()
    return {
      inQueue: allKOTs.filter(k => k.status === 'queued').length,
      inPrep: allKOTs.filter(k => k.status === 'in_prep').length,
      ready: allKOTs.filter(k => k.status === 'ready').length,
      avgWaitTime: allKOTs.length > 0
        ? Math.round(allKOTs.reduce((sum, k) => sum + (kotElapsed[k.id] || k.elapsedSeconds), 0) / allKOTs.length)
        : 0,
    }
  }, [kotsByStation, kotElapsed])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSLAPercentage = (kotId: string, station: string) => {
    const elapsed = kotElapsed[kotId] || mockKOTs.find(k => k.id === kotId)?.elapsedSeconds || 0
    const sla = STATION_SLAS[station] || 600
    return Math.min(100, (elapsed / sla) * 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'border-l-4 border-l-yellow-500 bg-yellow-500/5'
      case 'in_prep':
        return 'border-l-4 border-l-blue-500 bg-blue-500/5'
      case 'ready':
        return 'border-l-4 border-l-green-500 bg-green-500/5'
      case 'served':
        return 'border-l-4 border-l-gray-500 bg-gray-500/5'
      default:
        return 'border-l-4 border-l-slate-500 bg-slate-500/5'
    }
  }

  const handleStatusChange = (kotId: string) => {
    setKotStatus(prev => {
      const current = prev[kotId] || 'queued'
      const nextStatus: Record<string, KOT['status']> = {
        'queued': 'in_prep',
        'in_prep': 'ready',
        'ready': 'served',
        'served': 'served',
      }
      return {
        ...prev,
        [kotId]: nextStatus[current] || 'queued',
      }
    })
  }

  const handleBumpKOT = (kotId: string) => {
    // Bump moves to top of queue
    console.log(`Bumping KOT ${kotId}`)
  }

  const handleBumpAllReady = () => {
    const readyKOTs = Object.entries(kotStatus).filter(([_, status]) => status === 'ready')
    readyKOTs.forEach(([kotId]) => {
      setKotStatus(prev => ({
        ...prev,
        [kotId]: 'served',
      }))
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1">Kitchen Display System</h1>
          <p className="text-slate-400">Kanban view • All stations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-blue-400">{currentTime}</div>
          </div>
          {overdue.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50">
              <Volume2 className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="text-red-300 font-semibold">{overdue.size} Overdue</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1">
          <Select value={filterStation} onValueChange={setFilterStation}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filter by station" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Stations</SelectItem>
              <SelectItem value="Grill">Grill</SelectItem>
              <SelectItem value="Cold">Cold</SelectItem>
              <SelectItem value="Hot">Hot</SelectItem>
              <SelectItem value="Drinks">Drinks</SelectItem>
              <SelectItem value="Pass">Pass</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleBumpAllReady}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={stats.ready === 0}
        >
          <Zap className="w-4 h-4 mr-2" />
          Bump All Ready ({stats.ready})
        </Button>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {filterStation === 'all' ? (
          stations.map(station => (
            <div key={station} className="flex flex-col">
              <div className="mb-4 pb-4 border-b border-slate-700">
                <h2 className="text-lg font-bold text-white">{station}</h2>
                <p className="text-xs text-slate-400">SLA: {STATION_SLAS[station] / 60}m</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
                {kotsByStation[station]?.map(kot => (
                  <div
                    key={kot.id}
                    className={`p-4 rounded-lg transition-all duration-200 ${getStatusColor(kotStatus[kot.id] || kot.status)} ${overdue.has(kot.id) ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-bold text-white">{kot.orderNumber}</div>
                        <div className="text-xs text-slate-400">{kot.table} • {kot.channel}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-blue-300">
                          {formatTime(kotElapsed[kot.id] || kot.elapsedSeconds)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 space-y-1">
                      {kot.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-200">
                          <span className="font-semibold">{item.qty}x</span> {item.name}
                          {item.modifiers && (
                            <div className="text-xs text-slate-400 ml-4">{item.modifiers.join(', ')}</div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* SLA Bar */}
                    <div className="mb-3">
                      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getSLAPercentage(kot.id, station) < 50 ? 'bg-green-500' : getSLAPercentage(kot.id, station) < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${getSLAPercentage(kot.id, station)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(kot.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                      >
                        {kotStatus[kot.id] === 'queued' ? 'Start Prep' :
                         kotStatus[kot.id] === 'in_prep' ? 'Mark Ready' :
                         kotStatus[kot.id] === 'ready' ? 'Served' :
                         'Done'}
                      </Button>
                      {kotStatus[kot.id] !== 'served' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBumpKOT(kot.id)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-8"
                        >
                          Bump
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {kotsByStation[station]?.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <p>No active KOTs</p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          // Single station view
          <div className="col-span-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">{filterStation} Station</h2>
              <p className="text-slate-400">SLA: {STATION_SLAS[filterStation] / 60} minutes</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kotsByStation[filterStation]?.map(kot => (
                <div
                  key={kot.id}
                  className={`p-4 rounded-lg transition-all duration-200 ${getStatusColor(kotStatus[kot.id] || kot.status)} ${overdue.has(kot.id) ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-bold text-white">{kot.orderNumber}</div>
                      <div className="text-xs text-slate-400">{kot.table} • {kot.channel}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-blue-300">
                        {formatTime(kotElapsed[kot.id] || kot.elapsedSeconds)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 space-y-1">
                    {kot.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-slate-200">
                        <span className="font-semibold">{item.qty}x</span> {item.name}
                        {item.modifiers && (
                          <div className="text-xs text-slate-400 ml-4">{item.modifiers.join(', ')}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* SLA Bar */}
                  <div className="mb-3">
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getSLAPercentage(kot.id, filterStation) < 50 ? 'bg-green-500' : getSLAPercentage(kot.id, filterStation) < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${getSLAPercentage(kot.id, filterStation)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(kot.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                    >
                      {kotStatus[kot.id] === 'queued' ? 'Start Prep' :
                       kotStatus[kot.id] === 'in_prep' ? 'Mark Ready' :
                       kotStatus[kot.id] === 'ready' ? 'Served' :
                       'Done'}
                    </Button>
                    {kotStatus[kot.id] !== 'served' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBumpKOT(kot.id)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-8"
                      >
                        Bump
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {kotsByStation[filterStation]?.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p>No active KOTs in {filterStation} station</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="flex items-center gap-6 px-6 py-4 rounded-lg bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl">
        <div>
          <p className="text-xs text-slate-400">In Queue</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.inQueue}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">In Prep</p>
          <p className="text-2xl font-bold text-blue-400">{stats.inPrep}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Ready</p>
          <p className="text-2xl font-bold text-green-400">{stats.ready}</p>
        </div>
        <div className="ml-auto">
          <p className="text-xs text-slate-400">Avg Wait Time</p>
          <p className="text-2xl font-bold text-white">{formatTime(stats.avgWaitTime)}</p>
        </div>
      </div>
    </div>
  )
}
