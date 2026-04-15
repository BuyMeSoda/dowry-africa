import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import { Search, ChevronLeft, ChevronRight, ShieldOff, ShieldBan, ShieldCheck, Trash2, Mail, Loader2, CheckCheck, X, Clock, UserCheck2, AlertTriangle } from "lucide-react";

interface UserRow {
  id: string; name: string; email: string; birthYear: number; city: string | null;
  country: string | null; tier: string; hasBadge: boolean; accountStatus: string;
  completeness: number; createdAt: string; lastActive: string;
}

interface PendingRow {
  id: string; name: string; email: string; birthYear: number;
  createdAt: string; emailVerified: boolean; daysWaiting: number;
}

const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-500/15 text-gray-400",
  core: "bg-blue-500/15 text-blue-400",
  badge: "bg-amber-500/15 text-amber-400",
};
const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-500/15 text-green-400",
  active: "bg-green-500/15 text-green-400",
  suspended: "bg-yellow-500/15 text-yellow-400",
  banned: "bg-red-500/15 text-red-400",
  pending: "bg-amber-500/15 text-amber-500",
  rejected: "bg-red-500/15 text-red-400",
};

interface EmailModal { id: string; name: string; email: string; }
interface RejectModal { id: string; name: string; }

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");

  // All users tab state
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Pending tab state
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Shared
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const totalPages = Math.ceil(total / 25);

  const [emailModal, setEmailModal] = useState<EmailModal | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const [rejectModal, setRejectModal] = useState<RejectModal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const toast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg); setToastType(type);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const loadAll = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (filterTier) params.set("tier", filterTier);
    if (filterStatus) params.set("status", filterStatus);
    const r = await adminFetch(`/users?${params}`);
    const data = await r.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

  const loadPending = async () => {
    setPendingLoading(true);
    const r = await adminFetch("/users/pending");
    const data = await r.json();
    setPendingRows(data.rows ?? []);
    setPendingTotal(data.total ?? 0);
    setSelectedIds(new Set());
    setPendingLoading(false);
  };

  useEffect(() => { loadAll(); }, [page, filterTier, filterStatus]);
  useEffect(() => { if (activeTab === "pending") loadPending(); }, [activeTab]);

  const doAction = async (id: string, action: "suspend" | "ban" | "reactivate") => {
    await adminFetch(`/users/${id}/${action}`, { method: "PATCH" });
    toast(`User ${action}d`);
    loadAll();
  };

  const setTier = async (id: string, tier: string) => {
    await adminFetch(`/users/${id}/subscription`, { method: "PATCH", body: JSON.stringify({ tier }) });
    toast("Subscription updated");
    loadAll();
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    await adminFetch(`/users/${id}`, { method: "DELETE" });
    toast("User deleted");
    loadAll();
  };

  const openEmailModal = (row: UserRow) => {
    setEmailModal({ id: row.id, name: row.name, email: row.email });
    setEmailSubject("");
    setEmailMessage("");
  };

  const sendUserEmail = async () => {
    if (!emailModal) return;
    setEmailSending(true);
    await adminFetch(`/communications/user/${emailModal.id}`, {
      method: "POST",
      body: JSON.stringify({ subject: emailSubject, message: emailMessage }),
    });
    setEmailSending(false);
    setEmailModal(null);
    toast(`Email sent to ${emailModal.name}`);
  };

  const approveUser = async (id: string) => {
    const r = await adminFetch(`/users/${id}/approve`, { method: "POST" });
    if (r.ok) {
      toast("User approved — approval email sent");
      loadPending();
    } else {
      toast("Failed to approve user", "error");
    }
  };

  const openRejectModal = (row: PendingRow) => {
    setRejectModal({ id: row.id, name: row.name });
    setRejectReason("");
  };

  const submitReject = async () => {
    if (!rejectModal) return;
    setRejectSubmitting(true);
    const r = await adminFetch(`/users/${rejectModal.id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
    });
    setRejectSubmitting(false);
    setRejectModal(null);
    if (r.ok) {
      toast(`${rejectModal.name} rejected`);
      loadPending();
    } else {
      toast("Failed to reject user", "error");
    }
  };

  const bulkApprove = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Approve ${selectedIds.size} user${selectedIds.size > 1 ? "s" : ""}? Approval emails will be sent.`)) return;
    const r = await adminFetch("/users/bulk-approve", {
      method: "POST",
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    const data = await r.json();
    if (r.ok) {
      toast(`${data.approved} user${data.approved !== 1 ? "s" : ""} approved — emails sent`);
      loadPending();
    } else {
      toast("Bulk approve failed", "error");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRows.map(r => r.id)));
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Users</h1>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === "all" ? `${total} registered members` : `${pendingTotal} awaiting approval`}
            </p>
          </div>
          {activeTab === "pending" && selectedIds.size > 0 && (
            <button
              onClick={bulkApprove}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Approve {selectedIds.size} selected
            </button>
          )}
        </div>

        {toastMsg && (
          <div className={`mb-4 px-4 py-3 border rounded-xl text-sm ${
            toastType === "success"
              ? "bg-green-600/20 border-green-500/30 text-green-400"
              : "bg-red-600/20 border-red-500/30 text-red-400"
          }`}>{toastMsg}</div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "all" ? "bg-amber-500 text-amber-950" : "text-gray-400 hover:text-white"
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "pending" ? "bg-amber-500 text-amber-950" : "text-gray-400 hover:text-white"
            }`}
          >
            Pending Approval
            {pendingTotal > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold px-1">
                {pendingTotal}
              </span>
            )}
          </button>
        </div>

        {/* ── ALL USERS TAB ───────────────────────────────────────── */}
        {activeTab === "all" && (
          <>
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  onKeyDown={e => e.key === "Enter" && loadAll()} placeholder="Search name or email..."
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <select value={filterTier} onChange={e => { setFilterTier(e.target.value); setPage(1); }}
                className="bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">All Tiers</option>
                <option value="free">Free</option>
                <option value="core">Core</option>
                <option value="badge">Badge</option>
              </select>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
                <option value="rejected">Rejected</option>
              </select>
              <button onClick={() => { setSearch(""); setFilterTier(""); setFilterStatus(""); setPage(1); setTimeout(loadAll, 0); }}
                className="px-4 py-2.5 text-sm text-gray-400 hover:text-white bg-gray-900 border border-gray-700 rounded-xl transition-colors">
                Clear
              </button>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-gray-500">Loading...</div>
              ) : rows.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No users found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="p-4 text-left text-gray-400 font-medium">User</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Location</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Tier</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Status</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Profile</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Joined</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr key={row.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="p-4">
                          <p className="text-white font-medium">{row.name}, {currentYear - row.birthYear}</p>
                          <p className="text-gray-500 text-xs">{row.email}</p>
                        </td>
                        <td className="p-4 text-gray-400 text-xs">{[row.city, row.country].filter(Boolean).join(", ") || "—"}</td>
                        <td className="p-4">
                          <select value={row.tier} onChange={e => setTier(row.id, e.target.value)}
                            className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none ${TIER_COLORS[row.tier] ?? ""}`}>
                            <option value="free">Free</option>
                            <option value="core">Core</option>
                            <option value="badge">Badge</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.accountStatus] ?? "bg-gray-500/15 text-gray-400"}`}>
                            {row.accountStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${row.completeness}%` }} />
                            </div>
                            <span className="text-gray-400 text-xs">{row.completeness}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="flex gap-1.5">
                            {row.accountStatus === "approved" || row.accountStatus === "active" ? (
                              <button onClick={() => doAction(row.id, "suspend")}
                                className="p-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-lg transition-colors" title="Suspend">
                                <ShieldOff className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button onClick={() => doAction(row.id, "reactivate")}
                                className="p-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition-colors" title="Reactivate">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {row.accountStatus !== "banned" && (
                              <button onClick={() => doAction(row.id, "ban")}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors" title="Ban">
                                <ShieldBan className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => openEmailModal(row)}
                              className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors" title="Send Email">
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteUser(row.id, row.name)}
                              className="p-1.5 bg-gray-700/50 hover:bg-red-600/30 text-gray-400 hover:text-red-400 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                <span>Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 bg-gray-900 border border-gray-700 rounded-xl disabled:opacity-40 hover:bg-gray-800 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 bg-gray-900 border border-gray-700 rounded-xl disabled:opacity-40 hover:bg-gray-800 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PENDING APPROVAL TAB ──────────────────────────────── */}
        {activeTab === "pending" && (
          <>
            {pendingRows.length > 0 && (
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-amber-500 rounded"
                    checked={selectedIds.size === pendingRows.length && pendingRows.length > 0}
                    onChange={toggleSelectAll}
                  />
                  Select all
                </label>
                <span className="text-gray-600 text-sm">{selectedIds.size} selected</span>
              </div>
            )}

            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              {pendingLoading ? (
                <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading…
                </div>
              ) : pendingRows.length === 0 ? (
                <div className="p-16 text-center">
                  <UserCheck2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No pending applications</p>
                  <p className="text-gray-600 text-sm mt-1">All applications have been reviewed.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="p-4 w-8" />
                      <th className="p-4 text-left text-gray-400 font-medium">Applicant</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Age</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Email Verified</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Waiting</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRows.map(row => (
                      <tr key={row.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${selectedIds.has(row.id) ? "bg-amber-900/10" : ""}`}>
                        <td className="pl-4">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleSelect(row.id)}
                          />
                        </td>
                        <td className="p-4">
                          <p className="text-white font-medium">{row.name}</p>
                          <p className="text-gray-500 text-xs">{row.email}</p>
                        </td>
                        <td className="p-4 text-gray-400 text-sm">
                          {currentYear - row.birthYear}
                        </td>
                        <td className="p-4">
                          {row.emailVerified ? (
                            <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                              <CheckCheck className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-500 text-xs font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" /> Unverified
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${row.daysWaiting >= 7 ? "text-rose-400" : "text-gray-400"}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {row.daysWaiting === 0 ? "Today" : `${row.daysWaiting}d`}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveUser(row.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-semibold rounded-lg transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(row)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-semibold rounded-lg transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEmailModal(null)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-lg z-10">
            <h3 className="text-white font-bold text-lg mb-1">Send Email</h3>
            <p className="text-gray-500 text-sm mb-5">To: <span className="text-gray-300">{emailModal.name} &lt;{emailModal.email}&gt;</span></p>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Subject</label>
                <input
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Message</label>
                <textarea
                  value={emailMessage}
                  onChange={e => setEmailMessage(e.target.value)}
                  rows={6}
                  placeholder="Write your message to this user..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600 resize-y"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEmailModal(null)}
                className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl text-sm hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={sendUserEmail}
                disabled={!emailSubject.trim() || !emailMessage.trim() || emailSending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
              >
                {emailSending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <><Mail className="w-4 h-4" /> Send Email</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !rejectSubmitting && setRejectModal(null)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md z-10">
            <h3 className="text-white font-bold text-lg mb-1">Reject Application</h3>
            <p className="text-gray-500 text-sm mb-5">Rejecting <span className="text-gray-300 font-medium">{rejectModal.name}</span>. A rejection email will be sent.</p>
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Provide a reason to include in the rejection email (optional)..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600 resize-none"
              />
              <p className="text-gray-600 text-xs mt-1.5">Leave blank to send a generic rejection.</p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setRejectModal(null)} disabled={rejectSubmitting}
                className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl text-sm hover:bg-gray-800 transition-colors disabled:opacity-40">
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={rejectSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                {rejectSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting…</> : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
