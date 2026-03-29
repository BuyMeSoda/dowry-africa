import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import { ShieldOff, ShieldBan, X } from "lucide-react";

interface ReportRow {
  id: string; reason: string; details: string | null; status: string; created_at: string;
  reporter_name: string; reporter_email: string;
  reported_name: string; reported_email: string;
}

export default function AdminModeration() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [toastMsg, setToastMsg] = useState("");

  const toast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const load = async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    const r = await adminFetch(`/reports?${params}`);
    const data = await r.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? 0);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const doAction = async (id: string, action: "dismiss" | "warn" | "suspend" | "ban") => {
    await adminFetch(`/reports/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
    toast(`Report ${action}ed`);
    load();
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Moderation</h1>
            <p className="text-gray-400 text-sm mt-1">{total} reports</p>
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="pending">Pending</option>
            <option value="actioned">Actioned</option>
            <option value="dismissed">Dismissed</option>
            <option value="">All</option>
          </select>
        </div>

        {toastMsg && (
          <div className="mb-4 px-4 py-3 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl text-sm">{toastMsg}</div>
        )}

        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center text-gray-500">
              No reports found.
            </div>
          ) : rows.map(row => (
            <div key={row.id} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.status === "pending" ? "bg-yellow-500/15 text-yellow-400" :
                      row.status === "actioned" ? "bg-red-500/15 text-red-400" :
                      "bg-gray-500/15 text-gray-400"
                    }`}>{row.status}</span>
                    <span className="text-gray-500 text-xs">{new Date(row.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Reporter</p>
                      <p className="text-white text-sm font-medium">{row.reporter_name}</p>
                      <p className="text-gray-500 text-xs">{row.reporter_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Reported User</p>
                      <p className="text-white text-sm font-medium">{row.reported_name}</p>
                      <p className="text-gray-500 text-xs">{row.reported_email}</p>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-gray-400 text-xs font-medium mb-1">Reason: {row.reason}</p>
                    {row.details && <p className="text-gray-300 text-sm">{row.details}</p>}
                  </div>
                </div>
                {row.status === "pending" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => doAction(row.id, "dismiss")}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium transition-colors">
                      <X className="w-3.5 h-3.5" /> Dismiss
                    </button>
                    <button onClick={() => doAction(row.id, "suspend")}
                      className="flex items-center gap-2 px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-xl text-xs font-medium transition-colors">
                      <ShieldOff className="w-3.5 h-3.5" /> Suspend
                    </button>
                    <button onClick={() => doAction(row.id, "ban")}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl text-xs font-medium transition-colors">
                      <ShieldBan className="w-3.5 h-3.5" /> Ban User
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
