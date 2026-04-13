"use client"

import { useState, useEffect } from "react"
import { Clock, Settings, ClipboardList, Flame, Map, Calendar, ChefHat } from "lucide-react"

interface KPIStat {
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
}

interface ActivityEvent {
  id: string
  type: "kitchen" | "service" | "delivery" | "priority" | "cleaning"
  time: string
  title: string
  body: string
}

interface OrderCard {
  id: string
  tableName: string
  orderNum: string
  items: string[]
  status: string
  priority: boolean
  active: boolean
}

interface RevenueData {
  hour: number
  amount: number
}

export default function RestaurantHub() {
  const [currentTime, setCurrentTime] = useState<string>("")
  const [selectedNav, setSelectedNav] = useState<string>("Hub")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit" }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const kpiStats: KPIStat[] = [
    { label: "Revenue Today", value: "KES 128,450", trend: "↑8%", trendUp: true },
    { label: "Active Tables", value: "11/15" },
    { label: "Kitchen Queue", value: "22" },
    { label: "Covers Served", value: "128" }
  ]

  const activities: ActivityEvent[] = [
    {
      id: "1",
      type: "kitchen",
      time: "2 min ago",
      title: "Order #2847 Ready",
      body: "Table 08 · Grilled salmon + fries"
    },
    {
      id: "2",
      type: "service",
      time: "5 min ago",
      title: "Table 12 Cleared",
      body: "Guest departure · Revenue: KES 4,250"
    },
    {
      id: "3",
      type: "delivery",
      time: "8 min ago",
      title: "Delivery Order #2846",
      body: "Order prepared · Ready for pickup"
    },
    {
      id: "4",
      type: "priority",
      time: "12 min ago",
      title: "VIP Guest Arrived",
      body: "Table 02 · Reservation confirmed"
    },
    {
      id: "5",
      type: "cleaning",
      time: "15 min ago",
      title: "Table 06 Cleaned",
      body: "Status: Ready for new guests"
    }
  ]

  const orders: OrderCard[] = [
    {
      id: "1",
      tableName: "Table 08",
      orderNum: "#2847",
      items: ["Grilled Salmon", "Caesar Salad", "Fries"],
      status: "In Prep",
      priority: false,
      active: true
    },
    {
      id: "2",
      tableName: "Table 12",
      orderNum: "#2843",
      items: ["Ribeye Steak", "Loaded Baked Potato"],
      status: "In Transit",
      priority: true,
      active: false
    },
    {
      id: "3",
      tableName: "Table 05",
      orderNum: "#2841",
      items: ["Chicken Parmesan", "Garlic Bread", "House Wine"],
      status: "Served",
      priority: false,
      active: false
    },
    {
      id: "4",
      tableName: "Bar",
      orderNum: "#2840",
      items: ["Espresso Martini x2", "Old Fashioned"],
      status: "Ready",
      priority: false,
      active: false
    }
  ]

  const revenueByHour: RevenueData[] = [
    { hour: 7, amount: 2100 },
    { hour: 8, amount: 3200 },
    { hour: 9, amount: 4800 },
    { hour: 10, amount: 6200 },
    { hour: 11, amount: 7500 },
    { hour: 12, amount: 9800 },
    { hour: 13, amount: 18500 },
    { hour: 14, amount: 15200 },
    { hour: 15, amount: 8900 },
    { hour: 16, amount: 4200 },
    { hour: 17, amount: 6100 },
    { hour: 18, amount: 14300 },
    { hour: 19, amount: 22100 },
    { hour: 20, amount: 24500 },
    { hour: 21, amount: 19800 },
    { hour: 22, amount: 12400 },
    { hour: 23, amount: 3150 }
  ]

  const tables = [
    { id: "T01", status: "occupied" },
    { id: "T02", status: "available" },
    { id: "T03", status: "occupied" },
    { id: "T04", status: "cleaning" },
    { id: "T05", status: "occupied" },
    { id: "T06", status: "available" },
    { id: "T07", status: "reserved" },
    { id: "T08", status: "occupied" },
    { id: "T09", status: "available" },
    { id: "T10", status: "occupied" },
    { id: "T11", status: "priority" },
    { id: "T12", status: "occupied" },
    { id: "T13", status: "available" },
    { id: "T14", status: "cleaning" },
    { id: "T15", status: "occupied" }
  ]

  const getTableColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-neutral-800 text-white"
      case "available":
        return "bg-lime-300 text-black"
      case "reserved":
        return "bg-violet-500/20 text-violet-400"
      case "cleaning":
        return "bg-amber-500/20 text-amber-400"
      case "priority":
        return "bg-rose-500/20 text-rose-400"
      default:
        return "bg-neutral-800 text-white"
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "kitchen":
        return "bg-cyan-500/20"
      case "service":
        return "bg-violet-500/20"
      case "delivery":
        return "bg-lime-300"
      case "priority":
        return "bg-rose-500/20"
      case "cleaning":
        return "bg-amber-500/20"
      default:
        return "bg-neutral-700"
    }
  }

  const maxRevenue = Math.max(...revenueByHour.map(d => d.amount))

  return (
    <div className="min-h-screen bg-black p-4 md:p-6">
      <div className="mx-auto max-w-7xl rounded-[32px] bg-neutral-900 p-4">
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_260px]">
          {/* LEFT COLUMN */}
          <div className="rounded-[28px] bg-neutral-800 p-5 text-white">
            {/* Logo */}
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-lime-300 p-2 text-black">
                <ChefHat size={24} />
              </div>
              <div>
                <div className="font-semibold">Restaurant Hub</div>
                <div className="text-xs text-neutral-400">Live Operations</div>
              </div>
            </div>

            {/* KPI Stats Grid */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              {kpiStats.map((stat, idx) => (
                <div key={idx} className="rounded-[24px] bg-neutral-900 p-4">
                  <div className="text-xs text-neutral-400">{stat.label}</div>
                  <div className="mt-2 font-light text-lg text-white tracking-tight">{stat.value}</div>
                  {stat.trend && (
                    <div className={`text-xs ${stat.trendUp ? "text-lime-300" : "text-rose-400"}`}>
                      {stat.trend}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Nav Buttons */}
            <div className="mb-6 space-y-2">
              {["Hub", "POS", "Floor", "Kitchen", "Reservations"].map(nav => (
                <button
                  key={nav}
                  onClick={() => setSelectedNav(nav)}
                  className={`w-full rounded-full py-2 text-sm font-medium transition ${
                    selectedNav === nav
                      ? "bg-lime-300 text-black"
                      : "bg-neutral-700 text-white hover:bg-neutral-700"
                  }`}
                >
                  {nav}
                </button>
              ))}
            </div>

            {/* Clock Display */}
            <div className="mb-6 rounded-[24px] bg-neutral-900 p-4 text-center">
              <div className="font-light text-4xl text-white">{currentTime}</div>
              <div className="mt-2 text-xs text-neutral-400">Live Time</div>
            </div>

            {/* Shift Badge */}
            <div className="rounded-[24px] bg-neutral-900 px-4 py-3 text-center text-sm text-white">
              <div>Shift Open</div>
              <div className="font-light text-lg">6h 23m</div>
            </div>
          </div>

          {/* CENTER COLUMN */}
          <div>
            {/* Header Card */}
            <div className="mb-4 rounded-[28px] bg-neutral-800 p-5">
              <h1 className="font-light text-4xl text-white">Restaurant Operations</h1>
              <p className="mt-1 text-sm text-neutral-400">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                <button className="flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2 text-black font-semibold hover:bg-lime-300">
                  <ClipboardList size={18} />
                  <span className="text-sm font-medium">Orders</span>
                </button>
                <button className="flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2 text-black font-semibold hover:bg-lime-300">
                  <Flame size={18} />
                  <span className="text-sm font-medium">Kitchen</span>
                </button>
                <button className="flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2 text-black font-semibold hover:bg-lime-300">
                  <Map size={18} />
                  <span className="text-sm font-medium">Floor</span>
                </button>
                <button className="flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2 text-black font-semibold hover:bg-lime-300">
                  <Calendar size={18} />
                  <span className="text-sm font-medium">Reserve</span>
                </button>
                <button className="flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2 text-black font-semibold hover:bg-lime-300">
                  <Settings size={18} />
                  <span className="text-sm font-medium">Settings</span>
                </button>
              </div>

              {/* Table Grid */}
              <div className="mt-4 grid grid-cols-5 gap-2">
                {tables.map(table => (
                  <button
                    key={table.id}
                    className={`rounded-[16px] px-2 py-3 text-xs font-medium transition hover:opacity-80 ${getTableColor(table.status)}`}
                  >
                    {table.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="mb-4 rounded-[28px] bg-neutral-800 p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">Activity Feed</h2>
              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="flex gap-3">
                    <div className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full ${getActivityColor(activity.type)}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">{activity.title}</p>
                        <span className="text-xs text-neutral-400">{activity.time}</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-400">{activity.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="rounded-[28px] bg-neutral-800 p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">Hourly Revenue</h2>
              <div className="flex items-end gap-1" style={{ height: "180px" }}>
                {revenueByHour.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t ${data.hour === 20 ? "bg-lime-300" : "bg-neutral-700"}`}
                      style={{ height: `${(data.amount / maxRevenue) * 160}px` }}
                    />
                    <span className="text-xs text-neutral-400">{data.hour}h</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right text-xs text-neutral-400">KES</div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Active Orders */}
            <div className="mb-4 rounded-[28px] bg-neutral-800 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Active Orders</h2>
                <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-medium text-black">Live</span>
              </div>
              <div className="space-y-2">
                {orders.map((order, idx) => (
                  <div
                    key={order.id}
                    className={`rounded-[24px] p-3 ${
                      order.active ? "bg-lime-300 text-black" : "bg-neutral-900 text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium opacity-70">{order.tableName}</p>
                        <p className="font-semibold">{order.orderNum}</p>
                      </div>
                      {order.priority && (
                        <span className="rounded-full bg-rose-500/20 px-2 py-1 text-xs font-medium text-rose-400">
                          Priority
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs">
                      {order.items.map((item, i) => (
                        <div key={i} className="opacity-70">
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="opacity-70">{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kitchen Stations */}
            <div className="mb-4 rounded-[28px] bg-neutral-800 p-5">
              <h2 className="mb-3 text-lg font-semibold text-white">Kitchen Stations</h2>
              <div className="space-y-2">
                {["Grill", "Fryer", "Drinks", "Dessert"].map((station, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-[20px] bg-neutral-900 p-3">
                    <span className="text-sm font-medium text-white">{station}</span>
                    <span className="rounded-full bg-neutral-700 px-2.5 py-1 text-xs font-medium text-white">
                      {[5, 3, 2, 1][idx]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Ticket */}
            <div className="rounded-[28px] bg-neutral-800 p-5">
              <h2 className="mb-3 text-lg font-semibold text-white">Current Ticket</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Grilled Salmon</span>
                  <span className="font-medium text-white">KES 1,850</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Caesar Salad</span>
                  <span className="font-medium text-white">KES 650</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">French Fries</span>
                  <span className="font-medium text-white">KES 450</span>
                </div>
                <div className="my-2 border-t border-neutral-800" />
                <div className="flex items-center justify-between">
                  <span className="text-white">Total</span>
                  <span className="font-light text-2xl text-white tracking-tight">KES 2,950</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
