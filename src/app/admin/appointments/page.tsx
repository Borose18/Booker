"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, CalendarDays, Filter, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatTime, formatCurrency, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

type Appointment = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  service: { name: string; price: number; duration: number };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string | null;
  createdAt: string;
};

const ALL_STATUSES = ["", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

export default function AppointmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(true);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchAppointments();
      setDetailOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedApt || !rescheduleDate || !rescheduleTime) return;
    setActionLoading(true);
    try {
      await fetch(`/api/appointments/${selectedApt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: rescheduleDate,
          startTime: rescheduleTime,
          status: "CONFIRMED",
        }),
      });
      await fetchAppointments();
      setRescheduleOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = appointments.filter((a) => {
    const matchSearch =
      !search ||
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      a.service.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.startTime.localeCompare(a.startTime);
  });

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-5 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <Button variant="outline" size="sm" onClick={fetchAppointments}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-8 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading...
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No appointments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Service</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Date & Time</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sorted.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{apt.customerName}</p>
                        <p className="text-xs text-slate-400">{apt.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">{apt.service.name}</p>
                        <p className="text-xs text-slate-400">{formatCurrency(apt.service.price)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">{format(new Date(apt.date + "T12:00:00"), "MMM d, yyyy")}</p>
                        <p className="text-xs text-slate-400">{formatTime(apt.startTime)} – {formatTime(apt.endTime)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_COLORS[apt.status]}>
                          {STATUS_LABELS[apt.status] || apt.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelectedApt(apt); setDetailOpen(true); }}
                          className="text-xs text-indigo-600 hover:underline font-medium"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Appointment Details"
      >
        {selectedApt && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Customer</p>
                <p className="font-semibold text-slate-900">{selectedApt.customerName}</p>
                <p className="text-slate-500 text-xs">{selectedApt.customerEmail}</p>
                {selectedApt.customerPhone && <p className="text-slate-500 text-xs">{selectedApt.customerPhone}</p>}
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Service</p>
                <p className="font-semibold text-slate-900">{selectedApt.service.name}</p>
                <p className="text-slate-500 text-xs">{formatCurrency(selectedApt.service.price)} · {selectedApt.service.duration} min</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Date</p>
                <p className="font-semibold text-slate-900">
                  {format(new Date(selectedApt.date + "T12:00:00"), "EEE, MMM d, yyyy")}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Time</p>
                <p className="font-semibold text-slate-900">{formatTime(selectedApt.startTime)} – {formatTime(selectedApt.endTime)}</p>
              </div>
            </div>

            {selectedApt.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800">
                <p className="text-xs font-semibold text-amber-600 mb-1">Notes</p>
                {selectedApt.notes}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Status:</span>
              <Badge className={STATUS_COLORS[selectedApt.status]}>
                {STATUS_LABELS[selectedApt.status] || selectedApt.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {selectedApt.status !== "CONFIRMED" && selectedApt.status !== "COMPLETED" && (
                <Button
                  size="sm"
                  onClick={() => updateStatus(selectedApt.id, "CONFIRMED")}
                  loading={actionLoading}
                  className="gap-1"
                >
                  <CheckCircle2 size={14} /> Confirm
                </Button>
              )}
              {selectedApt.status !== "COMPLETED" && selectedApt.status !== "CANCELLED" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => updateStatus(selectedApt.id, "COMPLETED")}
                  loading={actionLoading}
                >
                  <Clock size={14} /> Mark Complete
                </Button>
              )}
              {selectedApt.status !== "CANCELLED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRescheduleDate(selectedApt.date);
                    setRescheduleTime(selectedApt.startTime);
                    setRescheduleOpen(true);
                  }}
                >
                  Reschedule
                </Button>
              )}
              {selectedApt.status !== "CANCELLED" && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => updateStatus(selectedApt.id, "CANCELLED")}
                  loading={actionLoading}
                >
                  <XCircle size={14} /> Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Reschedule Appointment"
      >
        <div className="space-y-4">
          <Input
            label="New Date"
            type="date"
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd")}
          />
          <Input
            label="New Time"
            type="time"
            value={rescheduleTime}
            onChange={(e) => setRescheduleTime(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setRescheduleOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              loading={actionLoading}
              disabled={!rescheduleDate || !rescheduleTime}
              className="flex-1"
            >
              Reschedule
            </Button>
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
}
