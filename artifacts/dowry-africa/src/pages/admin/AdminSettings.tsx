import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import { API_BASE } from "@/lib/api-url";
import { Save, ToggleLeft, ToggleRight, Download, Mail, DollarSign, Info, Trash2 } from "lucide-react";

interface AppSettings {
  coming_soon_mode: string;
  coming_soon_headline: string;
  coming_soon_subtext: string;
  coming_soon_exclusivity: string;
  coming_soon_button_text: string;
  coming_soon_success_message: string;
  free_tier_daily_limit: string;
  announcement_banner: string;
  core_price: string;
  core_price_label: string;
  core_name: string;
  core_description: string;
  core_features: string;
  serious_price: string;
  serious_price_label: string;
  serious_name: string;
  serious_description: string;
  serious_features: string;
}

interface EarlyAccessEmail {
  id: string;
  email: string;
  createdAt: string;
}

function Toggle({ label, desc, value, onChange }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 pr-4">
        <p className="text-white font-medium">{label}</p>
        <p className="text-gray-400 text-sm mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className={`transition-colors shrink-0 ${value ? "text-amber-400" : "text-gray-600"}`}>
        {value ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}) {
  const cls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      {multiline ? (
        <textarea rows={3} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className={`${cls} resize-none`} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    coming_soon_mode: "false",
    coming_soon_headline: "Built for marriage. Not just matches.",
    coming_soon_subtext: "",
    coming_soon_exclusivity: "",
    coming_soon_button_text: "Request early access",
    coming_soon_success_message: "You're on the list. We'll be in touch soon.",
    free_tier_daily_limit: "10",
    announcement_banner: "",
    core_price: "12.99",
    core_price_label: "$12.99/month",
    core_name: "Core",
    core_description: "For members who are serious about finding a committed partner.",
    core_features: '["Unlimited profiles","See who liked you","Unlimited messaging","Advanced country filters"]',
    serious_price: "19.99",
    serious_price_label: "$19.99/month",
    serious_name: "Serious Badge",
    serious_description: "For members who want to demonstrate the highest level of intent.",
    serious_features: '["Everything in Core","Serious Badge on your profile","Ranked highest in feeds","Access to Badge-only pool"]',
  });
  const [emails, setEmails] = useState<EarlyAccessEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; email: string } | null>(null);

  const toast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const handleDeleteEarlyAccess = async (id: string) => {
    try {
      await adminFetch(`/early-access/${id}`, { method: "DELETE" });
      setEmails(prev => prev.filter(e => e.id !== id));
      toast("Email removed");
    } catch {
      toast("Failed to remove — please try again");
    } finally {
      setConfirmDelete(null);
    }
  };

  useEffect(() => {
    Promise.all([
      adminFetch("/settings").then(r => r.json()),
      adminFetch("/early-access-emails").then(r => r.json()),
    ]).then(([settingsData, emailsData]) => {
      setSettings(prev => ({ ...prev, ...settingsData }));
      setEmails(emailsData.rows ?? []);
      setLoading(false);
    }).catch(() => {
      adminFetch("/settings").then(r => r.json()).then(data => {
        setSettings(prev => ({ ...prev, ...data }));
        setLoading(false);
      });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await adminFetch("/settings", { method: "PATCH", body: JSON.stringify(settings) });
    setSaving(false);
    toast("Settings saved successfully");
  };

  const exportCSV = async () => {
    const { getAdminToken } = await import("@/lib/admin");
    const token = getAdminToken();
    const res = await fetch(`${API_BASE}/api/early-access/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `early-access-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const set = (key: keyof AppSettings) => (v: string) =>
    setSettings(s => ({ ...s, [key]: v }));

  if (loading) return (
    <AdminLayout>
      <div className="p-8 text-gray-400">Loading settings...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl space-y-6">
        <div>
          <h1 className="text-white text-2xl font-bold mb-1">Settings</h1>
          <p className="text-gray-400 text-sm">Platform configuration and coming soon controls</p>
        </div>

        {toastMsg && (
          <div className="px-4 py-3 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl text-sm">{toastMsg}</div>
        )}

        {/* Coming Soon Mode */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-white font-bold">Coming Soon Mode</h2>
            <p className="text-gray-400 text-sm mt-1">When ON, all visitors see the coming soon page instead of the app.</p>
          </div>
          <div className="px-6">
            <Toggle
              label="Coming Soon Mode"
              desc="Admins and logged-in members can still access /admin and /login."
              value={settings.coming_soon_mode === "true"}
              onChange={v => set("coming_soon_mode")(String(v))}
            />
          </div>
        </div>

        {/* Coming Soon Content */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-white font-bold">Coming Soon Page Content</h2>
          </div>
          <div className="p-6 space-y-5">
            <Field
              label="Headline"
              value={settings.coming_soon_headline}
              onChange={set("coming_soon_headline")}
              placeholder="Built for marriage. Not just matches."
            />
            <Field
              label="Subtext"
              value={settings.coming_soon_subtext}
              onChange={set("coming_soon_subtext")}
              multiline
              placeholder="Launching soon — a curated platform for Africans..."
            />
            <Field
              label="Exclusivity Line"
              value={settings.coming_soon_exclusivity}
              onChange={set("coming_soon_exclusivity")}
              placeholder="We are onboarding a limited number of serious members. Be first."
            />
            <Field
              label="Button Text"
              value={settings.coming_soon_button_text}
              onChange={set("coming_soon_button_text")}
              placeholder="Request early access"
            />
            <Field
              label="After-Submit Message"
              value={settings.coming_soon_success_message}
              onChange={set("coming_soon_success_message")}
              placeholder="You're on the list. We'll be in touch soon."
            />
          </div>
        </div>

        {/* Match Limits */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-white font-bold">Match Limits</h2>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Free Tier Daily Match Limit</label>
            <input
              type="number" min={1} max={100}
              value={settings.free_tier_daily_limit}
              onChange={e => set("free_tier_daily_limit")(e.target.value)}
              className="w-32 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-gray-500 text-xs mt-2">Core and Badge tiers have unlimited matches.</p>
          </div>
        </div>

        {/* Announcement Banner */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-white font-bold">Announcement Banner</h2>
          </div>
          <div className="p-6">
            <textarea
              value={settings.announcement_banner}
              onChange={e => set("announcement_banner")(e.target.value)}
              rows={3}
              placeholder="Leave empty to hide. e.g. 'We are currently experiencing high demand — thank you for your patience.'"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <p className="text-gray-500 text-xs mt-2">Shown at the top for all users when non-empty.</p>
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

        {/* Subscription Pricing */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-white font-bold">Subscription Pricing</h2>
              <p className="text-gray-400 text-sm mt-0.5">Edit display prices and features shown to users on the Premium page.</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Core tier */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 mb-4">Core Tier</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Tier Name" value={settings.core_name} onChange={set("core_name")} placeholder="Core" />
                <Field label="Price (number)" value={settings.core_price} onChange={v => { set("core_price")(v); set("core_price_label")(`$${v}/month`); }} placeholder="12.99" />
              </div>
              <Field label="Price Label (display)" value={settings.core_price_label} onChange={set("core_price_label")} placeholder="$12.99/month" />
              <div className="mt-4">
                <Field
                  label='Features (JSON array, e.g. ["Feature 1","Feature 2"])'
                  value={settings.core_features}
                  onChange={set("core_features")}
                  multiline
                  placeholder='["Unlimited profiles","See who liked you"]'
                />
              </div>
            </div>

            <div className="border-t border-gray-800" />

            {/* Serious Badge tier */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 mb-4">Serious Badge Tier</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Tier Name" value={settings.serious_name} onChange={set("serious_name")} placeholder="Serious Badge" />
                <Field label="Price (number)" value={settings.serious_price} onChange={v => { set("serious_price")(v); set("serious_price_label")(`$${v}/month`); }} placeholder="19.99" />
              </div>
              <Field label="Price Label (display)" value={settings.serious_price_label} onChange={set("serious_price_label")} placeholder="$19.99/month" />
              <div className="mt-4">
                <Field
                  label='Features (JSON array, e.g. ["Feature 1","Feature 2"])'
                  value={settings.serious_features}
                  onChange={set("serious_features")}
                  multiline
                  placeholder='["Everything in Core","Serious Badge on your profile"]'
                />
              </div>
            </div>

            {/* Stripe note */}
            <div className="flex items-start gap-3 bg-gray-800/50 border border-gray-700 rounded-xl p-4 mt-2">
              <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-gray-400 text-xs leading-relaxed">
                <strong className="text-gray-300">Note:</strong> To change actual billing amounts, update the Stripe price IDs in Railway environment variables (<code className="text-amber-400">STRIPE_CORE_PRICE_ID</code> and <code className="text-amber-400">STRIPE_BADGE_PRICE_ID</code>). Create new prices in your Stripe Dashboard at $12.99/month (Core) and $19.99/month (Serious Badge), then update the env vars accordingly.
              </p>
            </div>
          </div>
        </div>

        {/* Early Access Emails */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold">Early Access Emails</h2>
              <p className="text-gray-400 text-sm mt-0.5">{emails.length} email{emails.length !== 1 ? "s" : ""} collected</p>
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors border border-gray-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
            {emails.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No early access requests yet.</p>
              </div>
            ) : (
              emails.map(row => (
                <div key={row.id} className="px-6 py-3 flex items-center justify-between group">
                  <span className="text-white text-sm">{row.email}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs">
                      {new Date(row.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() => setConfirmDelete({ id: row.id, email: row.email })}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Remove from waitlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-bold text-base mb-2">Remove from waitlist?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Remove <span className="text-white font-medium">{confirmDelete.email}</span> from the waitlist?{" "}
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEarlyAccess(confirmDelete.id)}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
