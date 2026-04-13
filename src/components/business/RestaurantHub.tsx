'use client'

import { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Clock, Users, DollarSign, AlertCircle, UtensilsCrossed, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface KPIData {
  label: string
  value: string | number
  trend: number
  comparison: string
  icon: React.ReactNode
}

interface TableStatus {
  id: string
  name: string
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  pax?: number
  waiter?: string
  timeSeated?: string
  orderTotal?: number
}

interface KOTData {
  id: string
  orderNumber: string
  table: string
  status: 'queued' | 'in_prep' | 'ready'
  items: string[]
  station: string
  elapsedSeconds: number
}

interface OrderData {
  id: string
  table: string
  channel: 'dine-in' | 'delivery' | 'takeout'
  itemCount: number
  total: number
  status: 'open' | 'paid' | 'voided'
  time: string
}

interface ChartDataPoint {
  hour: string
  revenue: number
}

export default function RestaurantHub() {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [tablePopover, setTablePopover] = useState<string | null>(null)
  const [kotElapsed, setKotElapsed] = useState<Record<string, number>>({})

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setKotElapsed(prev => {
        const updated = { ...prev }
        kots.forEach(kot => {
          updated[kot.id] = (updated[kot.id] || kot.elapsedSeconds) + 1
        })
        return updated
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const tables: TableStatus[] = [
    { id: 'T1', name: 'T1', status: 'available' },
    { id: 'T2', name: 'T2', status: 'occupied', pax: 4, waiter: 'James', timeSeated: '12:30', orderTotal: 4500 },
    { id: 'T3', name: 'T3', status: 'occupied', pax: 2, waiter: 'Sarah', timeSeated: '12:15', orderTotal: 2200 },
    { id: 'T4', name: 'T4', status: 'available' },
    { id: 'T5', name: 'T5', status: 'reserved' },
    { id: 'T6', name: 'T6', status: 'occupied', pax: 6, waiter: 'Mike', timeSeated: '11:45', orderTotal: 7800 },
    { id: 'T7', name: 'T7', status: 'available' },
    { id: 'T8', name: 'T8', status: 'occupied', pax: 3, waiter: 'Anna', timeSeated: '12:50', orderTotal: 3100 },
    { id: 'T9', name: 'T9', status: 'cleaning' },
    { id: 'T10', name: 'T10', status: 'available' },
    { id: 'T11', name: 'T11', status: 'occupied', pax: 5, waiter: 'David', timeSeated: '12:00', orderTotal: 5600 },
    { id: 'T12', name: 'T12', status: 'available' },
    { id: 'T13', name: 'T13', status: 'reserved' },
    { id: 'T14', name: 'T14', status: 'occupied', pax: 2, waiter: 'Emma', timeSeated: '13:05', orderTotal: 1850 },
    { id: 'T15', name: 'T15', status: 'available' },
  ]

  const kots: KOTData[] = [
    { id: 'K1', orderNumber: '#2401', table: 'T2', status: 'queued', items: ['Grilled Salmon', 'Caesar Salad'], station: 'Hot', elapsedSeconds: 245 },
    { id: 'K2', orderNumber: '#2402', table: 'T3', status: 'in_prep', items: ['Burger Medium', 'Fries'], station: 'Grill', elapsedSeconds: 180 },
    { id: 'K3', orderNumber: '#2403', table: 'T6', status: 'in_prep', items: ['Pasta Carbonara (x2)', 'Grilled Vegetables'], station: 'Hot', elapsedSeconds: 320 },
    { id: 'K4', orderNumber: '#2404', table: 'T8', status: 'ready', items: ['Mojito', 'Espresso Martini', 'Iced Latte'], station: 'Drinks', elapsedSeconds: 145 },
    { id: 'K5', orderNumber: '#2405', table: 'T11', status: 'in_prep', items: ['Steak Medium Rare', 'Truffle Fries'], station: 'Grill', elapsedSeconds: 290 },
    { id: 'K6', orderNumber: '#2406', table: 'T14', status: 'queued', items: ['Fish & Chips', 'Coleslaw'], station: 'Grill', elapsedSeconds: 95 },
    { id: 'K7', orderNumber: '#2407', table: 'T2', status: 'ready', items: ['Chocolate Mousse', 'Tiramisu'], station: 'Pass', elapsedSeconds: 120 },
    { id: 'K8', orderNumber: '#2408', table: 'T6', status: 'queued', items: ['Lobster Bisque', 'Bread Basket'], station: 'Hot', elapsedSeconds: 60 },
  ]

  const orders: OrderData[] = [
    { id: 'O1', table: 'T2', channel: 'dine-in', itemCount: 4, total: 4500, status: 'open', time: '12:30' },
    { id: 'O2', table: 'T3', channel: 'dine-in', itemCount: 2, total: 2200, status: 'open', time: '12:15' },
    { id: 'O3', table: 'T6', channel: 'dine-in', itemCount: 5, total: 7800, status: 'open', time: '11:45' },
    { id: 'O4', table: 'T8', channel: 'dine-in', itemCount: 3, total: 3100, status: 'paid', time: '12:50' },
    { id: 'O5', table: 'T11', channel: 'dine-in', itemCount: 4, total: 5600, status: 'open', time: '12:00' },
    { id: 'O6', table: 'T14', channel: 'dine-in', itemCount: 2, total: 1850, status: 'open', time: '13:05' },
    { id: 'O7', table: 'Delivery', channel: 'delivery', itemCount: 6, total: 3200, status: 'paid', time: '12:45' },
    { id: 'O8', table: 'Takeout', channel: 'takeout', itemCount: 3, total: 2100, status: 'open', time: '13:10' },
    { id: 'O9', table: 'T4', channel: 'dine-in', itemCount: 2, total: 1650, status: 'voided', time: '13:00' },
    { id: 'O10', table: 'Delivery', channel: 'delivery', itemCount: 4, total: 2850, status: 'paid', time: '13:20' },
  ]

  const revenueData: ChartDataPoint[] = [
    { hour: '7am', revenue: 0 },
    { hour: '8am', revenue: 2100 },
    { hour: '9am', revenue: 4200 },
    { hour: '10am', revenue: 6800 },
    { hour: '11am', revenue: 12500 },
    { hour: '12pm', revenue: 28400 },
    { hour: '1pm', revenue: 26700 },
    { hour: '2pm', revenue: 14200 },
    { hour: '3pm', revenue: 3200 },
    { hour: '4pm', revenue: 1500 },
    { hour: '5pm', revenue: 0 },
  ]

  const occupiedTables = useMemo(() => tables.filter(t => t.status === 'occupied').length, [])
  const totalPax = useMemo(() => tables.reduce((sum, t) => sum + (t.pax || 0), 0), [])
  const averageTicket = useMemo(() => {
    const openOrders = orders.filter(o => o.status === 'open' || o.status === 'paid')
    return openOrders.length > 0 ? Math.round(openOrders.reduce((sum, o) => sum + o.total, 0) / occupiedTables) : 0
  }, [occupiedTables])
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [])
  const activeKOTs = useMemo(() => kots.filter(k => k.status !== 'ready').length, [])

  const kpiCards: KPIData[] = [
    {
      label: 'Revenue Today',
      value: `KES ${totalRevenue.toLocaleString()}`,
      trend: 12,
      comparison: '+12% vs yesterday',
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      label: 'Active Tables',
      value: `${occupiedTables}/15`,
      trend: 5,
      comparison: '+5% from noon',
      icon: <Users className="w-5 h-5" />
    },
    {
      label: 'Avg Ticket',
      value: `KES ${averageTicket}`,
      trend: 2,
      comparison: '+2% vs yesterday',
      icon: <ShoppingCart className="w-5 h-5" />
    },
    {
      label: 'Kitchen Queue',
      value: activeKOTs,
      trend: -3,
      comparison: '-3 from peak',
      icon: <UtensilsCrossed className="w-5 h-5" />
    },
    {
      label: 'Covers Served',
      value: totalPax,
      trend: 8,
      comparison: '+8 vs yesterday',
      icon: <Users className="w-5 h-5" />
    },
    {
      label: 'Orders Today',
      value: orders.length,
      trend: 15,
      comparison: '+15% transaction count',
      icon: <ShoppingCart className="w-5 h-5" />
    },
  ]

  const getTableColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/10 border-green-500/50 hover:border-green-500'
      case 'occupied':
        return 'bg-amber-500/10 border-amber-500/50 hover:border-amber-500'
      case 'reserved':
        return 'bg-blue-500/10 border-blue-500/50 hover:border-blue-500'
      case 'cleaning':
        return 'bg-red-500/10 border-red-500/50 hover:border-red-500'
      default:
        return 'bg-gray-500/10 border-gray-500/50'
    }
  }

  const getKOTColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'border-l-4 border-l-yellow-500 bg-yellow-500/5'
      case 'in_prep':
        return 'border-l-4 border-l-blue-500 bg-blue-500/5'
      case 'ready':
        return 'border-l-4 border-l-green-500 bg-green-500/5'
      default:
        return 'border-l-4 border-l-gray-500 bg-gray-500/5'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1">Restaurant Operations</h1>
          <p className="text-slate-400">Live dashboard • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-blue-400 mb-2">{currentTime}</div>
          <Badge variant="outline" className="bg-green-500/20 border-green-500/50 text-green-300">Lunch Service</Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpiCards.map((kpi, idx) => (
          <Card key={idx} className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl hover:border-slate-600/50 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-300">{kpi.label}</CardTitle>
                <div className="text-blue-400/60">{kpi.icon}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">{kpi.value}</div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {kpi.trend >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={kpi.trend >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
                </span>
                <span className="text-slate-500">{kpi.comparison}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Floor Overview */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Floor Overview</CardTitle>
              <CardDescription className="text-slate-400">5×3 table grid • Click for details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {tables.map(table => (
                  <Popover key={table.id} open={tablePopover === table.id} onOpenChange={(open) => setTablePopover(open ? table.id : null)}>
                    <PopoverTrigger asChild>
                      <button
                        className={`aspect-square rounded-lg border-2 font-bold text-sm transition-all duration-200 hover:scale-105 ${getTableColor(table.status)}`}
                      >
                        {table.name}
                        {table.pax && <div className="text-xs mt-1">{table.pax}</div>}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-slate-800 border-slate-700 p-4">
                      <div className="space-y-2">
                        <div className="font-semibold text-white">{table.name}</div>
                        <div className="text-xs text-slate-400">
                          <p>Status: <Badge variant="outline" className="ml-2 bg-blue-500/20 border-blue-500/50 text-blue-300">{table.status}</Badge></p>
                          {table.pax && <p className="mt-2">Pax: {table.pax}</p>}
                          {table.waiter && <p>Waiter: {table.waiter}</p>}
                          {table.timeSeated && <p>Seated: {table.timeSeated}</p>}
                          {table.orderTotal && <p className="font-semibold text-slate-300 mt-2">Total: KES {table.orderTotal}</p>}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kitchen Queue */}
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl h-fit">
          <CardHeader>
            <CardTitle className="text-white">Kitchen Queue</CardTitle>
            <CardDescription className="text-slate-400">{activeKOTs} active KOTs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {kots.map(kot => (
                <div key={kot.id} className={`p-3 rounded-lg ${getKOTColor(kot.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">{kot.orderNumber}</span>
                    <span className="text-xs text-slate-400">{formatTime(kotElapsed[kot.id] || kot.elapsedSeconds)}</span>
                  </div>
                  <div className="text-xs text-slate-300 mb-2">{kot.items[0]}</div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 w-1/2"></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{kot.station}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Today's Orders</CardTitle>
            <CardDescription className="text-slate-400">Last 10 orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orders.slice(0, 10).map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/20 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm">{order.table}</div>
                    <div className="text-xs text-slate-400">{order.itemCount} items • {order.time}</div>
                  </div>
                  <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50 text-blue-300 text-xs">
                    {order.channel}
                  </Badge>
                  <div className="text-right ml-4">
                    <div className="font-bold text-white">KES {order.total}</div>
                    <Badge
                      variant="outline"
                      className={`text-xs mt-1 ${
                        order.status === 'open' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
                        order.status === 'paid' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
                        'bg-red-500/20 border-red-500/50 text-red-300'
                      }`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Revenue by Hour</CardTitle>
            <CardDescription className="text-slate-400">Today's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 105, 0.2)" />
                <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => `KES ${value}`}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex gap-3">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Open POS</Button>
        <Button className="bg-slate-700 hover:bg-slate-600 text-white">View Floor</Button>
        <Button className="bg-slate-700 hover:bg-slate-600 text-white">View Kitchen</Button>
        <Button className="bg-slate-700 hover:bg-slate-600 text-white">Manage Reservations</Button>
      </div>
    </div>
  )
}
