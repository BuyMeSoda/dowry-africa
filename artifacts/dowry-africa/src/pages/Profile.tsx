import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Edit3, LogOut, X, Save, Loader2, Heart, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FAITH_OPTIONS = ["Christianity", "Islam", "Traditional", "Spiritual but not religious", "Any / Open", "Other"];
const HERITAGE_OPTIONS = ["Igbo", "Yoruba", "Akan", "Zulu", "Kikuyu", "Hausa", "Amhara", "Shona", "Oromo", "Swahili", "Any", "Other"];
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

  const [prefForm, setPrefForm] = useState({
    genderPref: user?.genderPref ?? "any",
    minAge: user?.minAge ?? 24,
    maxAge: user?.maxAge ?? 45,
    preferredFaith: user?.preferredFaith ?? "",
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
      const res = await fetch("/api/users/me/profile", {
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
      const res = await fetch("/api/users/me/profile", {
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

  function toggleHeritage(h: string, form: string[], setForm: (v: string[]) => void) {
    setForm(form.includes(h) ? form.filter(x => x !== h) : [...form, h]);
  }

  const preferredHeritage = (user as any)?.preferredHeritage as string[] | undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 md:px-8 py-12 max-w-4xl space-y-6">

        {/* Main profile card */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-border overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-primary/20 to-secondary/40 relative">
            {user.hasBadge && (
              <div className="absolute top-6 right-6 bg-white p-3 rounded-2xl shadow-lg flex items-center gap-3">
                <img src={`${import.meta.env.BASE_URL}images/trust-badge.png`} alt="Verified" className="w-10 h-10" />
                <div>
                  <p className="font-bold text-sm">Serious Badge</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            )}
          </div>

          <div className="px-8 pb-12 relative">
            <div className="flex justify-between items-end mb-8">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-secondary -mt-16 overflow-hidden relative z-10">
                <img src={user.photoUrl || "https://images.unsplash.com/photo-1531123897727-8f129e1bfd8c?w=400&q=80"} className="w-full h-full object-cover" />
              </div>
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
                <span>{formatValue(user.intent)}</span>
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
                  <PrefRow label="Heritage" value={user.heritage?.join(", ") || "—"} />
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
                    preferredFaith: (user as any)?.preferredFaith ?? "",
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
                <PrefRow label="Age Range" value={
                  user.minAge && user.maxAge ? `${user.minAge} – ${user.maxAge} yrs` :
                  user.minAge ? `${user.minAge}+ yrs` : "Any age"
                } />
                <PrefRow label="Heritage" value={preferredHeritage?.length ? preferredHeritage.join(", ") : "Any"} />
              </div>

              {/* Values */}
              <div className="bg-secondary/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Values</h4>
                </div>
                <PrefRow label="Faith" value={(user as any)?.preferredFaith || "Any / Open"} />
                <PrefRow label="Children" value={formatValue(user.childrenPref)} />
                <PrefRow label="Timeline" value={formatValue(user.marriageTimeline)} />
              </div>

              {/* Location */}
              <div className="bg-secondary/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Location</h4>
                </div>
                <PrefRow label="Preferred Country" value={(user as any)?.preferredCountry || "Anywhere"} />
                <PrefRow label="Open to Relocate" value={user.relocationOpen ? "Yes" : "No"} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Partner Preferences Edit Modal */}
      {showPrefEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="text-xl font-display font-bold">Partner Preferences</h2>
              <button onClick={() => setShowPrefEdit(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
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

              {/* Age range */}
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

              {/* Heritage */}
              <div>
                <label className="block font-semibold mb-3">Preferred heritage <span className="font-normal text-muted-foreground text-sm">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {HERITAGE_OPTIONS.map(h => (
                    <button
                      key={h}
                      onClick={() => toggleHeritage(h, prefForm.preferredHeritage, v => setPrefForm(f => ({ ...f, preferredHeritage: v })))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${prefForm.preferredHeritage.includes(h) ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/40"}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Faith */}
              <div>
                <label className="block font-semibold mb-3">Preferred faith</label>
                <div className="flex flex-wrap gap-2">
                  {FAITH_OPTIONS.map(f => (
                    <button
                      key={f}
                      onClick={() => setPrefForm(p => ({ ...p, preferredFaith: p.preferredFaith === f ? "" : f }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${prefForm.preferredFaith === f ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/40"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Children */}
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

              {/* Location */}
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

      {/* Profile Edit Modal */}
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
                  {FAITH_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Heritage</label>
                <div className="flex flex-wrap gap-2">
                  {HERITAGE_OPTIONS.filter(h => h !== "Any").map(h => (
                    <button
                      key={h}
                      onClick={() => toggleHeritage(h, profileForm.heritage, v => setProfileForm(f => ({ ...f, heritage: v })))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${profileForm.heritage.includes(h) ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/40"}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
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
