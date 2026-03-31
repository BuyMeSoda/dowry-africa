import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { API_BASE } from "@/lib/api-url";
import { SeriousBadgeIcon } from "@/components/ui/SeriousBadgeIcon";
import { CustomChipSelect } from "@/components/ui/CustomChipSelect";
import { Edit3, LogOut, X, Save, Loader2, Heart, MapPin, Users, Camera, ShieldOff, Shield } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { useToast } from "@/hooks/use-toast";
import { COUNTRY_GROUPS, ALL_COUNTRIES } from "@/lib/country-options";
import { formatIntentLabel } from "@/lib/format-tags";
import { useGetBlockedUsers, useUnblockUser } from "@workspace/api-client-react";

// ── Faith preference presets ─────────────────────────────────────────────────
const FAITH_PREF_PRESETS = [
  "Christian", "Muslim", "Traditional African", "No preference", "Prefer not to say",
];

// Faith options for profile faith field
const FAITH_PROFILE_OPTIONS = [
  "Christianity", "Islam", "Traditional", "Spiritual but not religious", "Any / Open", "Other",
];

const GENDER_OPTIONS = [
  { value: "man", label: "Men" },
  { value: "woman", label: "Women" },
  { value: "any", label: "Any" },
];
const CHILDREN_OPTIONS = [
  { value: "yes", label: "Wants children" },
  { value: "no", label: "Doesn't want children" },
  { value: "open", label: "Open to children" },
];
const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1_year", label: "Within 1 year" },
  { value: "2_years", label: "Within 2 years" },
  { value: "5_years", label: "Within 5 years" },
  { value: "not_sure", label: "Not sure yet" },
];

