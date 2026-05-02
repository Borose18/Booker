"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type BusinessSettings = {
  businessName: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  address: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: "",
    tagline: "",
    description: "",
    email: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/business");
      const data = await res.json();
      if (data) {
        setSettings({
          businessName: data.businessName || "",
          tagline: data.tagline || "",
          description: data.description || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      }
    });
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || "Failed to change password");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your business information and preferences</p>
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Business Information</h2>
            <p className="text-xs text-slate-400 mt-0.5">This is shown on your booking page</p>
          </div>
          <div className="p-5 space-y-4">
            <Input
              label="Business Name"
              required
              placeholder="e.g. Jane's Hair Studio"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
            />
            <Input
              label="Tagline"
              placeholder="e.g. Looking great, feeling confident"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                rows={3}
                placeholder="Brief description of your business..."
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="hello@yourbusiness.com"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              />
            </div>
            <Input
              label="Address"
              placeholder="123 Main St, City, State"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            />
          </div>
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
            <Button onClick={handleSaveSettings} loading={saving} size="sm" variant={saved ? "secondary" : "primary"}>
              {saved ? (
                <><span className="text-green-600">✓</span> Saved!</>
              ) : (
                <><Save size={14} /> Save Changes</>
              )}
            </Button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">Update your admin login password</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showPass ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <Input
              label="New Password"
              type={showPass ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
            <Input
              label="Confirm New Password"
              type={showPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPass}
                onChange={(e) => setShowPass(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600"
              />
              <span className="text-sm text-slate-600 flex items-center gap-1">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                Show passwords
              </span>
            </label>
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
          </div>
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
            <Button onClick={handleChangePassword} loading={passwordSaving} size="sm" variant={passwordSaved ? "secondary" : "primary"}>
              {passwordSaved ? (
                <><span className="text-green-600">✓</span> Password Updated!</>
              ) : (
                <><Save size={14} /> Update Password</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
