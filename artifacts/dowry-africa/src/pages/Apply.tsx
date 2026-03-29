import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { API_BASE } from "@/lib/api-url";
import { ChevronRight, ChevronLeft, Check, Share2, Copy } from "lucide-react";
import { SeriousBadgeIcon } from "@/components/ui/SeriousBadgeIcon";

const AFRICAN_COUNTRIES = [
  "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cabo Verde","Cameroon",
  "Central African Republic","Chad","Comoros","Congo","Democratic Republic of Congo","Djibouti",
  "Egypt","Equatorial Guinea","Eritrea","Eswatini","Ethiopia","Gabon","Gambia","Ghana","Guinea",
  "Guinea-Bissau","Ivory Coast","Kenya","Lesotho","Liberia","Libya","Madagascar","Malawi","Mali",
  "Mauritania","Mauritius","Morocco","Mozambique","Namibia","Niger","Nigeria","Rwanda",
  "São Tomé and Príncipe","Senegal","Sierra Leone","Somalia","South Africa","South Sudan","Sudan",
  "Tanzania","Togo","Tunisia","Uganda","Zambia","Zimbabwe",
];
const DIASPORA_COUNTRIES = [
  "United Kingdom","United States","Canada","Australia","Germany","France","Netherlands",
  "Belgium","Italy","Spain","Sweden","Norway","Denmark","Switzerland","Ireland",
  "New Zealand","Other",
];
const ALL_COUNTRIES = [...AFRICAN_COUNTRIES, ...DIASPORA_COUNTRIES];

const FAITH_OPTIONS = ["Christianity","Islam","Traditional African religion","Spiritual but not religious","Agnostic / Atheist","Other","Prefer not to say"];
const REFERRAL_OPTIONS = ["Instagram","TikTok","Twitter / X","Friend referral","Google","Other"];

interface FormData {
  fullName: string; age: string; city: string; country: string; email: string;
  intention: string; timeline: string;
  willingProfile: boolean | null; willingVerify: boolean | null; willingRespect: boolean | null;
  faith: string; openToDistance: string; heritage: string; diasporaPreference: string;
  whyJoining: string; referralSource: string; referralCode: string;
}

const EMPTY: FormData = {
  fullName: "", age: "", city: "", country: "", email: "",
  intention: "", timeline: "",
  willingProfile: null, willingVerify: null, willingRespect: null,
  faith: "", openToDistance: "", heritage: "", diasporaPreference: "",
  whyJoining: "", referralSource: "", referralCode: "",
};

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${i < step ? "bg-primary" : i === step - 1 ? "bg-primary" : "bg-border"}`} />
      ))}
      <span className="text-sm text-muted-foreground ml-2">{step} of {total}</span>
    </div>
  );
}

function RadioCard({ label, desc, selected, onClick }: { label: string; desc?: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
      <p className={`font-semibold ${selected ? "text-primary" : "text-foreground"}`}>{label}</p>
      {desc && <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>}
    </button>
  );
}

function YesNoCard({ label, value, selected, onClick }: { label: string; value: boolean; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${selected ? (value ? "border-green-500 bg-green-50 text-green-700" : "border-red-400 bg-red-50 text-red-700") : "border-border hover:border-primary/40 text-foreground"}`}>
      {value ? "Yes" : "No"}
    </button>
  );
}

