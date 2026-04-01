import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import { API_BASE } from "@/lib/api-url";
import { MessageSquare, Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight } from "lucide-react";

interface Prompt {
  id: number;
  promptText: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export default function AdminPrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/prompts`);
      const data = await res.json();
      setPrompts(data.prompts ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    try {
      const maxOrder = prompts.length > 0 ? Math.max(...prompts.map(p => p.displayOrder)) : 0;
      const res = await adminFetch(`${API_BASE}/api/admin/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: newText.trim(), displayOrder: maxOrder + 1 }),
      });
      if (res.ok) {
        setNewText("");
        await load();
      }
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (prompt: Prompt) => {
    const res = await adminFetch(`${API_BASE}/api/admin/prompts/${prompt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !prompt.isActive }),
    });
    if (res.ok) await load();
  };

  const startEdit = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setEditText(prompt.promptText);
  };

  const saveEdit = async (id: number) => {
    if (!editText.trim()) return;
    const res = await adminFetch(`${API_BASE}/api/admin/prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptText: editText.trim() }),
    });
    if (res.ok) {
      setEditingId(null);
      await load();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setDeletingId(id);
    try {
      const res = await adminFetch(`${API_BASE}/api/admin/prompts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDelete(null);
        await load();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = prompts.filter(p => p.isActive).length;

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-amber-400" />
            Message Prompts
          </h1>
          <p className="text-gray-400 mt-1">
            3 random active prompts are shown in each conversation to help users start meaningful conversations.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3">
            <p className="text-gray-400 text-xs uppercase tracking-widest">Total</p>
            <p className="text-white text-2xl font-bold">{prompts.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3">
            <p className="text-gray-400 text-xs uppercase tracking-widest">Active</p>
            <p className="text-amber-400 text-2xl font-bold">{activeCount}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3">
            <p className="text-gray-400 text-xs uppercase tracking-widest">Inactive</p>
            <p className="text-gray-500 text-2xl font-bold">{prompts.length - activeCount}</p>
          </div>
        </div>

        {/* Add new prompt */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" />
            Add New Prompt
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="Enter a conversation starter..."
              className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-500"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newText.trim()}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-xl text-sm transition-colors"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        {/* Prompt list */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">All Prompts</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : prompts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No prompts yet. Add one above.</div>
          ) : (
            <ul className="divide-y divide-gray-800">
              {prompts.map(prompt => (
                <li key={prompt.id} className={`px-6 py-4 flex items-start gap-4 transition-colors ${prompt.isActive ? "" : "opacity-50"}`}>
                  {/* Order badge */}
                  <span className="text-xs text-gray-600 font-mono mt-1 w-6 shrink-0 text-right">{prompt.displayOrder}</span>

                  {/* Text or edit input */}
                  <div className="flex-1 min-w-0">
                    {editingId === prompt.id ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveEdit(prompt.id); if (e.key === "Escape") setEditingId(null); }}
                          className="flex-1 bg-gray-800 border border-amber-500 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                        />
                        <button onClick={() => saveEdit(prompt.id)} className="text-green-400 hover:text-green-300">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-white text-sm leading-relaxed">{prompt.promptText}</p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${prompt.isActive ? "bg-green-500/10 text-green-400" : "bg-gray-700 text-gray-500"}`}>
                    {prompt.isActive ? "Active" : "Inactive"}
                  </span>

                  {/* Actions */}
                  {editingId !== prompt.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggle(prompt)}
                        title={prompt.isActive ? "Deactivate" : "Activate"}
                        className="text-gray-500 hover:text-amber-400 transition-colors p-1"
                      >
                        {prompt.isActive
                          ? <ToggleRight className="w-5 h-5 text-amber-400" />
                          : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => startEdit(prompt)}
                        className="text-gray-500 hover:text-white transition-colors p-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        disabled={deletingId === prompt.id}
                        className={`transition-colors p-1 ${confirmDelete === prompt.id ? "text-red-400 hover:text-red-300" : "text-gray-500 hover:text-red-400"}`}
                        title={confirmDelete === prompt.id ? "Click again to confirm delete" : "Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {confirmDelete === prompt.id && (
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-gray-500 hover:text-gray-300 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
