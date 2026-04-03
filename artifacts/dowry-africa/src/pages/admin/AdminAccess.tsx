import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminAuthFetch, getAdminUser, type AdminUser } from "@/lib/admin";
import { Plus, Trash2, ShieldOff, Shield, RotateCcw, Loader2, X } from "lucide-react";

interface AdminRow {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
      active ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"
    }`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
      role === "super_admin"
        ? "bg-amber-900/40 text-amber-400"
        : "bg-gray-700 text-gray-300"
    }`}>
      {role === "super_admin" ? "Super Admin" : "Admin"}
    </span>
  );
}

export default function AdminAccess() {
  const currentUser = getAdminUser();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const res = await adminAuthFetch("/admins");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to load admins");
        return;
      }
      setAdmins(await res.json());
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      const res = await adminAuthFetch("/admins", {
        method: "POST",
        body: JSON.stringify({ name: newName, email: newEmail, tempPassword: newPassword }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setAddError(d.error ?? "Failed to add admin"); return; }
      setNewName(""); setNewEmail(""); setNewPassword("");
      setShowAddForm(false);
      loadAdmins();
    } catch {
      setAddError("Connection failed");
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleActive = async (admin: AdminRow) => {
    setActionLoading(admin.id);
    try {
      await adminAuthFetch(`/admins/${admin.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !admin.isActive }),
      });
      loadAdmins();
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (admin: AdminRow) => {
    if (!confirm(`Send a password reset email to ${admin.email}?`)) return;
    setActionLoading(admin.id + "-reset");
    try {
      await adminAuthFetch(`/admins/${admin.id}`, {
        method: "PATCH",
        body: JSON.stringify({ resetPassword: true }),
      });
      alert("Password reset email sent.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (admin: AdminRow) => {
    if (!confirm(`Permanently remove ${admin.name} (${admin.email}) from admin access?`)) return;
    setActionLoading(admin.id + "-delete");
    try {
      await adminAuthFetch(`/admins/${admin.id}`, { method: "DELETE" });
      loadAdmins();
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Never";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-white text-2xl font-bold">Admin Access</h1>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-colors text-sm"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Cancel" : "Add admin"}
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-8">Manage who has access to this admin panel.</p>

        {/* Add admin form */}
        {showAddForm && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Add new admin</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Full name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600"
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600"
                  placeholder="jane@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Temporary password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600"
                  placeholder="Temp@12345"
                  required
                />
              </div>
              {addError && (
                <div className="col-span-full">
                  <p className="text-red-400 text-sm">{addError}</p>
                </div>
              )}
              <div className="col-span-full flex justify-end">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {addLoading ? "Adding…" : "Add admin & send welcome email"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admin list */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-400">{error}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 font-medium px-5 py-4">Name</th>
                  <th className="text-left text-gray-400 font-medium px-5 py-4">Email</th>
                  <th className="text-left text-gray-400 font-medium px-5 py-4">Role</th>
                  <th className="text-left text-gray-400 font-medium px-5 py-4">Status</th>
                  <th className="text-left text-gray-400 font-medium px-5 py-4">Last login</th>
                  <th className="text-right text-gray-400 font-medium px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => {
                  const isSelf = admin.id === currentUser?.id;
                  const isSuperAdmin = admin.role === "super_admin";
                  return (
                    <tr key={admin.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4 text-white font-medium">{admin.name}</td>
                      <td className="px-5 py-4 text-gray-300">{admin.email}</td>
                      <td className="px-5 py-4"><RoleBadge role={admin.role} /></td>
                      <td className="px-5 py-4"><Badge active={admin.isActive} /></td>
                      <td className="px-5 py-4 text-gray-400">{formatDate(admin.lastLogin)}</td>
                      <td className="px-5 py-4">
                        {!isSuperAdmin && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggleActive(admin)}
                              disabled={!!actionLoading}
                              title={admin.isActive ? "Deactivate" : "Activate"}
                              className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-gray-800 transition-colors disabled:opacity-40"
                            >
                              {actionLoading === admin.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : admin.isActive ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />
                              }
                            </button>
                            <button
                              onClick={() => handleResetPassword(admin)}
                              disabled={!!actionLoading}
                              title="Send password reset"
                              className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-gray-800 transition-colors disabled:opacity-40"
                            >
                              {actionLoading === admin.id + "-reset"
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <RotateCcw className="w-4 h-4" />
                              }
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => handleDelete(admin)}
                                disabled={!!actionLoading}
                                title="Remove admin"
                                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors disabled:opacity-40"
                              >
                                {actionLoading === admin.id + "-delete"
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Trash2 className="w-4 h-4" />
                                }
                              </button>
                            )}
                          </div>
                        )}
                        {isSuperAdmin && (
                          <span className="text-gray-600 text-xs text-right block pr-2">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
