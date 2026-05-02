"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { CalendarDays, Clock, CheckCircle2, XCircle, TrendingUp, ChevronRight, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatTime, formatCurrency, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

type Appointment = {
  id: string;
  customerName: string;
  customerEmail: string;
  service: { name: string; price: number; duration: number };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<"day" | "week">("day");
  const [viewDate, setViewDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/admin/me");
    const data = await res.json();
    if (!data.authenticated) router.push("/admin/login");
  }, [router]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (Array.isArray(data)) setAppointments(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth().then(fetchAppointments);
  }, [checkAuth, fetchAppointments]);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayAppts = appointments.filter((a) => a.date === today);
  const upcomingAppts = appointments.filter(
    (a) => a.date >= today && a.status !== "CANCELLED"
  );
  const cancelledToday = appointments.filter(
    (a) => a.date === today && a.status === "CANCELLED"
  );

  const weekStart = startOfWeek(new Date(viewDate + "T12:00:00"), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const viewAppts =
    view === "day"
      ? appointments.filter((a) => a.date === viewDate)
      : appointments.filter((a) => {
          const d = new Date(a.date + "T12:00:00");
          return d >= weekStart && d <= addDays(weekStart, 6);
        });

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAppointments}>
              <RefreshCw size={14} /> Refresh
            </Button>
            <Link href="/book">
              <Button size="sm">
                New Booking
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Today's Bookings",
              value: todayAppts.filter((a) => a.status !== "CANCELLED").length,
              icon: <CalendarDays size={18} className="text-indigo-600" />,
              bg: "bg-indigo-50",
            },
            {
              label: "Upcoming",
              value: upcomingAppts.length,
              icon: <TrendingUp size={18} className="text-emerald-600" />,
              bg: "bg-emerald-50",
            },
            {
              label: "Confirmed Today",
              value: todayAppts.filter((a) => a.status === "CONFIRMED").length,
              icon: <CheckCircle2 size={18} className="text-blue-600" />,
              bg: "bg-blue-50",
            },
            {
              label: "Cancelled Today",
              value: cancelledToday.length,
              icon: <XCircle size={18} className="text-red-500" />,
              bg: "bg-red-50",
            },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                {icon}
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex gap-1">
              <button
                onClick={() => setView("day")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === "day" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Day
              </button>
              <button
                onClick={() => setView("week")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === "week" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Week
              </button>
            </div>

            {view === "day" ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const d = new Date(viewDate + "T12:00:00");
                    d.setDate(d.getDate() - 1);
                    setViewDate(format(d, "yyyy-MM-dd"));
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 text-sm transition-colors"
                >
                  ‹
                </button>
                <button onClick={() => setViewDate(today)} className="text-sm font-medium text-slate-700 px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors">
                  {viewDate === today ? "Today" : format(new Date(viewDate + "T12:00:00"), "MMM d")}
                </button>
                <button
                  onClick={() => {
                    const d = new Date(viewDate + "T12:00:00");
                    d.setDate(d.getDate() + 1);
                    setViewDate(format(d, "yyyy-MM-dd"));
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 text-sm transition-colors"
                >
                  ›
                </button>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-600">
                {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
              </p>
            )}
          </div>

          {/* Week grid header */}
          {view === "week" && (
            <div className="grid grid-cols-7 border-b border-slate-100">
              {weekDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const count = appointments.filter((a) => a.date === dateStr && a.status !== "CANCELLED").length;
                return (
                  <button
                    key={dateStr}
                    onClick={() => { setViewDate(dateStr); setView("day"); }}
                    className={`py-3 text-center text-xs hover:bg-slate-50 transition-colors ${isToday(day) ? "bg-indigo-50" : ""}`}
                  >
                    <div className={`font-medium ${isToday(day) ? "text-indigo-600" : "text-slate-500"}`}>
                      {format(day, "EEE")}
                    </div>
                    <div className={`text-base font-bold mt-0.5 ${isToday(day) ? "text-indigo-600" : "text-slate-900"}`}>
                      {format(day, "d")}
                    </div>
                    {count > 0 && (
                      <div className="mt-1 flex justify-center">
                        <span className="w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {count}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Appointments list */}
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading appointments...
              </div>
            ) : viewAppts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No appointments {view === "day" ? "for this day" : "this week"}</p>
              </div>
            ) : (
              viewAppts
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                .map((apt) => (
                  <div key={apt.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-shrink-0 w-16 text-center">
                      <p className="text-xs text-slate-400">{format(new Date(apt.date + "T12:00:00"), "MMM d")}</p>
                      <p className="text-sm font-bold text-slate-900">{formatTime(apt.startTime)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{apt.customerName}</p>
                      <p className="text-sm text-slate-500 truncate">{apt.service.name} · {formatCurrency(apt.service.price)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge className={STATUS_COLORS[apt.status]}>
                        {STATUS_LABELS[apt.status] || apt.status}
                      </Badge>
                      <Link href="/admin/appointments" className="text-slate-400 hover:text-slate-700 transition-colors">
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))
            )}
          </div>

          {viewAppts.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
              <Link href="/admin/appointments" className="text-xs text-indigo-600 hover:underline font-medium">
                View all appointments →
              </Link>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
