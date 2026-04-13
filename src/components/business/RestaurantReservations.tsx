"use client"

import { useState, useMemo } from "react"
import { X, Plus, Minus, Check } from "lucide-react"

interface Reservation {
  id: string
  guestName: string
  phone: string
  email: string
  date: string
  time: string
  pax: number
  table?: string
  occasion?: string
  specialRequests?: string
  status: "booked" | "confirmed" | "seated" | "completed" | "cancelled" | "no-show"
}

export default function RestaurantReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([
    { id: "1", guestName: "Sarah Kowalski", phone: "+254 712 345 678", email: "sarah@example.com", date: "2024-12-01", time: "19:30", pax: 4, table: "T08", status: "confirmed", occasion: "Birthday", specialRequests: "Window seat preferred" },
    { id: "2", guestName: "James Mitchell", phone: "+254 720 123 456", email: "james@example.com", date: "2024-12-01", time: "20:00", pax: 2, table: "T05", status: "booked" },
    { id: "3", guestName: "Amara Okafor", phone: "+254 718 765 432", email: "amara@example.com", date: "2024-12-01", time: "18:00", pax: 6, table: "T11", status: "seated" },
    { id: "4", guestName: "David Chen", phone: "+254 722 987 654", email: "david@example.com", date: "2024-12-01", time: "17:30", pax: 3, table: "T03", status: "completed" },
    { id: "5", guestName: "Sophia Laurent", phone: "+254 715 234 567", email: "sophia@example.com", date: "2024-12-01", time: "21:00", pax: 2, status: "booked" },
    { id: "6", guestName: "Marcus Johnson", phone: "+254 723 456 789", email: "marcus@example.com", date: "2024-12-02", time: "19:00", pax: 5, status: "booked" },
    { id: "7", guestName: "Elena Rodriguez", phone: "+254 719 876 543", email: "elena@example.com", date: "2024-12-02", time: "20:30", pax: 4, status: "confirmed" },
    { id: "8", guestName: "Kai Tanaka", phone: "+254 721 345 678", email: "kai@example.com", date: "2024-12-03", time: "18:00", pax: 2, status: "booked" },
    { id: "9", guestName: "Nina Petrov", phone: "+254 717 654 321", email: "nina@example.com", date: "2024-12-03", time: "19:30", pax: 3, status: "confirmed" },
    { id: "10", guestName: "Lucas Santos", phone: "+254 724 567 890", email: "lucas@example.com", date: "2024-12-01", time: "18:30", pax: 4, status: "no-show" }
  ])

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<string>("today")
  const [editForm, setEditForm] = useState<Partial<Reservation>>({})
  const [paxEdit, setPaxEdit] = useState(2)

  const handleSelectReservation = (res: Reservation) => {
    setSelectedReservation(res)
    setEditForm({ ...res })
    setPaxEdit(res.pax)
  }

  const handleSaveReservation = () => {
    if (selectedReservation && editForm.guestName) {
      setReservations(reservations.map(r => r.id === selectedReservation.id ? { ...selectedReservation, ...editForm, pax: paxEdit } : r))
      setSelectedReservation(null)
    }
  }

  const handleCancelReservation = () => {
    if (selectedReservation) {
      setReservations(reservations.map(r => r.id === selectedReservation.id ? { ...r, status: "cancelled" } : r))
      setSelectedReservation(null)
    }
  }

  const handleConfirmArrival = () => {
    if (selectedReservation) {
      setReservations(reservations.map(r => r.id === selectedReservation.id ? { ...r, status: "confirmed" } : r))
      setSelectedReservation(null)
    }
  }

  const handleSeatGuest = () => {
    if (selectedReservation) {
      setReservations(reservations.map(r => r.id === selectedReservation.id ? { ...r, status: "seated" } : r))
      setSelectedReservation(null)
    }
  }

  const handleCompleteReservation = () => {
    if (selectedReservation) {
      setReservations(reservations.map(r => r.id === selectedReservation.id ? { ...r, status: "completed" } : r))
      setSelectedReservation(null)
    }
  }

  const filteredReservations = useMemo(() => {
    let filtered = reservations

    if (filterStatus !== "all") {
      filtered = filtered.filter(r => r.status === filterStatus)
    }

    return filtered.sort((a, b) => {
      const timeA = parseInt(a.time.replace(":", ""))
      const timeB = parseInt(b.time.replace(":", ""))
      return timeA - timeB
    })
  }, [reservations, filterStatus])

  const stats = {
    booked: reservations.filter(r => r.status === "booked").length,
    confirmed: reservations.filter(r => r.status === "confirmed").length,
    seated: reservations.filter(r => r.status === "seated").length,
    completed: reservations.filter(r => r.status === "completed").length
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "booked":
        return "bg-sky-500/20 text-sky-400 border-l-2 border-sky-500"
      case "confirmed":
        return "bg-violet-500/30 text-violet-300 border-l-2 border-violet-400"
      case "seated":
        return "bg-lime-300/30 text-lime-300 border-l-2 border-lime-300"
      case "completed":
        return "bg-neutral-700/50 text-neutral-400 border-l-2 border-neutral-500"
      case "cancelled":
        return "bg-rose-500/20 text-rose-400 border-l-2 border-rose-500"
      case "no-show":
        return "bg-amber-500/20 text-amber-400 border-l-2 border-amber-400"
      default:
        return "bg-neutral-800"
    }
  }

  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 12 + i
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour > 12 ? hour - 12 : hour
    return `${displayHour}:00 ${ampm}`
  })

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="mx-auto max-w-7xl rounded-[32px] bg-neutral-900 p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* LEFT: Main Content */}
          <div>
            {/* Header Card */}
            <div className="mb-4 rounded-[28px] bg-neutral-800 p-5">
              <div className="mb-4">
                <h1 className="font-light text-4xl text-white">Reservations</h1>
                <p className="mt-1 text-sm text-neutral-400">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
              </div>

              {/* Stats Row */}
              <div className="mb-4 grid grid-cols-4 gap-3">
                <div className="rounded-[24px] bg-neutral-700/50 p-4 text-center">
                  <p className="text-xs text-neutral-400">Booked</p>
                  <p className="font-light text-3xl text-sky-400">{stats.booked}</p>
                </div>
                <div className="rounded-[24px] bg-neutral-700/50 p-4 text-center">
                  <p className="text-xs text-neutral-400">Confirmed</p>
                  <p className="font-light text-3xl text-lime-300">{stats.confirmed}</p>
                </div>
                <div className="rounded-[24px] bg-neutral-700/50 p-4 text-center">
                  <p className="text-xs text-neutral-400">Seated</p>
                  <p className="font-light text-3xl text-lime-300">{stats.seated}</p>
                </div>
                <div className="rounded-[24px] bg-neutral-700/50 p-4 text-center">
                  <p className="text-xs text-neutral-400">Completed</p>
                  <p className="font-light text-3xl text-neutral-400">{stats.completed}</p>
                </div>
              </div>

              {/* Date Tabs */}
              <div className="flex gap-2">
                {["today", "tomorrow", "week"].map(date => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedDate === date
                        ? "bg-lime-300 text-black"
                        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                    }`}
                  >
                    {date.charAt(0).toUpperCase() + date.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-4 rounded-[28px] bg-neutral-800 p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">Timeline View</h2>
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Time Header */}
                  <div className="mb-3 flex gap-2">
                    <div className="w-12 flex-shrink-0" />
                    {timeSlots.map((time, idx) => (
                      <div key={idx} className="w-24 flex-shrink-0 text-center text-xs text-neutral-400">
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* Table Rows */}
                  <div className="space-y-2">
                    {["T01", "T05", "T08", "T11", "T12"].map((table, idx) => (
                      <div key={table} className="flex gap-2 items-center">
                        <div className="w-12 flex-shrink-0 text-xs font-medium text-neutral-400">{table}</div>
                        <div className="flex gap-2">
                          {reservations
                            .filter(r => r.table === table)
                            .map(res => {
                              const timeNum = parseInt(res.time.replace(":", ""))
                              const slotNum = Math.floor((timeNum - 1200) / 100)
                              return (
                                <div
                                  key={res.id}
                                  className={`rounded-[12px] px-2 py-1 text-xs font-medium ${getStatusColor(res.status)} w-24 text-center truncate cursor-pointer`}
                                  onClick={() => handleSelectReservation(res)}
                                  title={res.guestName}
                                >
                                  {res.guestName.split(" ")[0]}
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reservations List */}
            <div className="rounded-[28px] bg-neutral-800 p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">All Reservations</h2>

              {/* Filter Tabs */}
              <div className="mb-4 flex gap-1 overflow-x-auto pb-2">
                {["all", "booked", "confirmed", "seated", "completed", "cancelled", "no-show"].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      filterStatus === status
                        ? "bg-lime-300 text-black"
                        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Reservation Rows */}
              <div className="space-y-2">
                {filteredReservations.map(res => (
                  <button
                    key={res.id}
                    onClick={() => handleSelectReservation(res)}
                    className="w-full rounded-[24px] bg-neutral-800 p-4 text-left transition hover:bg-neutral-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{res.time}</span>
                          <span className="text-sm font-medium text-neutral-300">{res.guestName}</span>
                          <span className="rounded-full bg-lime-300 px-2 py-0.5 text-xs text-black">{res.pax}</span>
                          {res.table && <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-xs text-neutral-300">{res.table}</span>}
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(res.status)}`}>
                        {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Form / Detail Panel */}
          <div className="rounded-[32px] bg-neutral-900 p-5 h-fit">
            {!selectedReservation ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div className="text-4xl">📋</div>
                <p className="text-sm text-neutral-400">Select a reservation or create a new one</p>
                <button className="mt-2 flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2 text-xs font-medium text-black hover:bg-lime-400">
                  <Plus size={16} />
                  New Reservation
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-4 flex items-center justify-between pb-4 border-b border-neutral-700">
                  <h3 className="font-semibold text-white">
                    {selectedReservation.status === "booked" ? "Edit Reservation" : "View Reservation"}
                  </h3>
                  <button
                    onClick={() => setSelectedReservation(null)}
                    className="rounded-full hover:bg-neutral-800 p-2 text-neutral-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Guest Name</label>
                    <input
                      type="text"
                      value={editForm.guestName || ""}
                      onChange={e => setEditForm({ ...editForm, guestName: e.target.value })}
                      className="w-full rounded-full bg-neutral-800 border border-neutral-700 px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-lime-300"
                      placeholder="Guest name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone || ""}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full rounded-full bg-neutral-800 border border-neutral-700 px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-lime-300"
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email || ""}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full rounded-full bg-neutral-800 border border-neutral-700 px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-lime-300"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">Date</label>
                      <input
                        type="date"
                        value={editForm.date || ""}
                        onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                        className="w-full rounded-full bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">Time</label>
                      <input
                        type="time"
                        value={editForm.time || ""}
                        onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                        className="w-full rounded-full bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-2">Party Size</label>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setPaxEdit(Math.max(1, paxEdit - 1))}
                        className="rounded-full bg-lime-300 p-2 text-black hover:bg-lime-400"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-semibold text-white">{paxEdit}</span>
                      <button
                        onClick={() => setPaxEdit(paxEdit + 1)}
                        className="rounded-full bg-lime-300 p-2 text-black hover:bg-lime-400"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Table</label>
                    <select
                      value={editForm.table || ""}
                      onChange={e => setEditForm({ ...editForm, table: e.target.value })}
                      className="w-full rounded-full bg-neutral-800 border border-neutral-700 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-300"
                    >
                      <option value="">Select table</option>
                      {["T01", "T05", "T08", "T11", "T12"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Special Requests</label>
                    <textarea
                      value={editForm.specialRequests || ""}
                      onChange={e => setEditForm({ ...editForm, specialRequests: e.target.value })}
                      className="w-full rounded-[20px] bg-neutral-800 border border-neutral-700 px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-lime-300"
                      placeholder="Window seat, allergies, etc."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-2">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {["booked", "confirmed", "seated"].map(status => (
                        <button
                          key={status}
                          onClick={() => setEditForm({ ...editForm, status: status as any })}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                            editForm.status === status ? getStatusColor(status) : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {selectedReservation.status === "booked" && (
                    <>
                      <button
                        onClick={handleSaveReservation}
                        className="w-full rounded-full bg-lime-300 py-3 text-sm font-medium text-black hover:bg-lime-400"
                      >
                        Save Reservation
                      </button>
                      <button
                        onClick={handleSeatGuest}
                        className="w-full rounded-full bg-lime-300 py-3 text-sm font-medium text-black hover:bg-lime-400"
                      >
                        Seat Guests
                      </button>
                      <button
                        onClick={handleCancelReservation}
                        className="w-full rounded-full bg-rose-500 py-3 text-sm font-medium text-white hover:bg-rose-600"
                      >
                        Cancel Reservation
                      </button>
                    </>
                  )}

                  {selectedReservation.status === "confirmed" && (
                    <>
                      <button
                        onClick={handleSeatGuest}
                        className="w-full rounded-full bg-lime-300 py-3 text-sm font-medium text-black hover:bg-lime-400"
                      >
                        Seat Guests
                      </button>
                      <button
                        onClick={handleCancelReservation}
                        className="w-full rounded-full bg-rose-500 py-3 text-sm font-medium text-white hover:bg-rose-600"
                      >
                        Cancel Reservation
                      </button>
                    </>
                  )}

                  {selectedReservation.status === "seated" && (
                    <button
                      onClick={handleCompleteReservation}
                      className="w-full rounded-full bg-lime-300 py-3 text-sm font-medium text-black hover:bg-lime-400"
                    >
                      Complete & Close
                    </button>
                  )}

                  {(selectedReservation.status === "completed" || selectedReservation.status === "cancelled" || selectedReservation.status === "no-show") && (
                    <button
                      onClick={() => setSelectedReservation(null)}
                      className="w-full rounded-full bg-neutral-800 py-3 text-sm font-medium text-neutral-500 cursor-not-allowed"
                    >
                      No Actions Available
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedReservation(null)}
                    className="w-full rounded-full bg-neutral-800 py-3 text-sm font-medium text-neutral-400 hover:bg-neutral-700"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
