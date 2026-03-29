import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import { Save, ToggleLeft, ToggleRight } from "lucide-react";

interface AppSettings {
  waitlist_mode: string;
  maintenance_mode: string;
  free_tier_daily_limit: string;
  announcement_banner: string;
}

function Toggle({ label, desc, value, onChange }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-gray-400 text-sm mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className={`transition-colors ${value ? "text-amber-400" : "text-gray-600"}`}>
        {value ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
      </button>
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    waitlist_mode: "false",
    maintenance_mode: "false",
    free_tier_daily_limit: "10",
    announcement_banner: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const toast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  useEffect(() => {
    adminFetch("/settings").then(r => r.json()).then(data => {
      setSettings(prev => ({ ...prev, ...data }));
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await adminFetch("/settings", { method: "PATCH", body: JSON.stringify(settings) });
    setSaving(false);
    toast("Settings saved successfully");
  };

  if (loading) return (
    <AdminLayout>
      <div className="p-8 text-gray-400">Loading settings...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl">
        <h1 className="text-white text-2xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400 text-sm mb-8">Platform configuration and toggles</p>

        {toastMsg && (
          <div className="mb-6 px-4 py-3 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl text-sm">{toastMsg}</div>
        )}

        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-white font-bold">Access Control</h2>
          </div>
          <div className="px-6 divide-y divide-gray-800">
            <Toggle
              label="Waitlist Mode"
              desc='When ON, "Apply for Membership" leads to the waitlist form. When OFF, goes directly to signup.'
              value={settings.waitlist_mode === "true"}
              onChange={v => setSettings(s => ({ ...s, waitlist_mode: String(v) }))}
            />
            <Toggle
              label="Maintenance Mode"
              desc="When ON, all users see a maintenance message. Admin can still access the panel."
              value={settings.maintenance_mode === "true"}
              onChange={v => setSettings(s => ({ ...s, maintenance_mode: String(v) }))}
            />
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-white font-bold">Match Limits</h2>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Free Tier Daily Match Limit</label>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.free_tier_daily_limit}
              onChange={e => setSettings(s => ({ ...s, free_tier_daily_limit: e.target.value }))}
              className="w-32 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-gray-500 text-xs mt-2">Core and Badge tiers have unlimited matches.</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-white font-bold">Announcement Banner</h2>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Banner Message</label>
            <textarea
              value={settings.announcement_banner}
              onChange={e => setSettings(s => ({ ...s, announcement_banner: e.target.value }))}
              rows={3}
              placeholder="Leave empty to hide the banner. e.g. 'We are currently experiencing high demand — thank you for your patience.'"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <p className="text-gray-500 text-xs mt-2">Shown as a banner at the top of the app for all users when non-empty.</p>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </AdminLayout>
  );
}
