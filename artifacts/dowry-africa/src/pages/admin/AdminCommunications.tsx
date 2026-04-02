import { useEffect, useRef, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import {
  Send, Radio, History, ChevronDown, Loader2, CheckCircle2, XCircle,
  ExternalLink, BookTemplate, Save, Eye, Trash2, FileText, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecipientGroup = "waitlist" | "all_users" | "free_users" | "core_users" | "badge_users" | "everyone";

interface EmailTemplate { id: string; name: string; subject: string; body: string; ctaLabel?: string | null; ctaUrl?: string | null; }
interface BroadcastLog  { id: string; subject: string; body: string; recipientGroup: string; recipientCount: number; sentCount: number; failedCount: number; status: string; ctaLabel: string | null; ctaUrl: string | null; createdAt: string; }

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUP_LABELS: Record<RecipientGroup, string> = {
  waitlist:    "All waitlist emails",
  all_users:   "All registered users",
  free_users:  "Registered users — Free tier only",
  core_users:  "Registered users — Core tier only",
  badge_users: "Registered users — Serious Badge only",
  everyone:    "Everyone (waitlist + registered)",
};

const STATUS_COLORS: Record<string, string> = {
  sent:    "bg-green-500/15 text-green-400",
  partial: "bg-yellow-500/15 text-yellow-400",
  failed:  "bg-red-500/15 text-red-400",
};

const BUILT_IN_TEMPLATES: EmailTemplate[] = [
  {
    id: "__launch",
    name: "Launch Announcement",
    subject: "Dowry.Africa is now open — your invitation is here 🎉",
    body: `The wait is over. Your invitation to Dowry.Africa is here.

When you signed up for early access to Dowry.Africa, you joined thousands of Africans in the diaspora who are done with games and ready for something real.

Today, we are opening our doors — and you are among the first to be invited in.

Dowry.Africa is a curated matchmaking platform built for Africans who are serious about commitment. Not endless talking stages. Not unclear intentions. Just real people, ready for marriage.

──────────────────────────────────────
💍 Curated members — every profile is reviewed before joining
🌍 Built for Africans — home and diaspora, connected
❤️ Values-based matching — faith, intent, and culture aligned
──────────────────────────────────────

Your invitation is waiting. Create your profile and start your journey.

We are honoured to have you.

Warm regards,
The Dowry.Africa Team`,
    ctaLabel: "Create my profile →",
    ctaUrl: "/register",
  },
  {
    id: "__weekly",
    name: "Weekly Update",
    subject: "What's new at Dowry.Africa this week",
    body: `Just a quick update from the Dowry.Africa team.

[EDIT THIS SECTION — add your weekly update here]

As always, we are committed to building a platform where serious people find serious love.

See you inside.

Warm regards,
The Dowry.Africa Team`,
    ctaLabel: "Log in to Dowry.Africa →",
    ctaUrl: "/discover",
  },
  {
    id: "__feature",
    name: "New Feature Announcement",
    subject: "Something new just landed on Dowry.Africa ✨",
    body: `We just made Dowry.Africa even better.

We have been working hard behind the scenes and we are excited to share something new with you.

[EDIT THIS SECTION — describe the new feature here]

Log in to check it out and let us know what you think.

Built for you, always.

Warm regards,
The Dowry.Africa Team`,
    ctaLabel: "See what's new →",
    ctaUrl: "/discover",
  },
  {
    id: "__profile",
    name: "Complete Your Profile",
    subject: "Your Dowry.Africa profile is incomplete 👋",
    body: `You are one step away from your best matches.

We noticed your profile on Dowry.Africa is not yet complete.

Members with complete profiles receive significantly more matches — and more meaningful ones.

It only takes a few minutes to:

✓ Add your photo
✓ Write a short bio about yourself
✓ Set your partner preferences

The right person could be looking for someone exactly like you right now. Do not keep them waiting.

We are rooting for you.

Warm regards,
The Dowry.Africa Team`,
    ctaLabel: "Complete my profile →",
    ctaUrl: "/profile",
  },
  {
    id: "__reengagement",
    name: "Re-engagement",
    subject: "We miss you at Dowry.Africa 💌",
    body: `Someone could be waiting for you.

It has been a while since we last saw you on Dowry.Africa.

A lot has happened since your last visit — new members have joined, new matches are waiting, and your next chapter could be one conversation away.

Dowry.Africa was built for people who are serious about love and commitment. We believe you are one of them.

Come back and see who is looking for someone just like you.

Your story is not over.

Warm regards,
The Dowry.Africa Team`,
    ctaLabel: "See my matches →",
    ctaUrl: "/discover",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCommunications() {
  const [tab, setTab] = useState<"broadcast" | "history">("broadcast");

  // Compose
  const [group, setGroup]           = useState<RecipientGroup>("all_users");
  const [subject, setSubject]       = useState("");
  const [body, setBody]             = useState("");
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [ctaLabel, setCtaLabel]     = useState("");
  const [ctaUrl, setCtaUrl]         = useState("");

  // Recipient count
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading]     = useState(false);

  // Template state
  const [customTemplates, setCustomTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [usingTemplate, setUsingTemplate] = useState(false);

  // Send flow
  const [sending, setSending]     = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult]       = useState<{ sent: number; failed: number; total: number } | null>(null);

  // History
  const [history, setHistory]           = useState<BroadcastLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedLog, setSelectedLog]   = useState<BroadcastLog | null>(null);

  // Preview modal
  const [previewOpen, setPreviewOpen]   = useState(false);
  const [previewHtml, setPreviewHtml]   = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Save template modal
  const [saveOpen, setSaveOpen]         = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving]             = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const toast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 4000); };

  // ── Data fetchers ──────────────────────────────────────────────────────────

  const fetchCount = async (g: RecipientGroup) => {
    setCountLoading(true);
    setRecipientCount(null);
    try {
      const r = await adminFetch(`/communications/preview?group=${g}`);
      const d = await r.json();
      setRecipientCount(d.count ?? 0);
    } catch { setRecipientCount(null); }
    setCountLoading(false);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await adminFetch("/communications/broadcast");
      const d = await r.json();
      setHistory(d.logs ?? []);
    } catch { /**/ }
    setHistoryLoading(false);
  };

  const loadCustomTemplates = async () => {
    try {
      const r = await adminFetch("/communications/templates");
      const d = await r.json();
      setCustomTemplates(d.templates ?? []);
    } catch { /**/ }
  };

  useEffect(() => { fetchCount(group); }, [group]);
  useEffect(() => { loadHistory(); loadCustomTemplates(); }, []);

  // ── Template selection ─────────────────────────────────────────────────────

  const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates];

  const applyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (!tplId) { setUsingTemplate(false); return; }
    const tpl = allTemplates.find(t => t.id === tplId);
    if (!tpl) return;
    setSubject(tpl.subject);
    setBody(tpl.body);
    if (tpl.ctaLabel) { setCtaEnabled(true); setCtaLabel(tpl.ctaLabel); setCtaUrl(tpl.ctaUrl ?? ""); }
    else { setCtaEnabled(false); setCtaLabel(""); setCtaUrl(""); }
    setUsingTemplate(true);
  };

  // ── Preview ────────────────────────────────────────────────────────────────

  const openPreview = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const r = await adminFetch("/communications/preview-html", {
        method: "POST",
        body: JSON.stringify({
          subject,
          body,
          ctaLabel: ctaEnabled && ctaLabel ? ctaLabel : undefined,
          ctaUrl:   ctaEnabled && ctaUrl   ? ctaUrl   : undefined,
        }),
      });
      const d = await r.json();
      setPreviewHtml(d.html ?? "");
    } catch { setPreviewHtml("<p>Failed to generate preview.</p>"); }
    setPreviewLoading(false);
  };

  // ── Save template ──────────────────────────────────────────────────────────

  const saveTemplate = async () => {
    if (!templateName.trim()) return;
    setSaving(true);
    try {
      const r = await adminFetch("/communications/templates", {
        method: "POST",
        body: JSON.stringify({
          name: templateName.trim(), subject, body,
          ctaLabel: ctaEnabled && ctaLabel ? ctaLabel : undefined,
          ctaUrl:   ctaEnabled && ctaUrl   ? ctaUrl   : undefined,
        }),
      });
      if (r.ok) {
        toast("Template saved successfully");
        setSaveOpen(false);
        setTemplateName("");
        loadCustomTemplates();
      }
    } catch { /**/ }
    setSaving(false);
  };

  const deleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    await adminFetch(`/communications/templates/${id}`, { method: "DELETE" });
    toast("Template deleted");
    loadCustomTemplates();
  };

  // ── Broadcast ──────────────────────────────────────────────────────────────

  const handleSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    setResult(null);
    try {
      const r = await adminFetch("/communications/broadcast", {
        method: "POST",
        body: JSON.stringify({
          subject, body, recipientGroup: group,
          ctaLabel: ctaEnabled && ctaLabel ? ctaLabel : undefined,
          ctaUrl:   ctaEnabled && ctaUrl   ? ctaUrl   : undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) { toast(`Error: ${d.error ?? "Unknown error"}`); }
      else {
        setResult(d);
        toast(`Broadcast sent — ${d.sent} delivered, ${d.failed} failed`);
        setSubject(""); setBody(""); setCtaEnabled(false); setCtaLabel(""); setCtaUrl("");
        setSelectedTemplateId(""); setUsingTemplate(false);
        loadHistory();
      }
    } catch { toast("Failed to send broadcast."); }
    setSending(false);
  };

  const canSend = subject.trim() && body.trim() && !!recipientCount && recipientCount > 0 && !sending;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold">Communications</h1>
          <p className="text-gray-400 text-sm mt-1">Broadcast emails to users and the waitlist</p>
        </div>

        {toastMsg && (
          <div className="mb-4 px-4 py-3 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl text-sm">{toastMsg}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 w-fit border border-gray-800">
          {(["broadcast", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-amber-500/20 text-amber-400" : "text-gray-400 hover:text-white"
              }`}>
              {t === "broadcast" ? <Radio className="w-4 h-4" /> : <History className="w-4 h-4" />}
              {t === "broadcast" ? "Broadcast" : "History"}
            </button>
          ))}
        </div>

        {/* ── BROADCAST TAB ───────────────────────────────────────────────── */}
        {tab === "broadcast" && (
          <div className="space-y-5">

            {/* Template selector */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Use a template
                </label>
                {customTemplates.length > 0 && (
                  <span className="text-gray-600 text-xs">{customTemplates.length} saved template{customTemplates.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedTemplateId}
                  onChange={e => applyTemplate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                >
                  <option value="">— Choose a template —</option>
                  <optgroup label="Built-in templates">
                    {BUILT_IN_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                  {customTemplates.length > 0 && (
                    <optgroup label="Your saved templates">
                      {customTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              {usingTemplate && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-amber-500/80 text-xs flex items-center gap-1.5">
                    <BookTemplate className="w-3.5 h-3.5" />
                    Template applied — feel free to edit before sending
                  </p>
                  {selectedTemplateId.startsWith("__") === false && (
                    <button onClick={() => deleteTemplate(selectedTemplateId, customTemplates.find(t => t.id === selectedTemplateId)?.name ?? "")}
                      className="text-red-500/60 hover:text-red-400 text-xs flex items-center gap-1 transition-colors">
                      <Trash2 className="w-3 h-3" /> Delete template
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Recipient group */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Recipient Group</label>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <select
                    value={group}
                    onChange={e => setGroup(e.target.value as RecipientGroup)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                  >
                    {(Object.entries(GROUP_LABELS) as [RecipientGroup, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
                <div className="text-right shrink-0">
                  {countLoading ? (
                    <span className="text-gray-500 text-sm">Counting...</span>
                  ) : recipientCount !== null ? (
                    <div>
                      <span className="text-2xl font-bold text-amber-400">{recipientCount.toLocaleString()}</span>
                      <span className="text-gray-500 text-xs ml-1">recipients</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Subject Line</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. We're officially live — meet your matches"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600"
              />
            </div>

            {/* Body */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Email Body</label>
              <p className="text-gray-600 text-xs mb-3">
                Use <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">[First Name]</code> to personalise — it will be replaced with each recipient's first name.
              </p>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={12}
                placeholder="Write your message here. Speak directly and warmly — this is going to real people."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600 resize-y font-mono leading-relaxed"
              />
            </div>

            {/* CTA */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={ctaEnabled} onChange={e => setCtaEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500" />
                <span className="text-gray-300 text-sm font-medium">Add a call-to-action button</span>
              </label>
              {ctaEnabled && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 text-xs mb-1.5">Button label</label>
                    <input value={ctaLabel} onChange={e => setCtaLabel(e.target.value)}
                      placeholder="e.g. Explore your matches"
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600" />
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs mb-1.5">Button URL <span className="text-gray-600">(e.g. /discover)</span></label>
                    <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)}
                      placeholder="/discover or https://..."
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Action row: preview + save template */}
            <div className="flex items-center gap-3">
              <button
                onClick={openPreview}
                disabled={!subject.trim() && !body.trim()}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                <Eye className="w-4 h-4" /> Preview Email
              </button>
              <button
                onClick={() => { setTemplateName(""); setSaveOpen(true); }}
                disabled={!subject.trim() || !body.trim()}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" /> Save as template
              </button>
            </div>

            {/* Send result */}
            {result && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${result.failed === 0 ? "bg-green-600/20 border border-green-500/30 text-green-400" : "bg-yellow-600/20 border border-yellow-500/30 text-yellow-400"}`}>
                {result.failed === 0
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                  : <XCircle className="w-4 h-4 shrink-0" />}
                {result.sent} of {result.total} emails delivered
                {result.failed > 0 && ` — ${result.failed} failed`}
              </div>
            )}

            {/* Send button */}
            <div className="flex justify-end">
              <button
                disabled={!canSend}
                onClick={() => setConfirmOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 font-bold rounded-xl text-sm transition-colors"
              >
                {sending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <><Send className="w-4 h-4" /> Send Broadcast</>}
              </button>
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ──────────────────────────────────────────────────── */}
        {tab === "history" && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            {historyLoading ? (
              <div className="p-12 text-center text-gray-500">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No broadcasts sent yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="p-4 text-left text-gray-400 font-medium">Subject</th>
                    <th className="p-4 text-left text-gray-400 font-medium">Recipients</th>
                    <th className="p-4 text-left text-gray-400 font-medium">Delivered</th>
                    <th className="p-4 text-left text-gray-400 font-medium">Status</th>
                    <th className="p-4 text-left text-gray-400 font-medium">Date</th>
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody>
                  {history.map(log => (
                    <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="p-4 text-white font-medium max-w-xs truncate">{log.subject}</td>
                      <td className="p-4 text-gray-400 text-xs">{GROUP_LABELS[log.recipientGroup as RecipientGroup] ?? log.recipientGroup}</td>
                      <td className="p-4 text-gray-300">{log.sentCount} / {log.recipientCount}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[log.status] ?? "bg-gray-500/15 text-gray-400"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-4">
                        <button onClick={() => setSelectedLog(log)}
                          className="text-amber-500 hover:text-amber-400 text-xs font-medium">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── CONFIRM DIALOG ────────────────────────────────────────────────────── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md z-10">
            <h3 className="text-white font-bold text-lg mb-2">Confirm Broadcast</h3>
            <p className="text-gray-400 text-sm mb-1">
              You are about to send <strong className="text-white">"{subject}"</strong> to{" "}
              <strong className="text-amber-400">{recipientCount?.toLocaleString()} recipients</strong>.
            </p>
            <p className="text-gray-500 text-xs mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl text-sm hover:bg-gray-800 transition-colors">Cancel</button>
              <button onClick={handleSend}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-xl text-sm transition-colors">
                Send to {recipientCount?.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOG VIEWER MODAL ──────────────────────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-2xl z-10 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">{selectedLog.subject}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{new Date(selectedLog.createdAt).toLocaleString()} · {selectedLog.sentCount}/{selectedLog.recipientCount} delivered</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-white text-2xl leading-none ml-4">×</button>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap mb-4 font-mono">{selectedLog.body}</div>
            {selectedLog.ctaLabel && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="font-medium">{selectedLog.ctaLabel}</span>
                {selectedLog.ctaUrl && <span className="text-gray-500 truncate">{selectedLog.ctaUrl}</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PREVIEW MODAL ─────────────────────────────────────────────────────── */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setPreviewOpen(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl z-10 overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
            {/* modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-gray-400 text-sm ml-2">Email preview — {subject || "(no subject)"}</span>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* iframe */}
            <div className="overflow-auto flex-1 bg-gray-200">
              {previewLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  title="Email preview"
                  className="w-full border-0"
                  style={{ height: "600px" }}
                  sandbox="allow-same-origin"
                />
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-600 shrink-0">
              Preview uses "there" as the first name placeholder. Actual emails will use each recipient's name.
            </div>
          </div>
        </div>
      )}

      {/* ── SAVE TEMPLATE MODAL ───────────────────────────────────────────────── */}
      {saveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSaveOpen(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md z-10">
            <h3 className="text-white font-bold text-lg mb-1">Save as Template</h3>
            <p className="text-gray-500 text-sm mb-4">Give this template a name so you can reuse it later.</p>
            <input
              autoFocus
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveTemplate()}
              placeholder="Template name..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600 mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setSaveOpen(false)}
                className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl text-sm hover:bg-gray-800 transition-colors">Cancel</button>
              <button
                onClick={saveTemplate}
                disabled={!templateName.trim() || saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 font-bold rounded-xl text-sm transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
