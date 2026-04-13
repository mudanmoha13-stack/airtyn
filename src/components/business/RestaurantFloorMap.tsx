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
        return "bg-lime-300/20 border-lime-300 text-lime-300"
      case "occupied":
        return "bg-rose-500/20 border-rose-500 text-rose-400"
      case "reserved":
        return "bg-violet-500/20 border-violet-500 text-violet-400"
      case "cleaning":
        return "bg-amber-500/20 border-amber-500 text-amber-400"
      default:
        return "bg-neutral-800 text-neutral-400"
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
    <div className="bg-black min-h-screen p-4">
      <div className="mx-auto max-w-7xl rounded-[32px] bg-neutral-900 p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* LEFT: Floor Plan */}
          <div>
            {/* Header Card */}
            <div className="mb-4 rounded-[28px] bg-neutral-800 p-5">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-white">Floor Plan</h2>
                <p className="text-sm text-neutral-400">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
              </div>

              {/* Status Legend */}
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-lime-300" />
                  <span className="text-xs text-neutral-400">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-xs text-neutral-400">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-violet-500" />
                  <span className="text-xs text-neutral-400">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-xs text-neutral-400">Cleaning</span>
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
                        : "bg-neutral-800 text-neutral-400 hover:brightness-110"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-xs text-neutral-400">Available</p>
                  <p className="font-semibold text-white">{statusCounts.available}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Occupied</p>
                  <p className="font-semibold text-white">{statusCounts.occupied}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Reserved</p>
                  <p className="font-semibold text-white">{statusCounts.reserved}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Cleaning</p>
                  <p className="font-semibold text-white">{statusCounts.cleaning}</p>
                </div>
              </div>
            </div>

            {/* Zone A - Indoor */}
            <div className="mb-4 rounded-[28px] bg-neutral-800 p-5">
              <h3 className="mb-4 font-semibold text-white">Zone A · Indoor (8 covers)</h3>
              <div className="grid grid-cols-4 gap-3">
                {indoorTables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table.id)}
                    className={`border-2 rounded-[16px] px-2 py-3 text-xs font-medium transition hover:brightness-110 ${getStatusColor(table.status)}`}
                  >
                    <div className="font-semibold">{table.tableNum}</div>
                    <div className="mt-1 text-xs opacity-70">{table.status}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Zone B - Terrace */}
            <div className="mb-4 rounded-[28px] bg-neutral-800 p-5">
              <h3 className="mb-4 font-semibold text-white">Zone B · Terrace (12 covers)</h3>
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-xs font-medium text-neutral-400">Large Tables</p>
                  <div className="grid grid-cols-3 gap-3">
                    {terraceTablesByGroup.rects.map(table => (
                      <button
                        key={table.id}
                        onClick={() => handleSelectTable(table.id)}
                        className={`border-2 rounded-[16px] px-2 py-4 text-xs font-medium transition hover:brightness-110 ${getStatusColor(table.status)}`}
                      >
                        <div className="font-semibold">{table.tableNum}</div>
                        <div className="mt-1 text-xs opacity-70">{table.status}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-neutral-400">Round Tables</p>
                  <div className="grid grid-cols-3 gap-3">
                    {terraceTablesByGroup.rounds.map(table => (
                      <button
                        key={table.id}
                        onClick={() => handleSelectTable(table.id)}
                        className={`border-2 rounded-full h-20 w-20 text-xs font-medium transition hover:brightness-110 ${getStatusColor(table.status)}`}
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
            <div className="rounded-[28px] bg-neutral-800 p-5">
              <h3 className="mb-4 font-semibold text-white">Zone C · Bar (4 seats)</h3>
              <div className="flex gap-3">
                {barStools.map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table.id)}
                    className={`border-2 rounded-full h-16 w-16 text-xs font-medium transition hover:brightness-110 ${getStatusColor(table.status)}`}
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
          <div className="rounded-[28px] bg-neutral-800 p-5">
            {!currentTable ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ChefHat size={40} className="mb-3 text-neutral-600" />
                <p className="text-sm text-neutral-400">Select a table to view details</p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="mb-4 pb-4 border-b border-neutral-700">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-white">
                      {currentTable.id} {currentTable.zone !== "bar" && `· ${currentTable.zone.charAt(0).toUpperCase() + currentTable.zone.slice(1)}`}
                    </h3>
                    <span className={`border-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(currentTable.status)}`}>
                      {currentTable.status.charAt(0).toUpperCase() + currentTable.status.slice(1)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-neutral-400">
                    <p>Capacity: {currentTable.capacity} {currentTable.capacity === 1 ? "person" : "people"}</p>
                    <p>Shape: {currentTable.shape === "round" ? "Round" : currentTable.shape === "rect" ? "Rectangular" : "Bar Stool"}</p>
                  </div>
                </div>

                {/* Occupied Content */}
                {currentTable.status === "occupied" && currentTable.currentGuests && (
                  <>
                    <div className="mb-4 rounded-[24px] bg-neutral-700 p-4">
                      <p className="mb-3 text-xs font-medium text-neutral-400">CURRENT ORDER</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Waiter</span>
                          <span className="font-medium text-white">{currentTable.waiter}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Seated</span>
                          <span className="font-medium text-white">{currentTable.seatedTime ? formatTime(Date.now() - currentTable.seatedTime) : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Guests</span>
                          <span className="font-medium text-white">{currentTable.currentGuests}</span>
                        </div>
                        <div className="border-t border-neutral-700 pt-2">
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Running Total</span>
                            <span className="font-light text-lg text-white">KES {currentTable.orderTotal?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button className="w-full rounded-full bg-lime-300 py-3 text-sm font-medium text-black hover:brightness-110">
                        View Full Order
                      </button>
                      <button className="w-full rounded-full bg-neutral-700 py-3 text-sm font-medium text-white hover:brightness-110">
                        Move Table
                      </button>
                    </div>
                  </>
                )}

                {/* Available Content */}
                {currentTable.status === "available" && (
                  <>
                    <p className="mb-4 text-sm text-neutral-400">Seat new guests at this table</p>
                    <div className="mb-4 rounded-[24px] bg-neutral-700 p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-2">Party Size</label>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setPaxCount(Math.max(1, paxCount - 1))}
                            className="rounded-full bg-lime-300 px-3 py-2 text-black hover:brightness-110"
                          >
                            −
                          </button>
                          <span className="text-lg font-semibold text-white">{paxCount}</span>
                          <button
                            onClick={() => setPaxCount(Math.min(currentTable.capacity, paxCount + 1))}
                            className="rounded-full bg-lime-300 px-3 py-2 text-black hover:brightness-110"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <button className="w-full rounded-full bg-lime-300 py-3 text-sm font-medium text-black hover:brightness-110">
                      Open POS
                    </button>
                  </>
                )}

                {/* Reserved Content */}
                {currentTable.status === "reserved" && (
                  <>
                    <div className="mb-4 rounded-[24px] bg-neutral-700 p-4 space-y-2">
                      <div className="text-sm">
                        <p className="text-xs text-neutral-400 mb-1">GUEST NAME</p>
                        <p className="font-semibold text-white">Sarah Kowalski</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-xs text-neutral-400 mb-1">TIME</p>
                        <p className="font-semibold text-white">7:30 PM</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-xs text-neutral-400 mb-1">PARTY SIZE</p>
                        <p className="font-semibold text-white">4 Guests</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-xs text-neutral-400 mb-1">PHONE</p>
                        <p className="font-semibold text-white">+254 712 345 678</p>
                      </div>
                    </div>

                    <button className="w-full rounded-full bg-lime-300 py-3 text-sm font-medium text-black hover:brightness-110">
                      Confirm Arrival
                    </button>
                  </>
                )}

                {/* Cleaning Content */}
                {currentTable.status === "cleaning" && (
                  <button className="w-full rounded-full bg-lime-300 py-3 text-sm font-medium text-black hover:brightness-110">
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
