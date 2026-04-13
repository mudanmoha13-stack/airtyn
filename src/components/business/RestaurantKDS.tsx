"use client"

import { useState, useMemo, useEffect } from "react"
import { RotateCw, Flame } from "lucide-react"

interface KOTItem {
  qty: number
  name: string
  notes?: string
}

interface KOT {
  id: string
  orderNum: string
  tableId: string
  tableNum: string
  items: KOTItem[]
  station: "grill" | "fryer" | "cold" | "drinks" | "pass"
  status: "queued" | "in_prep" | "ready" | "served"
  startedAt: number
  createdAt: number
}

const stationConfig: Record<string, { slaMinutes: number; emoji: string }> = {
  grill: { slaMinutes: 14, emoji: "🔥" },
  fryer: { slaMinutes: 10, emoji: "🫕" },
  cold: { slaMinutes: 8, emoji: "❄️" },
  drinks: { slaMinutes: 5, emoji: "🍹" },
  pass: { slaMinutes: 3, emoji: "✋" }
}

export default function RestaurantKDS() {
  const [kots, setKots] = useState<KOT[]>([])
  const [selectedStation, setSelectedStation] = useState<string>("all")
  const [currentTime, setCurrentTime] = useState<number>(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Initialize mock KOTs
  useEffect(() => {
    const baseTime = currentTime - 60000 // 1 minute ago

    const mockKots: KOT[] = [
      {
        id: "1",
        orderNum: "2847",
        tableId: "T08",
        tableNum: "08",
        items: [
          { qty: 1, name: "Grilled Salmon", notes: "Medium, no butter" },
          { qty: 1, name: "Asparagus" }
        ],
        station: "grill",
        status: "in_prep",
        startedAt: baseTime + 120000,
        createdAt: baseTime
      },
      {
        id: "2",
        orderNum: "2846",
        tableId: "T12",
        tableNum: "12",
        items: [{ qty: 2, name: "Ribeye Steak", notes: "Rare" }],
        station: "grill",
        status: "ready",
        startedAt: baseTime + 60000,
        createdAt: baseTime - 300000
      },
      {
        id: "3",
        orderNum: "2845",
        tableId: "T05",
        tableNum: "05",
        items: [
          { qty: 1, name: "Fish Fillet" },
          { qty: 1, name: "Sweet Potato Fries" }
        ],
        station: "fryer",
        status: "queued",
        startedAt: 0,
        createdAt: baseTime
      },
      {
        id: "4",
        orderNum: "2844",
        tableId: "T15",
        tableNum: "15",
        items: [
          { qty: 2, name: "Chicken Wings" },
          { qty: 1, name: "Tempura Vegetables" }
        ],
        station: "fryer",
        status: "in_prep",
        startedAt: baseTime + 180000,
        createdAt: baseTime - 180000
      },
      {
        id: "5",
        orderNum: "2843",
        tableId: "T03",
        tableNum: "03",
        items: [
          { qty: 1, name: "Caesar Salad" },
          { qty: 1, name: "House Dressing" }
        ],
        station: "cold",
        status: "queued",
        startedAt: 0,
        createdAt: baseTime
      },
      {
        id: "6",
        orderNum: "2842",
        tableId: "T10",
        tableNum: "10",
        items: [
          { qty: 3, name: "Watermelon Salad" },
          { qty: 1, name: "Feta Cheese" }
        ],
        station: "cold",
        status: "ready",
        startedAt: baseTime + 240000,
        createdAt: baseTime - 420000
      },
      {
        id: "7",
        orderNum: "2841",
        tableId: "T07",
        tableNum: "07",
        items: [
          { qty: 2, name: "Espresso Martini" },
          { qty: 1, name: "Old Fashioned" }
        ],
        station: "drinks",
        status: "in_prep",
        startedAt: baseTime + 90000,
        createdAt: baseTime - 60000
      },
      {
        id: "8",
        orderNum: "2840",
        tableId: "Bar",
        tableNum: "Bar",
        items: [{ qty: 4, name: "House Wine Glass" }],
        station: "drinks",
        status: "ready",
        startedAt: baseTime,
        createdAt: baseTime - 180000
      },
      {
        id: "9",
        orderNum: "2839",
        tableId: "T02",
        tableNum: "02",
        items: [
          { qty: 2, name: "Chocolate Lava Cake" },
          { qty: 2, name: "Vanilla Ice Cream" }
        ],
        station: "pass",
        status: "queued",
        startedAt: 0,
        createdAt: baseTime - 120000
      },
      {
        id: "10",
        orderNum: "2838",
        tableId: "T06",
        tableNum: "06",
        items: [{ qty: 1, name: "Tiramisu" }],
        station: "pass",
        status: "ready",
        startedAt: baseTime + 30000,
        createdAt: baseTime - 240000
      },
      {
        id: "11",
        orderNum: "2837",
        tableId: "T14",
        tableNum: "14",
        items: [
          { qty: 1, name: "Beef Wellington" },
          { qty: 1, name: "Truffle Mash" }
        ],
        station: "grill",
        status: "queued",
        startedAt: 0,
        createdAt: baseTime - 420000
      },
      {
        id: "12",
        orderNum: "2836",
        tableId: "T11",
        tableNum: "11",
        items: [
          { qty: 1, name: "Lobster Tail" },
          { qty: 1, name: "Drawn Butter" }
        ],
        station: "grill",
        status: "ready",
        startedAt: baseTime + 240000,
        createdAt: baseTime - 600000
      }
    ]

    setKots(mockKots)
  }, [currentTime])

  const handleUpdateStatus = (kotId: string, newStatus: KOT["status"]) => {
    setKots(kots.map(kot => {
      if (kot.id === kotId) {
        return {
          ...kot,
          status: newStatus,
          startedAt: newStatus === "in_prep" && kot.startedAt === 0 ? currentTime : kot.startedAt
        }
      }
      return kot
    }))
  }

  const handleBumpAll = () => {
    setKots(kots.map(kot => {
      if (kot.status === "ready") {
        return { ...kot, status: "served" }
      }
      return kot
    }))
  }

  const filteredKots = selectedStation === "all" ? kots : kots.filter(k => k.station === selectedStation)

  const stationGroups = useMemo(() => {
    const groups: Record<string, KOT[]> = {
      grill: [],
      fryer: [],
      cold: [],
      drinks: [],
      pass: []
    }

    filteredKots.forEach(kot => {
      groups[kot.station].push(kot)
    })

    return groups
  }, [filteredKots])

  const stats = useMemo(() => {
    return {
      queued: filteredKots.filter(k => k.status === "queued").length,
      in_prep: filteredKots.filter(k => k.status === "in_prep").length,
      ready: filteredKots.filter(k => k.status === "ready").length,
      avgWait: Math.round(
        filteredKots.reduce((sum, k) => sum + (currentTime - k.createdAt), 0) / Math.max(filteredKots.length, 1) / 1000 / 60
      )
    }
  }, [filteredKots, currentTime])

  const getElapsedSeconds = (startTime: number): number => {
    if (startTime === 0) return 0
    return Math.round((currentTime - startTime) / 1000)
  }

  const getSLAColor = (elapsed: number, slaMins: number): string => {
    const slaSeconds = slaMins * 60
    if (elapsed <= slaSeconds * 0.6) return "bg-lime-300"
    if (elapsed <= slaSeconds * 0.9) return "bg-amber-400"
    return "bg-rose-400"
  }

  const getKOTBorder = (kot: KOT): string => {
    if (kot.status === "queued") return "border-l-4 border-neutral-600"
    if (kot.status === "in_prep") return "border-l-4 border-amber-400"
    if (kot.status === "ready") return "border-l-4 border-lime-300"
    return "border-l-4 border-neutral-700 opacity-50"
  }

  const stations = ["grill", "fryer", "cold", "drinks", "pass"] as const

  return (
    <div className="bg-black min-h-screen p-4">
      <div className="mx-auto max-w-7xl rounded-[32px] bg-black p-4">
        {/* Header */}
        <div className="mb-4 rounded-[28px] bg-neutral-900 p-4 text-white">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-lime-300 p-2 text-black">
                <Flame size={24} />
              </div>
              <div>
                <div className="font-semibold">Kitchen Display</div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-lime-300" />
                  <span className="text-xs text-neutral-400">Live</span>
                </div>
              </div>
            </div>

            {/* Center: Filter Pills */}
            <div className="flex gap-2">
              {["all", "grill", "fryer", "cold", "drinks", "pass"].map(station => (
                <button
                  key={station}
                  onClick={() => setSelectedStation(station)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    selectedStation === station
                      ? "bg-lime-300 text-black"
                      : "bg-neutral-700 text-white hover:bg-neutral-600"
                  }`}
                >
                  {station.charAt(0).toUpperCase() + station.slice(1)}
                </button>
              ))}
            </div>

            {/* Right: Clock & Bump */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-light text-xl">{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                <div className="text-xs text-neutral-400">Live</div>
              </div>
              <button
                onClick={handleBumpAll}
                className="flex items-center gap-2 rounded-full bg-lime-300 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-400"
              >
                <RotateCw size={16} />
                Bump All Ready
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="rounded-[24px] bg-neutral-800 p-3 text-center">
              <div className="text-xs text-neutral-400">In Queue</div>
              <div className="font-light text-2xl text-lime-300">{stats.queued}</div>
            </div>
            <div className="rounded-[24px] bg-neutral-800 p-3 text-center">
              <div className="text-xs text-neutral-400">In Prep</div>
              <div className="font-light text-2xl text-amber-400">{stats.in_prep}</div>
            </div>
            <div className="rounded-[24px] bg-neutral-800 p-3 text-center">
              <div className="text-xs text-neutral-400">Ready</div>
              <div className="font-light text-2xl text-lime-300">{stats.ready}</div>
            </div>
            <div className="rounded-[24px] bg-neutral-800 p-3 text-center">
              <div className="text-xs text-neutral-400">Avg Wait</div>
              <div className="font-light text-2xl text-white">{stats.avgWait}m</div>
            </div>
          </div>
        </div>

        {/* Station Columns */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {stations.map(station => {
            const stationKots = stationGroups[station]
            const config = stationConfig[station]

            return (
              <div key={station} className="rounded-[28px] bg-neutral-800 p-4">
                {/* Station Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white capitalize">{station}</span>
                    <span className="text-2xl">{config.emoji}</span>
                  </div>
                  <span className="rounded-full bg-lime-300 px-2.5 py-1 text-xs font-medium text-black">
                    {stationKots.length}
                  </span>
                </div>

                {/* KOT Cards */}
                <div className="space-y-3">
                  {stationKots.length === 0 ? (
                    <div className="rounded-[24px] border-2 border-dashed border-neutral-700 p-4 text-center">
                      <p className="text-sm text-neutral-400">No orders</p>
                    </div>
                  ) : (
                    stationKots.map(kot => {
                      const elapsed = getElapsedSeconds(kot.startedAt)
                      const slaColor = kot.status === "in_prep" ? getSLAColor(elapsed, stationConfig[kot.station].slaMinutes) : "bg-neutral-700"
                      const isOverdue = kot.status === "in_prep" && elapsed > stationConfig[kot.station].slaMinutes * 60

                      return (
                        <div
                          key={kot.id}
                          className={`rounded-[28px] bg-neutral-800 p-3 ${getKOTBorder(kot)}`}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <p className="font-bold text-white">#{kot.orderNum}</p>
                              <span className="inline-block rounded-full bg-lime-300 px-2 py-0.5 text-xs font-medium text-black">
                                {kot.tableId}
                              </span>
                            </div>
                            {isOverdue && (
                              <span className="text-xs font-medium text-rose-400">LATE</span>
                            )}
                            {!isOverdue && kot.status === "in_prep" && (
                              <span className="text-xs text-neutral-400">{elapsed}s</span>
                            )}
                          </div>

                          {/* SLA Bar */}
                          {kot.status === "in_prep" && (
                            <div className="mb-2 h-1.5 w-full rounded-full bg-neutral-700">
                              <div
                                className={`h-full rounded-full transition ${slaColor}`}
                                style={{
                                  width: `${Math.min(100, (elapsed / (stationConfig[kot.station].slaMinutes * 60)) * 100)}%`
                                }}
                              />
                            </div>
                          )}

                          {/* Items */}
                          <div className="mb-3 space-y-1">
                            {kot.items.map((item, idx) => (
                              <div key={idx} className="rounded-[20px] bg-neutral-700 p-2">
                                <p className="text-xs font-medium text-white">
                                  {item.qty}x {item.name}
                                </p>
                                {item.notes && (
                                  <p className="text-xs text-neutral-400 italic">{item.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => {
                              if (kot.status === "queued") {
                                handleUpdateStatus(kot.id, "in_prep")
                              } else if (kot.status === "in_prep") {
                                handleUpdateStatus(kot.id, "ready")
                              } else if (kot.status === "ready") {
                                handleUpdateStatus(kot.id, "served")
                              }
                            }}
                            className={`w-full rounded-full py-2 text-xs font-medium transition ${
                              kot.status === "queued"
                                ? "bg-lime-300 text-black hover:bg-lime-400"
                                : kot.status === "in_prep"
                                  ? "bg-amber-400 text-black hover:bg-amber-500"
                                  : kot.status === "ready"
                                    ? "bg-lime-300 text-black hover:bg-lime-400"
                                    : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                            }`}
                            disabled={kot.status === "served"}
                          >
                            {kot.status === "queued" && "Start Prep"}
                            {kot.status === "in_prep" && "Mark Ready"}
                            {kot.status === "ready" && "Served ✓"}
                            {kot.status === "served" && "Done"}
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
