'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';

interface Appointment {
  id: string;
  time: string;
  duration: string;
  client: string;
  service: string;
  staff: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  skinType?: string;
}

const APPOINTMENTS: Appointment[] = [
  { id: 'a1', time: '09:00', duration: '45 min', client: 'Emma L.', service: 'Skin Consultation', staff: 'Mia', status: 'completed', skinType: 'Dry', notes: 'Recommended Hydra-Boost + Collagen Eye Cream' },
  { id: 'a2', time: '10:00', duration: '60 min', client: 'Sarah K.', service: 'Shade Match & Makeover', staff: 'Jade', status: 'confirmed', skinType: 'Combination' },
  { id: 'a3', time: '11:30', duration: '45 min', client: 'Alice T.', service: 'Skin Consultation', staff: 'Mia', status: 'confirmed', skinType: 'Sensitive', notes: 'Patch test required before product recommendation' },
  { id: 'a4', time: '13:00', duration: '60 min', client: 'Priya M.', service: 'Facial Glow Treatment', staff: 'Mia', status: 'pending' },
  { id: 'a5', time: '14:30', duration: '30 min', client: 'Alice T.', service: 'Brow & Lash Styling', staff: 'Lena', status: 'confirmed' },
  { id: 'a6', time: '15:00', duration: '60 min', client: 'New Client', service: 'Anti-Aging Consultation', staff: 'Jade', status: 'pending' },
  { id: 'a7', time: '16:00', duration: '45 min', client: 'Nadia R.', service: 'Anti-Aging Consultation', staff: 'Jade', status: 'confirmed', notes: 'Follow up from March visit' },
  { id: 'a8', time: '17:00', duration: '30 min', client: 'Sophie W.', service: 'Brow Shaping', staff: 'Lena', status: 'cancelled' },
];

const SERVICES = [
  { name: 'Skin Consultation', duration: '45 min', price: '$35', staff: ['Mia', 'Jade'] },
  { name: 'Shade Match & Makeover', duration: '60 min', price: '$55', staff: ['Jade', 'Lena'] },
  { name: 'Facial Glow Treatment', duration: '60 min', price: '$80', staff: ['Mia'] },
  { name: 'Anti-Aging Consultation', duration: '45 min', price: '$50', staff: ['Jade', 'Mia'] },
  { name: 'Brow & Lash Styling', duration: '30 min', price: '$45', staff: ['Lena'] },
  { name: 'Brow Shaping', duration: '30 min', price: '$30', staff: ['Lena'] },
];

