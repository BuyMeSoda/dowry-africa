import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import { Send, Radio, History, ChevronDown, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

type RecipientGroup = "waitlist" | "all_users" | "free_users" | "core_users" | "badge_users" | "everyone";

interface BroadcastLog {
  id: string;
  subject: string;
  body: string;
  recipientGroup: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  createdAt: string;
}

const GROUP_LABELS: Record<RecipientGroup, string> = {
  waitlist:  "All waitlist emails",
  all_users: "All registered users",
  free_users:  "Registered users — Free tier only",
  core_users:  "Registered users — Core tier only",
  badge_users: "Registered users — Serious Badge only",
  everyone:  "Everyone (waitlist + registered)",
};

const STATUS_COLORS: Record<string, string> = {
  sent:    "bg-green-500/15 text-green-400",
  partial: "bg-yellow-500/15 text-yellow-400",
  failed:  "bg-red-500/15 text-red-400",
};

function EmailPreview({
  subject, body, ctaEnabled, ctaLabel, ctaUrl,
}: {
  subject: string; body: string; ctaEnabled: boolean; ctaLabel: string; ctaUrl: string;
}) {
  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", background: "#fdf8f4", borderRadius: 12, overflow: "hidden", border: "1px solid #f0e4e4" }}>
      <div style={{ background: "linear-gradient(135deg, #8b2252, #c43b7a)", padding: "24px 32px", textAlign: "center" }}>
        <p style={{ color: "white", fontSize: 20, fontWeight: "bold", margin: 0 }}>Dowry.Africa</p>
      </div>
      <div style={{ background: "white", padding: "28px 32px" }}>
        <p style={{ fontSize: 14, color: "#5a3a3a", margin: "0 0 8px" }}>Hi [Name],</p>
        <h2 style={{ fontSize: 18, fontWeight: "bold", margin: "0 0 16px", color: "#1a0a0a" }}>
          {subject || <span style={{ color: "#ccc" }}>(no subject)</span>}
        </h2>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: "#5a3a3a", whiteSpace: "pre-wrap", marginBottom: 20 }}>
          {body || <span style={{ color: "#ccc" }}>(no content)</span>}
        </div>
        {ctaEnabled && ctaLabel && (
          <div style={{ textAlign: "center", margin: "24px 0" }}>
            <span style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #8b2252, #c43b7a)",
              color: "white", padding: "12px 28px", borderRadius: 100, fontSize: 14, fontWeight: "bold",
            }}>
              {ctaLabel}
            </span>
            {ctaUrl && <p style={{ fontSize: 11, color: "#a08080", margin: "6px 0 0" }}>{ctaUrl}</p>}
          </div>
        )}
      </div>
      <div style={{ background: "#fdf8f4", padding: "16px 24px", textAlign: "center", fontSize: 11, color: "#a08080", borderTop: "1px solid #f0e4e4" }}>
        © {new Date().getFullYear()} Dowry.Africa — Built for marriage. Not just matches.<br />
        <span>You're receiving this because you signed up at dowry.africa</span>
      </div>
    </div>
  );
}

export default function AdminCommunications() {
  const [tab, setTab] = useState<"broadcast" | "history">("broadcast");

  const [group, setGroup]       = useState<RecipientGroup>("all_users");
  const [subject, setSubject]   = useState("");
  const [body, setBody]         = useState("");
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl]     = useState("");

  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading]     = useState(false);
  const [showPreview, setShowPreview]       = useState(false);
  const [sending, setSending]               = useState(false);
  const [confirmOpen, setConfirmOpen]       = useState(false);
  const [result, setResult]                 = useState<{ sent: number; failed: number; total: number } | null>(null);

  const [history, setHistory]           = useState<BroadcastLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedLog, setSelectedLog]   = useState<BroadcastLog | null>(null);

  const [toastMsg, setToastMsg] = useState("");
  const toast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 4000); };

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

  useEffect(() => { fetchCount(group); }, [group]);
  useEffect(() => { loadHistory(); }, []);

  const handleSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    setResult(null);
    try {
      const r = await adminFetch("/communications/broadcast", {
        method: "POST",
        body: JSON.stringify({
          subject,
          body,
          recipientGroup: group,
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
        loadHistory();
      }
    } catch { toast("Failed to send broadcast."); }
    setSending(false);
  };

  const canSend = subject.trim() && body.trim() && !!recipientCount && recipientCount > 0 && !sending;

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

        {/* ── BROADCAST TAB ─────────────────────────────────────────── */}
        {tab === "broadcast" && (
          <div className="space-y-5">

            {/* Recipient group */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Recipient Group
              </label>
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
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={10}
                placeholder="Write your message here. Speak directly and warmly — this is going to real people."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600 resize-y"
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
                    <label className="block text-gray-500 text-xs mb-1.5">Button URL</label>
                    <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Preview toggle */}
            <button
              onClick={() => setShowPreview(v => !v)}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? "Hide preview" : "Show email preview"}
            </button>

            {showPreview && (
              <div className="rounded-2xl overflow-hidden border border-gray-700">
                <div className="bg-gray-800 px-4 py-2 text-xs text-gray-500 flex items-center gap-2">
                  <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500/60" /><span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" /><span className="w-2.5 h-2.5 rounded-full bg-green-500/60" /></div>
                  Email preview
                </div>
                <div className="p-4 bg-gray-100">
                  <EmailPreview subject={subject} body={body} ctaEnabled={ctaEnabled} ctaLabel={ctaLabel} ctaUrl={ctaUrl} />
                </div>
              </div>
            )}

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

        {/* ── HISTORY TAB ───────────────────────────────────────────── */}
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
                          className="text-amber-500 hover:text-amber-400 text-xs font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Confirm dialog ───────────────────────────────────────────── */}
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
                className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl text-sm hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleSend}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-xl text-sm transition-colors">
                Send to {recipientCount?.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Log viewer modal ─────────────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-2xl z-10 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">{selectedLog.subject}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{new Date(selectedLog.createdAt).toLocaleString()} · {selectedLog.sentCount}/{selectedLog.recipientCount} delivered</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap mb-4">{selectedLog.body}</div>
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
    </AdminLayout>
  );
}
