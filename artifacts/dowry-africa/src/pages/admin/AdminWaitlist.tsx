import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import { Check, X, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface WaitlistRow {
  id: string; fullName: string; age: number; city: string; country: string; email: string;
  intention: string; timeline: string; willingProfile: boolean; willingVerify: boolean;
  willingRespect: boolean; whyJoining: string; referralSource: string | null;
  priority: string; status: string; createdAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-green-500/15 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-red-500/15 text-red-400 border-red-500/30",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-500/15 text-blue-400",
  approved: "bg-green-500/15 text-green-400",
  rejected: "bg-red-500/15 text-red-400",
};

export default function AdminWaitlist() {
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const totalPages = Math.ceil(total / 25);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (filterPriority) params.set("priority", filterPriority);
    if (filterStatus) params.set("status", filterStatus);
    const r = await adminFetch(`/waitlist?${params}`);
    const data = await r.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, filterPriority, filterStatus]);

  const toast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const action = async (id: string, act: "approve" | "reject") => {
    await adminFetch(`/waitlist/${id}/${act}`, { method: "POST" });
    toast(act === "approve" ? "Approved!" : "Rejected");
    load();
  };

  const bulkAction = async (act: "approve" | "reject") => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    await adminFetch(`/waitlist/bulk-${act}`, { method: "POST", body: JSON.stringify({ ids }) });
    setSelected(new Set());
    toast(`${ids.length} applications ${act}d`);
    load();
  };

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Waitlist</h1>
            <p className="text-gray-400 text-sm mt-1">{total} total applicants</p>
          </div>
          {selected.size > 0 && (
            <div className="flex gap-2">
              <button onClick={() => bulkAction("approve")} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-medium transition-colors">
                Approve {selected.size}
              </button>
              <button onClick={() => bulkAction("reject")} className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">
                Reject {selected.size}
              </button>
            </div>
          )}
        </div>

        {toastMsg && (
          <div className="mb-4 px-4 py-3 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl text-sm">{toastMsg}</div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={e => e.key === "Enter" && load()}
              placeholder="Search name or email..."
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={filterPriority}
            onChange={e => { setFilterPriority(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={() => { setSearch(""); setFilterPriority(""); setFilterStatus(""); setPage(1); setTimeout(load, 0); }}
            className="px-4 py-2.5 text-sm text-gray-400 hover:text-white bg-gray-900 border border-gray-700 rounded-xl transition-colors">
            Clear
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No applicants found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="p-4 text-left w-8">
                    <input type="checkbox" className="accent-amber-500"
                      checked={selected.size === rows.length && rows.length > 0}
                      onChange={e => setSelected(e.target.checked ? new Set(rows.map(r => r.id)) : new Set())} />
                  </th>
                  <th className="p-4 text-left text-gray-400 font-medium">Applicant</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Location</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Intention</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Priority</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Status</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Date</th>
                  <th className="p-4 text-left text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-4">
                      <input type="checkbox" className="accent-amber-500"
                        checked={selected.has(row.id)}
                        onChange={() => toggleSelect(row.id)} />
                    </td>
                    <td className="p-4">
                      <p className="text-white font-medium">{row.fullName}, {row.age}</p>
                      <p className="text-gray-500 text-xs">{row.email}</p>
                    </td>
                    <td className="p-4 text-gray-300">{row.city}, {row.country}</td>
                    <td className="p-4">
                      <p className="text-gray-300 text-xs">{row.intention}</p>
                      <p className="text-gray-500 text-xs">{row.timeline}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${PRIORITY_COLORS[row.priority] ?? ""}`}>
                        {row.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] ?? ""}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {row.status !== "approved" && (
                          <button onClick={() => action(row.id, "approve")}
                            className="p-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition-colors" title="Approve">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {row.status !== "rejected" && (
                          <button onClick={() => action(row.id, "reject")}
                            className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors" title="Reject">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
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
      </div>
    </AdminLayout>
  );
}
