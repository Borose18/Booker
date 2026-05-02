"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, EyeOff, Eye, Scissors } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string | null;
  isActive: boolean;
};

const emptyForm = { name: "", duration: "60", price: "0", description: "" };

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/admin/me");
    const data = await res.json();
    if (!data.authenticated) router.push("/admin/login");
  }, [router]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      setServices(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth().then(fetchServices);
  }, [checkAuth, fetchServices]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      duration: String(service.duration),
      price: String(service.price),
      description: service.description || "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.duration || Number(form.duration) <= 0) errs.duration = "Duration must be greater than 0";
    if (form.price === "" || Number(form.price) < 0) errs.price = "Price must be 0 or more";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PATCH" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          duration: Number(form.duration),
          price: Number(form.price),
          description: form.description.trim() || null,
        }),
      });
      await fetchServices();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service: Service) => {
    await fetch(`/api/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !service.isActive }),
    });
    await fetchServices();
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Services</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage the services you offer</p>
          </div>
          <Button onClick={openNew}>
            <Plus size={16} /> Add Service
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center">
            <Scissors size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium mb-1">No services yet</p>
            <p className="text-sm text-slate-400 mb-4">Add your first service to start accepting bookings</p>
            <Button onClick={openNew} size="sm">
              <Plus size={14} /> Add Service
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className={`bg-white rounded-xl border p-5 flex items-start gap-4 transition-all ${
                  service.isActive ? "border-slate-200" : "border-slate-100 opacity-60"
                }`}
              >
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Scissors size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{service.name}</h3>
                    {!service.isActive && (
                      <Badge className="bg-slate-100 text-slate-500">Inactive</Badge>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-sm text-slate-500 mb-2 leading-relaxed">{service.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="font-bold text-slate-900">{formatCurrency(service.price)}</span>
                    <span>{service.duration} min</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(service)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => toggleActive(service)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    title={service.isActive ? "Deactivate" : "Activate"}
                  >
                    {service.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Service" : "Add New Service"}
      >
        <div className="space-y-4">
          <Input
            label="Service Name"
            required
            placeholder="e.g. Haircut, Consultation, Massage"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (minutes)"
              type="number"
              required
              min="5"
              step="5"
              placeholder="60"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              error={errors.duration}
            />
            <Input
              label="Price ($)"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="50.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              error={errors.price}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Brief description shown to customers..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {editingId ? "Save Changes" : "Add Service"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
}