function formatValue(val: string | undefined, map?: Record<string, string>) {
  if (!val) return "—";
  if (map) return map[val] ?? val;
  return val.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function PrefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-sm text-right max-w-[60%]">{value || "—"}</span>
    </div>
  );
}

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const [showPrefEdit, setShowPrefEdit] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const { uploading, progress, triggerPicker, inputRef, upload } = usePhotoUpload();
  const { data: blockedData, refetch: refetchBlocked } = useGetBlockedUsers();
  const unblockMutation = useUnblockUser();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const [prefForm, setPrefForm] = useState({
    genderPref: user?.genderPref ?? "any",
    minAge: user?.minAge ?? 24,
    maxAge: user?.maxAge ?? 45,
    preferredFaiths: (user as any)?.preferredFaiths ?? [] as string[],
    preferredCountry: user?.preferredCountry ?? "",
    preferredHeritage: (user as any)?.preferredHeritage ?? [] as string[],
    childrenPref: user?.childrenPref ?? "open",
    relocationOpen: user?.relocationOpen ?? false,
    marriageTimeline: user?.marriageTimeline ?? "",
  });

  const [profileForm, setProfileForm] = useState({
    bio: user?.bio ?? "",
    quote: user?.quote ?? "",
    city: user?.city ?? "",
    country: user?.country ?? "",
    faith: user?.faith ?? "",
    heritage: user?.heritage ?? [] as string[],
    languages: user?.languages ?? [] as string[],
    lifeStage: user?.lifeStage ?? "",
    intent: user?.intent ?? "marriage_ready",
    familyInvolvement: user?.familyInvolvement ?? "",
  });

  if (!user) return null;

  const token = localStorage.getItem("da_token");

  async function savePrefs() {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(prefForm),
      });
      if (!res.ok) throw new Error("Save failed");
      refreshUser();
      toast({ title: "Preferences saved", description: "Your match criteria have been updated." });
      setShowPrefEdit(false);
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) throw new Error("Save failed");
      refreshUser();
      toast({ title: "Profile saved", description: "Your profile has been updated." });
      setShowProfileEdit(false);
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const preferredHeritage = (user as any)?.preferredHeritage as string[] | undefined;
  const preferredFaiths = (user as any)?.preferredFaiths as string[] | undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 md:px-8 pt-8 pb-24 md:py-12 max-w-4xl space-y-6">

        {/* Main profile card */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-border overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-primary/20 to-secondary/40 relative">
            {user.hasBadge && (
              <div className="absolute top-6 right-6 flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-amber-200/60 px-4 py-2.5 rounded-2xl shadow-lg shadow-amber-100/40">
                <SeriousBadgeIcon size={36} />
                <div>
                  <p className="font-bold text-sm text-amber-900">Serious Badge</p>
                  <p className="text-xs text-amber-700/70 font-medium">Verified Member</p>
                </div>
              </div>
            )}
          </div>

          <div className="px-8 pb-12 relative">
            <div className="flex justify-between items-end mb-8">
              {/* Clickable profile photo with camera overlay */}
              <button
                type="button"
                onClick={triggerPicker}
                disabled={uploading}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-secondary -mt-16 overflow-hidden relative z-10 group focus:outline-none cursor-pointer"
                title="Change profile photo"
              >
                <UserAvatar
                  name={user.name}
                  photoUrl={localPhotoUrl ?? user.photoUrl}
                  className="w-full h-full"
                  textClassName="text-5xl font-bold"
                />
                {uploading ? (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <Loader2 className="w-7 h-7 text-white animate-spin mb-1" />
                    <span className="text-white text-xs font-semibold">{progress}%</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const previewUrl = URL.createObjectURL(file);
                  setLocalPhotoUrl(previewUrl);
                  const uploaded = await upload(file);
                  if (!uploaded) {
                    setLocalPhotoUrl(null);
                    toast({ variant: "destructive", title: "Upload failed", description: "Please try again." });
                  }
                  e.target.value = "";
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowProfileEdit(true)}
                  className="px-5 py-2.5 bg-secondary text-foreground rounded-full font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
                <button
                  onClick={logout}
                  className="px-5 py-2.5 border border-border text-muted-foreground rounded-full font-medium flex items-center gap-2 hover:text-destructive hover:border-destructive transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-display font-bold mb-1">{user.name}, {user.age}</h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2 flex-wrap">
                {user.city && user.country && <span>{user.city}, {user.country}</span>}
                {user.city && <span className="w-1.5 h-1.5 rounded-full bg-border inline-block" />}
                <span>{formatIntentLabel(user.intent)}</span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mt-12">
              <div>
                <h3 className="text-xl font-display font-bold mb-4 border-b border-border pb-2">About Me</h3>
                <p className="text-foreground/80 leading-relaxed mb-6">{user.bio || "No bio added yet."}</p>
                {user.quote && (
                  <blockquote className="border-l-2 border-primary pl-4 italic text-lg text-foreground/90 font-display">
                    "{user.quote}"
                  </blockquote>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-display font-bold mb-3 border-b border-border pb-2">Background</h3>
                  <PrefRow label="Country of origin" value={user.heritage?.join(", ") || "—"} />
                  <PrefRow label="Faith" value={user.faith || "—"} />
                  <PrefRow label="Languages" value={user.languages?.join(", ") || "—"} />
                </div>

                <div>
                  <h3 className="text-xl font-display font-bold mb-3 border-b border-border pb-2">Life & Future</h3>
                  <PrefRow label="Life Stage" value={formatValue(user.lifeStage)} />
                  <PrefRow label="Marriage Timeline" value={formatValue(user.marriageTimeline)} />
                  <PrefRow label="Children" value={formatValue(user.childrenPref)} />
                  <PrefRow label="Family Involvement" value={formatValue(user.familyInvolvement)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Preferences card */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-border overflow-hidden">
          <div className="px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Looking For</h2>
                  <p className="text-sm text-muted-foreground">Your match criteria — only used for recommendations</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPrefForm({
                    genderPref: user?.genderPref ?? "any",
                    minAge: user?.minAge ?? 24,
                    maxAge: user?.maxAge ?? 45,
                    preferredFaiths: (user as any)?.preferredFaiths ?? [],
                    preferredCountry: (user as any)?.preferredCountry ?? "",
                    preferredHeritage: (user as any)?.preferredHeritage ?? [],
                    childrenPref: user?.childrenPref ?? "open",
                    relocationOpen: user?.relocationOpen ?? false,
                    marriageTimeline: user?.marriageTimeline ?? "",
                  });
                  setShowPrefEdit(true);
                }}
                className="px-5 py-2.5 bg-secondary text-foreground rounded-full font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors"
              >
                <Edit3 className="w-4 h-4" /> Edit Preferences
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Who */}
              <div className="bg-secondary/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Who</h4>
                </div>
                <PrefRow label="Gender" value={
                  user.genderPref === "man" ? "Men" :
                  user.genderPref === "woman" ? "Women" :
                  "Any"
                } />
                <PrefRow label="Age range" value={
                  user.minAge && user.maxAge ? `${user.minAge} – ${user.maxAge} yrs` :
                  user.minAge ? `${user.minAge}+ yrs` : "Any age"
                } />
                <PrefRow label="Country preference" value={preferredHeritage?.length ? preferredHeritage.join(", ") : "Open to all"} />
              </div>

              {/* Values */}
              <div className="bg-secondary/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Values</h4>
                </div>
                <PrefRow label="Faith preference" value={
                  preferredFaiths?.length ? preferredFaiths.join(", ") :
                  (user as any)?.preferredFaith || "Any / Open"
                } />
                <PrefRow label="Children" value={formatValue(user.childrenPref)} />
                <PrefRow label="Timeline" value={formatValue(user.marriageTimeline)} />
              </div>

              {/* Location */}
              <div className="bg-secondary/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Location</h4>
                </div>
                <PrefRow label="Preferred country" value={(user as any)?.preferredCountry || "Anywhere"} />
                <PrefRow label="Open to relocate" value={user.relocationOpen ? "Yes" : "No"} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Privacy & Safety card ──────────────────────────────────────────── */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-border overflow-hidden">
          <div className="px-8 py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">Privacy &amp; Safety</h2>
                <p className="text-sm text-muted-foreground">Accounts you've blocked</p>
              </div>
            </div>

            {!blockedData?.blocked?.length ? (
              <p className="text-sm text-muted-foreground py-2">You haven't blocked anyone.</p>
            ) : (
              <div className="space-y-3">
                {blockedData.blocked.map((blocked: any) => (
                  <div key={blocked.id} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                    <UserAvatar name={blocked.name} photoUrl={blocked.photoUrl} size={44} className="rounded-full shrink-0" textClassName="text-sm font-bold" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{blocked.name}</p>
                      {blocked.city && <p className="text-xs text-muted-foreground">{[blocked.city, blocked.country].filter(Boolean).join(", ")}</p>}
                    </div>
                    <button
                      disabled={unblockingId === blocked.id}
                      onClick={() => {
                        setUnblockingId(blocked.id);
                        unblockMutation.mutate(blocked.id, {
                          onSuccess: () => { refetchBlocked(); setUnblockingId(null); toast({ title: `${blocked.name} unblocked` }); },
                          onError: () => { setUnblockingId(null); toast({ variant: "destructive", title: "Could not unblock" }); },
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-full hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      {unblockingId === blocked.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Partner Preferences Edit Modal ─────────────────────────────────── */}
      {showPrefEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="text-xl font-display font-bold">Partner Preferences</h2>
              <button onClick={() => setShowPrefEdit(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Gender */}
              <div>
                <label className="block font-semibold mb-3">I'm looking for</label>
                <div className="flex gap-3">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPrefForm(f => ({ ...f, genderPref: opt.value }))}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${prefForm.genderPref === opt.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age range — structured, no custom */}
              <div>
                <label className="block font-semibold mb-3">Age range</label>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1.5">Min age</label>
                    <input
                      type="number"
                      min={18} max={70}
                      value={prefForm.minAge}
                      onChange={e => setPrefForm(f => ({ ...f, minAge: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">–</span>
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1.5">Max age</label>
                    <input
                      type="number"
                      min={18} max={70}
                      value={prefForm.maxAge}
                      onChange={e => setPrefForm(f => ({ ...f, maxAge: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Country preference — grouped chips + custom */}
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <label className="block font-semibold">Country preference</label>
                  <span className="text-xs text-muted-foreground">Select all that apply</span>
                </div>
                <CustomChipSelect
                  selected={prefForm.preferredHeritage}
                  onChange={v => setPrefForm(f => ({ ...f, preferredHeritage: v }))}
                  groups={COUNTRY_GROUPS}
                  fieldType="heritage"
                  multiSelect
                  allowCustom
                  customPlaceholder="e.g. Congolese, Cape Verdean..."
                />
              </div>

              {/* Faith preference — multi-select chips + custom */}
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <label className="block font-semibold">Faith preference</label>
                  <span className="text-xs text-muted-foreground">Select all that apply</span>
                </div>
                <CustomChipSelect
                  selected={prefForm.preferredFaiths}
                  onChange={v => setPrefForm(f => ({ ...f, preferredFaiths: v }))}
                  presets={FAITH_PREF_PRESETS}
                  fieldType="faith"
                  multiSelect
                  allowCustom
                  customPlaceholder="e.g. Anglican, Sunni, Pentecostal..."
                />
              </div>

              {/* Children — structured, no custom */}
              <div>
                <label className="block font-semibold mb-3">Children preference</label>
                <div className="space-y-2">
                  {CHILDREN_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPrefForm(f => ({ ...f, childrenPref: opt.value }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${prefForm.childrenPref === opt.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="block font-semibold mb-3">Marriage timeline</label>
                <select
                  value={prefForm.marriageTimeline}
                  onChange={e => setPrefForm(f => ({ ...f, marriageTimeline: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Any timeline</option>
                  {TIMELINE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="block font-semibold mb-2">Preferred country / region</label>
                <input
                  type="text"
                  value={prefForm.preferredCountry}
                  onChange={e => setPrefForm(f => ({ ...f, preferredCountry: e.target.value }))}
                  placeholder="e.g. Nigeria, UK, anywhere"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Relocation */}
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                <div>
                  <p className="font-semibold">Open to long-distance / relocation?</p>
                  <p className="text-sm text-muted-foreground">Match with people in other cities/countries</p>
                </div>
                <button
                  onClick={() => setPrefForm(f => ({ ...f, relocationOpen: !f.relocationOpen }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${prefForm.relocationOpen ? "bg-primary" : "bg-border"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${prefForm.relocationOpen ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowPrefEdit(false)} className="flex-1 py-3 border border-border rounded-2xl font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button onClick={savePrefs} disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-2xl font-medium shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Edit Modal ──────────────────────────────────────────────── */}
      {showProfileEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="text-xl font-display font-bold">Edit Profile</h2>
              <button onClick={() => setShowProfileEdit(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Photo upload section */}
              <div className="flex flex-col items-center gap-3 pb-4 border-b border-border">
                <button
                  type="button"
                  onClick={triggerPicker}
                  disabled={uploading}
                  className="w-24 h-24 rounded-full overflow-hidden relative group focus:outline-none cursor-pointer border-4 border-border shadow-md"
                  title="Change photo"
                >
                  <UserAvatar
                    name={user.name}
                    photoUrl={localPhotoUrl ?? user.photoUrl}
                    className="w-full h-full"
                    textClassName="text-3xl font-bold"
                  />
                  {uploading ? (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={triggerPicker}
                  disabled={uploading}
                  className="text-sm text-primary font-semibold hover:underline"
                >
                  {uploading ? `Uploading… ${progress}%` : "Change photo"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">City</label>
                  <input type="text" value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} placeholder="Lagos" className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Country</label>
                  <input type="text" value={profileForm.country} onChange={e => setProfileForm(f => ({ ...f, country: e.target.value }))} placeholder="Nigeria" className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Faith</label>
                <select value={profileForm.faith} onChange={e => setProfileForm(f => ({ ...f, faith: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary">
                  <option value="">Select faith</option>
                  {FAITH_PROFILE_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Country of origin</label>
                <CustomChipSelect
                  selected={profileForm.heritage}
                  onChange={v => setProfileForm(f => ({ ...f, heritage: v }))}
                  presets={ALL_COUNTRIES}
                  fieldType="heritage"
                  multiSelect
                  allowCustom
                  customPlaceholder="e.g. Congolese, Cape Verdean..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Intent</label>
                <select value={profileForm.intent} onChange={e => setProfileForm(f => ({ ...f, intent: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary">
                  <option value="marriage_ready">Marriage Ready</option>
                  <option value="serious_relationship">Serious Relationship</option>
                  <option value="friendship_first">Friendship First</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Bio</label>
                <textarea value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} rows={4} className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary resize-none" placeholder="Tell potential matches about yourself..." />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Personal Quote</label>
                <input type="text" value={profileForm.quote} onChange={e => setProfileForm(f => ({ ...f, quote: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary font-display italic" placeholder='"Family is everything to me"' />
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowProfileEdit(false)} className="flex-1 py-3 border border-border rounded-2xl font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button onClick={saveProfile} disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-2xl font-medium shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