const STAFF_COLORS: Record<string, string> = {
  Mia: 'bg-pink-500/20 text-pink-400',
  Jade: 'bg-fuchsia-500/20 text-fuchsia-400',
  Lena: 'bg-purple-500/20 text-purple-400',
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  confirmed: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  pending: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertCircle },
  completed: { color: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20', icon: CheckCircle2 },
  cancelled: { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: XCircle },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATES = [13, 14, 15, 16, 17, 18, 19];

export default function CosmeticsAppointments() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'services'>('day');

  const stats = {
    total: APPOINTMENTS.length,
    confirmed: APPOINTMENTS.filter(a => a.status === 'confirmed').length,
    pending: APPOINTMENTS.filter(a => a.status === 'pending').length,
    completed: APPOINTMENTS.filter(a => a.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/15 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Appointments</h1>
            <p className="text-xs text-neutral-500">Booking calendar and consultation management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-full p-1">
            <button onClick={() => setViewMode('day')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${viewMode === 'day' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-neutral-500'}`}>Day</button>
            <button onClick={() => setViewMode('services')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${viewMode === 'services' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-neutral-500'}`}>Services</button>
          </div>
          <button className="flex items-center gap-2 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/25 text-fuchsia-400 text-xs font-medium px-4 py-2 rounded-full transition-all">
            <Plus className="w-3.5 h-3.5" /> Book Appointment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Today', value: stats.total, color: 'text-white' },
          { label: 'Confirmed', value: stats.confirmed, color: 'text-emerald-400' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
          { label: 'Completed', value: stats.completed, color: 'text-neutral-400' },
        ].map(s => (
          <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {viewMode === 'day' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Calendar strip + appointments */}
          <div className="lg:col-span-2 space-y-4">
            {/* Week strip */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <button className="text-neutral-500 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm font-semibold text-white">April 2026</span>
                <button className="text-neutral-500 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((day, i) => (
                  <button key={day} onClick={() => setSelectedDay(i)}
                    className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                      selectedDay === i ? 'bg-fuchsia-500/20 border border-fuchsia-500/30' : 'hover:bg-neutral-800'
                    }`}>
                    <span className={`text-[10px] font-medium ${selectedDay === i ? 'text-fuchsia-400' : 'text-neutral-500'}`}>{day}</span>
                    <span className={`text-sm font-bold mt-0.5 ${selectedDay === i ? 'text-fuchsia-400' : 'text-white'}`}>{DATES[i]}</span>
                    {i === 0 && <div className="w-1 h-1 rounded-full bg-fuchsia-400 mt-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointment list */}
            <div className="space-y-2">
              {APPOINTMENTS.map(apt => {
                const { color, icon: StatusIcon } = STATUS_CONFIG[apt.status];
                return (
                  <button key={apt.id} onClick={() => setSelectedApt(apt)}
                    className={`w-full flex items-center gap-4 bg-neutral-900 border rounded-2xl px-4 py-3 text-left transition-all hover:border-fuchsia-500/30 ${
                      selectedApt?.id === apt.id ? 'border-fuchsia-500/40 bg-neutral-800/60' : 'border-neutral-800'
                    }`}>
                    <div className="text-center flex-shrink-0 w-12">
                      <div className="text-sm font-bold text-fuchsia-400">{apt.time}</div>
                      <div className="text-[10px] text-neutral-500">{apt.duration}</div>
                    </div>
                    <div className="w-px h-8 bg-neutral-700 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white">{apt.client}</div>
                      <div className="text-[10px] text-neutral-400">{apt.service}</div>
                    </div>
                    <div className={`text-[10px] w-7 h-7 rounded-full flex items-center justify-center font-bold ${STAFF_COLORS[apt.staff] ?? 'bg-neutral-700 text-neutral-300'}`}>
                      {apt.staff[0]}
                    </div>
                    <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 flex items-center gap-1 ${color}`}>
                      <StatusIcon className="w-3 h-3" /> {apt.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detail / services */}
          <div className="space-y-4">
            {selectedApt ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Appointment Details</h3>
                  <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${STATUS_CONFIG[selectedApt.status].color}`}>
                    {selectedApt.status}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-xs text-white">{selectedApt.client}</span>
                    {selectedApt.skinType && <span className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full px-2 py-0.5">{selectedApt.skinType}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-xs text-white">{selectedApt.service}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-xs text-white">{selectedApt.time} · {selectedApt.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${STAFF_COLORS[selectedApt.staff] ?? 'bg-neutral-700 text-neutral-300'}`}>
                      {selectedApt.staff[0]}
                    </div>
                    <span className="text-xs text-white">{selectedApt.staff}</span>
                  </div>
                  {selectedApt.notes && (
                    <div className="bg-neutral-800 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ClipboardList className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-[10px] text-neutral-500 font-medium">Notes</span>
                      </div>
                      <p className="text-xs text-neutral-300">{selectedApt.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  {selectedApt.status === 'confirmed' && (
                    <>
                      <button className="flex-1 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium py-2 rounded-full hover:bg-emerald-500/25 transition-all">Complete</button>
                      <button className="flex-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium py-2 rounded-full hover:bg-rose-500/20 transition-all">Cancel</button>
                    </>
                  )}
                  {selectedApt.status === 'pending' && (
                    <button className="flex-1 bg-fuchsia-500/15 border border-fuchsia-500/25 text-fuchsia-400 text-xs font-medium py-2 rounded-full hover:bg-fuchsia-500/25 transition-all">Confirm Appointment</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
                <CalendarDays className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                <div className="text-xs text-neutral-500">Select an appointment to view details</div>
              </div>
            )}

            {/* Staff availability */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Staff Today</h3>
              <div className="space-y-2">
                {Object.entries(STAFF_COLORS).map(([name, color]) => {
                  const count = APPOINTMENTS.filter(a => a.staff === name && a.status !== 'cancelled').length;
                  return (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-[10px] font-bold`}>{name[0]}</div>
                        <span className="text-xs text-white">{name}</span>
                      </div>
                      <span className="text-xs text-neutral-400">{count} apts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'services' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map(s => (
            <div key={s.name} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                <span className="text-sm font-bold text-fuchsia-400">{s.price}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400 mb-3">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.staff.map(st => (
                  <span key={st} className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${STAFF_COLORS[st]}`}>{st}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
