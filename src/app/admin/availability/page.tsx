"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Trash2, Clock, CalendarOff, Save } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DAY_NAMES } from "@/lib/utils";

type WorkingHours = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type BlockedTime = {
  id: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
};

const DEFAULT_HOURS: Omit<WorkingHours, "id">[] = DAY_NAMES.map((_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "17:00",
  isActive: i >= 1 && i <= 5,
}));

export default function AvailabilityPage() {
  const router = useRouter();
  const [workingHours, setWorkingHours] = useState<Omit<WorkingHours, "id">[]>(DEFAULT_HOURS);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ date: "", startTime: "", endTime: "", reason: "" });
  const [blockSaving, setBlockSaving] = useState(false);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/admin/me");
    const data = await res.json();
    if (!data.authenticated) router.push("/admin/login");
  }, [router]);

  const fetchData = useCallback(async () => {
    const [hoursRes, blockedRes] = await Promise.all([
      fetch("/api/availability/working-hours"),
      fetch("/api/availability/blocked-times"),
    ]);
    const hours = await hoursRes.json();
    const blocked = await blockedRes.json();

    if (Array.isArray(hours) && hours.length > 0) {
      const merged = DEFAULT_HOURS.map((def) => {
        const found = hours.find((h: WorkingHours) => h.dayOfWeek === def.dayOfWeek);
        return found ? { dayOfWeek: found.dayOfWeek, startTime: found.startTime, endTime: found.endTime, isActive: found.isActive } : def;
      });
      setWorkingHours(merged);
    }
    if (Array.isArray(blocked)) setBlockedTimes(blocked);
  }, []);

  useEffect(() => {
    checkAuth().then(fetchData);
  }, [checkAuth, fetchData]);

  const handleSaveHours = async () => {
    setSaving(true);
    try {
      await fetch("/api/availability/working-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: workingHours }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (dayOfWeek: number, field: string, value: string | boolean) => {
    setWorkingHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
  };

  const addBlockedTime = async () => {
    if (!blockForm.date) return;
    setBlockSaving(true);
    try {
      await fetch("/api/availability/blocked-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: blockForm.date,
          startTime: blockForm.startTime || null,
          endTime: blockForm.endTime || null,
          reason: blockForm.reason || null,
        }),
      });
      await fetchData();
      setBlockModalOpen(false);
      setBlockForm({ date: "", startTime: "", endTime: "", reason: "" });
    } finally {
      setBlockSaving(false);
    }
  };

  const deleteBlockedTime = async (id: string) => {
    await fetch(`/api/availability/blocked-times/${id}`, { method: "DELETE" });
    await fetchData();
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Availability</h1>
          <p className="text-slate-500 text-sm mt-0.5">Set your working hours and block off unavailable times</p>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Working Hours</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {workingHours.map((day) => (
              <div key={day.dayOfWeek} className={`px-5 py-4 flex items-center gap-4 ${!day.isActive ? "opacity-50" : ""}`}>
                <label className="flex items-center gap-3 w-28 flex-shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isActive}
                    onChange={(e) => updateDay(day.dayOfWeek, "isActive", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{DAY_NAMES[day.dayOfWeek]}</span>
                </label>

                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-32">
                    <input
                      type="time"
                      value={day.startTime}
                      disabled={!day.isActive}
                      onChange={(e) => updateDay(day.dayOfWeek, "startTime", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <span className="text-slate-400 text-sm">to</span>
                  <div className="relative flex-1 max-w-32">
                    <input
                      type="time"
                      value={day.endTime}
                      disabled={!day.isActive}
                      onChange={(e) => updateDay(day.dayOfWeek, "endTime", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {!day.isActive && (
                  <span className="text-xs text-slate-400 italic">Closed</span>
                )}
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
            <Button onClick={handleSaveHours} loading={saving} size="sm" variant={saved ? "secondary" : "primary"}>
              {saved ? (
                <><span className="text-green-600">✓</span> Saved!</>
              ) : (
                <><Save size={14} /> Save Working Hours</>
              )}
            </Button>
          </div>
        </div>

        {/* Blocked Times */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarOff size={18} className="text-red-500" />
              <h2 className="font-semibold text-slate-900">Blocked Times</h2>
            </div>
            <Button size="sm" onClick={() => setBlockModalOpen(true)}>
              <Plus size={14} /> Block Time
            </Button>
          </div>

          {blockedTimes.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CalendarOff size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No blocked times. Use &quot;Block Time&quot; to mark days or hours as unavailable.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {blockedTimes
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((blocked) => (
                  <div key={blocked.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {format(new Date(blocked.date + "T12:00:00"), "EEEE, MMMM d, yyyy")}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {blocked.startTime && blocked.endTime
                          ? `${blocked.startTime} – ${blocked.endTime}`
                          : "All day"}
                        {blocked.reason && ` · ${blocked.reason}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteBlockedTime(blocked.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Block Time Modal */}
      <Modal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        title="Block Unavailable Time"
      >
        <div className="space-y-4">
          <Input
            label="Date"
            type="date"
            required
            min={format(new Date(), "yyyy-MM-dd")}
            value={blockForm.date}
            onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
          />

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-medium text-slate-500 mb-3">Time Range (leave empty to block the entire day)</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="From"
                type="time"
                value={blockForm.startTime}
                onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
              />
              <Input
                label="To"
                type="time"
                value={blockForm.endTime}
                onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
              />
            </div>
          </div>

          <Input
            label="Reason"
            placeholder="e.g. Holiday, Personal, Maintenance..."
            value={blockForm.reason}
            onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
          />

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setBlockModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={addBlockedTime} loading={blockSaving} disabled={!blockForm.date} className="flex-1">
              Block Time
            </Button>
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
}
