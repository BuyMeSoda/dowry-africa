import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import { Search, ChevronLeft, ChevronRight, ShieldOff, ShieldBan, ShieldCheck, Trash2 } from "lucide-react";

interface UserRow {
  id: string; name: string; email: string; birthYear: number; city: string | null;
  country: string | null; tier: string; hasBadge: boolean; accountStatus: string;
  completeness: number; createdAt: string; lastActive: string;
}

const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-500/15 text-gray-400",
  core: "bg-blue-500/15 text-blue-400",
  badge: "bg-amber-500/15 text-amber-400",
};
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  suspended: "bg-yellow-500/15 text-yellow-400",
  banned: "bg-red-500/15 text-red-400",
};

export default function AdminUsers() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const totalPages = Math.ceil(total / 25);

  const toast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const load = async () => {
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

  useEffect(() => { load(); }, [page, filterTier, filterStatus]);

  const doAction = async (id: string, action: "suspend" | "ban" | "reactivate") => {
    await adminFetch(`/users/${id}/${action}`, { method: "PATCH" });
    toast(`User ${action}d`);
    load();
  };

  const setTier = async (id: string, tier: string) => {
    await adminFetch(`/users/${id}/subscription`, { method: "PATCH", body: JSON.stringify({ tier }) });
    toast("Subscription updated");
    load();
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    await adminFetch(`/users/${id}`, { method: "DELETE" });
    toast("User deleted");
    load();
  };

  const currentYear = new Date().getFullYear();

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Users</h1>
            <p className="text-gray-400 text-sm mt-1">{total} registered members</p>
          </div>
        </div>

        {toastMsg && (
          <div className="mb-4 px-4 py-3 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl text-sm">{toastMsg}</div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={e => e.key === "Enter" && load()} placeholder="Search name or email..."
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
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
          <button onClick={() => { setSearch(""); setFilterTier(""); setFilterStatus(""); setPage(1); setTimeout(load, 0); }}
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.accountStatus] ?? ""}`}>
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
                        {row.accountStatus === "active" ? (
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
      </div>
    </AdminLayout>
  );
}
