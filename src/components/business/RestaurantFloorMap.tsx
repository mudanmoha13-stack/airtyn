"use client"

import { useState } from "react"
import { Clock, Users, ChefHat, RotateCcw } from "lucide-react"

interface Table {
  id: string
  tableNum: string
  zone: "indoor" | "terrace" | "bar"
  shape: "round" | "rect" | "stool"
  capacity: number
  status: "available" | "occupied" | "reserved" | "cleaning"
  currentGuests?: number
  waiter?: string
  seatedTime?: number
  orderTotal?: number
}

interface ReservationInfo {
  guestName: string
  time: string
  pax: number
  phone: string
  notes?: string
}

export default function RestaurantFloorMap() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [paxCount, setPaxCount] = useState(2)

  const tables: Table[] = [
    { id: "T01", tableNum: "01", zone: "indoor", shape: "round", capacity: 4, status: "occupied", currentGuests: 4, waiter: "Maria", seatedTime: Date.now() - 1200000, orderTotal: 8500 },
    { id: "T02", tableNum: "02", zone: "indoor", shape: "round", capacity: 4, status: "reserved" },
    { id: "T03", tableNum: "03", zone: "indoor", shape: "rect", capacity: 6, status: "occupied", currentGuests: 3, waiter: "James", seatedTime: Date.now() - 600000, orderTotal: 6200 },
    { id: "T04", tableNum: "04", zone: "indoor", shape: "rect", capacity: 6, status: "cleaning" },
    { id: "T05", tableNum: "05", zone: "indoor", shape: "round", capacity: 4, status: "available" },
    { id: "T06", tableNum: "06", zone: "indoor", shape: "round", capacity: 4, status: "occupied", currentGuests: 2, waiter: "Alex", seatedTime: Date.now() - 1800000, orderTotal: 4250 },
    { id: "T07", tableNum: "07", zone: "terrace", shape: "rect", capacity: 6, status: "occupied", currentGuests: 6, waiter: "Sofia", seatedTime: Date.now() - 900000, orderTotal: 12100 },
    { id: "T08", tableNum: "08", zone: "terrace", shape: "rect", capacity: 6, status: "available" },
    { id: "T09", tableNum: "09", zone: "terrace", shape: "round", capacity: 4, status: "occupied", currentGuests: 4, waiter: "Maria", seatedTime: Date.now() - 1500000, orderTotal: 7800 },
    { id: "T10", tableNum: "10", zone: "terrace", shape: "round", capacity: 4, status: "available" },
    { id: "T11", tableNum: "11", zone: "terrace", shape: "rect", capacity: 6, status: "reserved" },
    { id: "B01", tableNum: "B01", zone: "bar", shape: "stool", capacity: 1, status: "occupied", currentGuests: 1, waiter: "Mike" },
    { id: "B02", tableNum: "B02", zone: "bar", shape: "stool", capacity: 1, status: "occupied", currentGuests: 1, waiter: "Mike" },
    { id: "B03", tableNum: "B03", zone: "bar", shape: "stool", capacity: 1, status: "available" },
    { id: "B04", tableNum: "B04", zone: "bar", shape: "stool", capacity: 1, status: "available" }
  ]

  const currentTable = selectedTable ? tables.find(t => t.id === selectedTable) : null

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "available":
        return "bg-lime-300 text-black"
      case "occupied":
        return "bg-slate-900 text-white"
      case "reserved":
        return "bg-violet-200 text-slate-900"
      case "cleaning":
        return "bg-amber-200 text-slate-900"
      default:
        return "bg-neutral-100"
    }
  }

  const zoneStats = {
    indoor: { available: 1, occupied: 3, reserved: 1, cleaning: 1 },
    terrace: { available: 2, occupied: 2, reserved: 1, cleaning: 0 },
    bar: { available: 2, occupied: 2, reserved: 0, cleaning: 0 }
  }

  const indoorTables = tables.filter(t => t.zone === "indoor")
  const terraceTablesByGroup = {
    rects: tables.filter(t => t.zone === "terrace" && t.shape === "rect"),
    rounds: tables.filter(t => t.zone === "terrace" && t.shape === "round")
  }
  const barStools = tables.filter(t => t.zone === "bar")

  const handleSelectTable = (tableId: string) => {
    setSelectedTable(tableId)
    setPaxCount(2)
  }

  const filteredTables = tables.filter(table => {
    if (filterStatus === "all") return true
    return table.status === filterStatus
  })

  const statusCounts = {
    available: filteredTables.filter(t => t.status === "available").length,
    occupied: filteredTables.filter(t => t.status === "occupied").length,
    reserved: filteredTables.filter(t => t.status === "reserved").length,
    cleaning: filteredTables.filter(t => t.status === "cleaning").length
  }

  const formatTime = (ms: number): string => {
    const mins = Math.floor(ms / 60000)
    const hours = Math.floor(mins / 60)
    if (hours > 0) return `${hours}h ${mins % 60}m`
    return `${mins}m`
  }

  return (
    <div className="min-h-screen bg-neutral-200 p-4">
      <div className="mx-auto max-w-7xl rounded-[32px] bg-neutral-100 p-4 shadow-2xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* LEFT: Floor Plan */}
          <div>
            {/* Header Card */}
            <div className="mb-4 rounded-[28px] bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-slate-900">Floor Plan</h2>
                <p className="text-sm text-slate-500">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
              </div>

              {/* Status Legend */}
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-lime-300" />
                  <span className="text-xs text-slate-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-900" />
                  <span className="text-xs text-slate-600">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-violet-200" />
                  <span className="text-xs text-slate-600">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-200" />
                  <span className="text-xs text-slate-600">Cleaning</span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                {["all", "available", "occupied", "reserved"].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      filterStatus === status
                        ? "bg-lime-300 text-black"
                        : "bg-neutral-100 text-slate-600 hover:bg-neutral-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Available</p>
                  <p className="font-semibold text-slate-900">{statusCounts.available}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Occupied</p>
                  <p className="font-semibold text-slate-900">{statusCounts.occupied}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Reserved</p>
                  <p className="font-semibold text-slate-900">{statusCounts.reserved}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cleaning</p>
                  <p className="font-semibold text-slate-900">{statusCounts.cleaning}</p>
                </div>
              </div>
            </div>

            {/* Zone A - Indoor */}
            <div className="mb-4 rounded-[28px] bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-900">Zone A · Indoor (8 covers)</h3>
              <div className="grid grid-cols-4 gap-3">
                {indoorTables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table.id)}
                    className={`rounded-[16px] px-2 py-3 text-xs font-medium transition hover:shadow-md ${getStatusColor(table.status)}`}
                  >
                    <div className="font-semibold">{table.tableNum}</div>
                    <div className="mt-1 text-xs opacity-70">{table.status}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Zone B - Terrace */}
            <div className="mb-4 rounded-[28px] bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-900">Zone B · Terrace (12 covers)</h3>
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">Large Tables</p>
                  <div className="grid grid-cols-3 gap-3">
                    {terraceTablesByGroup.rects.map(table => (
                      <button
                        key={table.id}
                        onClick={() => handleSelectTable(table.id)}
                        className={`rounded-[16px] px-2 py-4 text-xs font-medium transition hover:shadow-md ${getStatusColor(table.status)}`}
                      >
                        <div className="font-semibold">{table.tableNum}</div>
                        <div className="mt-1 text-xs opacity-70">{table.status}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">Round Tables</p>
                  <div className="grid grid-cols-3 gap-3">
                    {terraceTablesByGroup.rounds.map(table => (
                      <button
                        key={table.id}
                        onClick={() => handleSelectTable(table.id)}
                        className={`rounded-full h-20 w-20 text-xs font-medium transition hover:shadow-md ${getStatusColor(table.status)}`}
                      >
                        <div className="flex h-full flex-col items-center justify-center">
                          <div className="font-semibold">{table.tableNum}</div>
                          <div className="mt-0.5 text-xs opacity-70">{table.status}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Zone C - Bar */}
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-900">Zone C · Bar (4 seats)</h3>
              <div className="flex gap-3">
                {barStools.map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table.id)}
                    className={`rounded-full h-16 w-16 text-xs font-medium transition hover:shadow-md ${getStatusColor(table.status)}`}
                  >
                    <div className="flex h-full flex-col items-center justify-center">
                      <div className="font-semibold text-xs">{table.tableNum}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Table Detail Panel */}
          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            {!currentTable ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ChefHat size={40} className="mb-3 text-neutral-300" />
                <p className="text-sm text-slate-500">Select a table to view details</p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="mb-4 pb-4 border-b border-neutral-200">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-slate-900">
                      {currentTable.id} {currentTable.zone !== "bar" && `· ${currentTable.zone.charAt(0).toUpperCase() + currentTable.zone.slice(1)}`}
                    </h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(currentTable.status)}`}>
                      {currentTable.status.charAt(0).toUpperCase() + currentTable.status.slice(1)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>Capacity: {currentTable.capacity} {currentTable.capacity === 1 ? "person" : "people"}</p>
                    <p>Shape: {currentTable.shape === "round" ? "Round" : currentTable.shape === "rect" ? "Rectangular" : "Bar Stool"}</p>
                  </div>
                </div>

                {/* Occupied Content */}
                {currentTable.status === "occupied" && currentTable.currentGuests && (
                  <>
                    <div className="mb-4 rounded-[24px] bg-neutral-50 p-4">
                      <p className="mb-3 text-xs font-medium text-slate-500">CURRENT ORDER</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Waiter</span>
                          <span className="font-medium text-slate-900">{currentTable.waiter}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Seated</span>
                          <span className="font-medium text-slate-900">{currentTable.seatedTime ? formatTime(Date.now() - currentTable.seatedTime) : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Guests</span>
                          <span className="font-medium text-slate-900">{currentTable.currentGuests}</span>
                        </div>
                        <div className="border-t border-neutral-200 pt-2">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Running Total</span>
                            <span className="font-light text-lg text-slate-900">KES {currentTable.orderTotal?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button className="w-full rounded-full bg-black py-3 text-sm font-medium text-white hover:bg-slate-800">
                        View Full Order
                      </button>
                      <button className="w-full rounded-full bg-neutral-100 py-3 text-sm font-medium text-slate-600 hover:bg-neutral-200">
                        Move Table
                      </button>
                    </div>
                  </>
                )}

                {/* Available Content */}
                {currentTable.status === "available" && (
                  <>
                    <p className="mb-4 text-sm text-slate-600">Seat new guests at this table</p>
                    <div className="mb-4 rounded-[24px] bg-neutral-50 p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Party Size</label>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setPaxCount(Math.max(1, paxCount - 1))}
                            className="rounded-full bg-lime-300 px-3 py-2 text-black hover:bg-lime-400"
                          >
                            −
                          </button>
                          <span className="text-lg font-semibold text-slate-900">{paxCount}</span>
                          <button
                            onClick={() => setPaxCount(Math.min(currentTable.capacity, paxCount + 1))}
                            className="rounded-full bg-lime-300 px-3 py-2 text-black hover:bg-lime-400"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <button className="w-full rounded-full bg-black py-3 text-sm font-medium text-white hover:bg-slate-800">
                      Open POS
                    </button>
                  </>
                )}

                {/* Reserved Content */}
                {currentTable.status === "reserved" && (
                  <>
                    <div className="mb-4 rounded-[24px] bg-neutral-50 p-4 space-y-2">
                      <div className="text-sm">
                        <p className="text-xs text-slate-500 mb-1">GUEST NAME</p>
                        <p className="font-semibold text-slate-900">Sarah Kowalski</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-xs text-slate-500 mb-1">TIME</p>
                        <p className="font-semibold text-slate-900">7:30 PM</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-xs text-slate-500 mb-1">PARTY SIZE</p>
                        <p className="font-semibold text-slate-900">4 Guests</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-xs text-slate-500 mb-1">PHONE</p>
                        <p className="font-semibold text-slate-900">+254 712 345 678</p>
                      </div>
                    </div>

                    <button className="w-full rounded-full bg-lime-300 py-3 text-sm font-medium text-black hover:bg-lime-400">
                      Confirm Arrival
                    </button>
                  </>
                )}

                {/* Cleaning Content */}
                {currentTable.status === "cleaning" && (
                  <button className="w-full rounded-full bg-lime-300 py-3 text-sm font-medium text-black hover:bg-lime-400">
                    Mark Available
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