export default function Apply() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [copied, setCopied] = useState(false);

  const set = (field: keyof FormData, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const validateStep = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 1) {
      if (!form.fullName.trim()) e.fullName = "Required";
      if (!form.age || Number(form.age) < 21) e.age = "Must be 21 or older";
      if (!form.city.trim()) e.city = "Required";
      if (!form.country) e.country = "Required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    }
    if (step === 2) {
      if (!form.intention) e.intention = "Required";
      if (!form.timeline) e.timeline = "Required";
    }
    if (step === 3) {
      if (form.willingProfile === null) e.willingProfile = "Required";
      if (form.willingVerify === null) e.willingVerify = "Required";
      if (form.willingRespect === null) e.willingRespect = "Required";
    }
    if (step === 5) {
      if (form.whyJoining.trim().length < 50) e.whyJoining = "Please write at least 50 characters";
      if (!form.referralSource) e.referralSource = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, 5)); };
  const back = () => setStep(s => Math.max(s - 1, 1));

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API_BASE}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          willingProfile: form.willingProfile ?? false,
          willingVerify: form.willingVerify ?? false,
          willingRespect: form.willingRespect ?? false,
          openToDistance: form.openToDistance === "yes" ? true : form.openToDistance === "no" ? false : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error ?? "Something went wrong. Please try again."); return; }
      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl = window.location.origin + "/apply";
  const copyLink = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Join me on Dowry.Africa — a serious matchmaking platform for marriage-minded Africans. Apply here: ${shareUrl}`)}`);
  const shareTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just applied to Dowry.Africa — a serious matchmaking platform built for marriage. Apply here:`)}&url=${encodeURIComponent(shareUrl)}`);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-200 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">You're on the waitlist.</h1>
          <p className="text-muted-foreground text-lg mb-2">We review every application personally.</p>
          <p className="text-muted-foreground mb-10">You'll be notified within 7 days.</p>

          <div className="bg-secondary rounded-2xl p-6 mb-8">
            <p className="font-semibold text-foreground mb-4">Invite 2 serious friends to move up the list</p>
            <div className="flex flex-col gap-3">
              <button onClick={shareWhatsApp}
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition-colors">
                <Share2 className="w-4 h-4" /> Share on WhatsApp
              </button>
              <button onClick={shareTwitter}
                className="flex items-center justify-center gap-2 w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold text-sm transition-colors">
                <Share2 className="w-4 h-4" /> Share on X (Twitter)
              </button>
              <button onClick={copyLink}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-border hover:bg-secondary text-foreground rounded-xl font-semibold text-sm transition-colors">
                <Copy className="w-4 h-4" /> {copied ? "Copied!" : "Copy invite link"}
              </button>
            </div>
          </div>
          <Link href="/" className="text-primary hover:underline text-sm">← Back to homepage</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <SeriousBadgeIcon size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Apply for Membership</h1>
          <p className="text-muted-foreground mt-2">We review every application personally.</p>
        </div>

        <StepIndicator step={step} total={5} />

        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground mb-1">About You</h2>
              <p className="text-muted-foreground text-sm">Let's start with the basics.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name *</label>
              <input value={form.fullName} onChange={e => set("fullName", e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background ${errors.fullName ? "border-red-400" : "border-border"}`}
                placeholder="Your full name" />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Age *</label>
              <input type="number" min={21} max={80} value={form.age} onChange={e => set("age", e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background ${errors.age ? "border-red-400" : "border-border"}`}
                placeholder="Must be 21 or older" />
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">City *</label>
                <input value={form.city} onChange={e => set("city", e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background ${errors.city ? "border-red-400" : "border-border"}`}
                  placeholder="Your city" />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Country *</label>
                <select value={form.country} onChange={e => set("country", e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background ${errors.country ? "border-red-400" : "border-border"}`}>
                  <option value="">Select country</option>
                  <optgroup label="African Countries">{AFRICAN_COUNTRIES.map(c => <option key={c}>{c}</option>)}</optgroup>
                  <optgroup label="Diaspora">{DIASPORA_COUNTRIES.map(c => <option key={c}>{c}</option>)}</optgroup>
                </select>
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background ${errors.email ? "border-red-400" : "border-border"}`}
                placeholder="your@email.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Intention */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground mb-1">Your Intention</h2>
              <p className="text-muted-foreground text-sm">We need to understand where you are in your journey.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-3">What are you looking for? *</p>
              <div className="space-y-3">
                <RadioCard label="Marriage — I am ready to commit" desc="I'm looking for a life partner and I'm ready to take that step." selected={form.intention === "marriage_ready"} onClick={() => set("intention", "marriage_ready")} />
                <RadioCard label="Serious relationship leading to marriage" desc="I want to build something real that leads to marriage." selected={form.intention === "serious_relationship"} onClick={() => set("intention", "serious_relationship")} />
              </div>
              {errors.intention && <p className="text-red-500 text-xs mt-1">{errors.intention}</p>}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Timeline *</p>
              <div className="space-y-3">
                {[
                  { value: "asap", label: "I am ready now", desc: "Actively looking and ready to commit." },
                  { value: "6_12_months", label: "Within 6–12 months", desc: "Getting ready and open to the right person." },
                  { value: "1_2_years", label: "Within 1–2 years", desc: "Planning ahead with a clear horizon." },
                ].map(o => (
                  <RadioCard key={o.value} label={o.label} desc={o.desc} selected={form.timeline === o.value} onClick={() => set("timeline", o.value)} />
                ))}
              </div>
              {errors.timeline && <p className="text-red-500 text-xs mt-1">{errors.timeline}</p>}
            </div>
          </div>
        )}

        {/* Step 3: Commitment check */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground mb-1">Commitment Check</h2>
              <p className="text-muted-foreground text-sm">This is how we keep the platform serious and intentional.</p>
            </div>
            {[
              { field: "willingProfile" as const, q: "Are you willing to complete a full verified profile?" },
              { field: "willingVerify" as const, q: "Are you willing to verify your identity?" },
              { field: "willingRespect" as const, q: "Do you commit to engaging respectfully with all members?" },
            ].map(({ field, q }) => (
              <div key={field}>
                <p className="text-sm font-medium text-foreground mb-3">{q} *</p>
                <div className="flex gap-3">
                  <YesNoCard label="Yes" value={true} selected={form[field] === true} onClick={() => set(field, true)} />
                  <YesNoCard label="No" value={false} selected={form[field] === false} onClick={() => set(field, false)} />
                </div>
                {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
              </div>
            ))}
            {(form.willingProfile === false || form.willingVerify === false || form.willingRespect === false) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-amber-800 text-sm font-medium">Heads up</p>
                <p className="text-amber-700 text-sm mt-1">Answering "No" to any of these will lower your application priority. We still encourage you to apply.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Background (optional) */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground mb-1">Background</h2>
              <p className="text-muted-foreground text-sm">Optional — helps us match you better.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Faith / Religion</label>
              <select value={form.faith} onChange={e => set("faith", e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background">
                <option value="">Prefer not to say</option>
                {FAITH_OPTIONS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Heritage / Ethnicity</label>
              <input value={form.heritage} onChange={e => set("heritage", e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="e.g. Igbo, Yoruba, Ghanaian, Somali..." />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Open to long distance?</p>
              <div className="flex gap-3">
                {["yes", "no", "maybe"].map(v => (
                  <button key={v} type="button" onClick={() => set("openToDistance", v)}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${form.openToDistance === v ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40 text-foreground"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Diaspora preference</label>
              <select value={form.diasporaPreference} onChange={e => set("diasporaPreference", e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background">
                <option value="">No preference</option>
                <option>Must be diaspora</option>
                <option>Must be Africa-based</option>
                <option>Open to both</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 5: Seriousness filter */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground mb-1">Tell Us About Yourself</h2>
              <p className="text-muted-foreground text-sm">This is the most important part of your application.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Why are you interested in joining Dowry.Africa? *</label>
              <textarea value={form.whyJoining} onChange={e => set("whyJoining", e.target.value)}
                rows={5} minLength={50} placeholder="Tell us about your values, what you're looking for, and why you want to join this platform. Be honest and specific — this is your application. (min 50 characters)"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none ${errors.whyJoining ? "border-red-400" : "border-border"}`} />
              <div className="flex items-center justify-between mt-1">
                {errors.whyJoining ? <p className="text-red-500 text-xs">{errors.whyJoining}</p> : <span />}
                <p className={`text-xs ${form.whyJoining.length < 50 ? "text-muted-foreground" : "text-green-600"}`}>{form.whyJoining.length} / 50 min</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">How did you hear about us? *</label>
              <select value={form.referralSource} onChange={e => set("referralSource", e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background ${errors.referralSource ? "border-red-400" : "border-border"}`}>
                <option value="">Select...</option>
                {REFERRAL_OPTIONS.map(r => <option key={r}>{r}</option>)}
              </select>
              {errors.referralSource && <p className="text-red-500 text-xs mt-1">{errors.referralSource}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Referral code <span className="text-muted-foreground">(optional)</span></label>
              <input value={form.referralCode} onChange={e => set("referralCode", e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="Enter a referral code if you have one" />
            </div>
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-700 text-sm">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          {step > 1 ? (
            <button onClick={back} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          {step < 5 ? (
            <button onClick={next}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:opacity-90 transition-opacity">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
