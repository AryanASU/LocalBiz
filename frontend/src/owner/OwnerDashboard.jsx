// src/owner/OwnerDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OwnerDashboard({ owner, onLogout }) {
  const nav = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = { name: "", category: "", description: "", city: "", lon: "", lat: "" };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!owner) {
      nav("/owner/login");
      return;
    }
    fetchBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);

  async function fetchBusinesses() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch('/owner/businesses'); // protected endpoint
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load');
      }
      const data = await res.json();
      setBusinesses(data || []);
    } catch (e) {
      setErr(e.message || 'Failed to fetch');
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this listing?")) return;
    try {
      const res = await fetch(`/api/businesses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Delete failed");
      }
      setBusinesses(prev => prev.filter(b => b._id !== id));
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  }

  function openEdit(b) {
    setEditing(b);
    setForm({
      name: b.name || "",
      category: b.category || "",
      description: b.description || "",
      city: b.address?.city || "",
      lon: (b.location?.coordinates && b.location.coordinates[0])?.toString() || "",
      lat: (b.location?.coordinates && b.location.coordinates[1])?.toString() || ""
    });
    setShowEdit(true);
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const update = {
        name: form.name,
        category: form.category,
        description: form.description,
        address: { city: form.city },
        location: { type: "Point", coordinates: [parseFloat(form.lon), parseFloat(form.lat)] }
      };
      const res = await fetch(`/api/businesses/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Update failed");
      setBusinesses(prev => prev.map(b => (b._id === payload._id ? payload : b)));
      setShowEdit(false);
      setEditing(null);
    } catch (err) {
      alert("Update error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setShowCreate(true);
  }

  async function submitCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        category: form.category,
        description: form.description,
        address: { city: form.city },
        location: { type: "Point", coordinates: [parseFloat(form.lon), parseFloat(form.lat)] }
      };
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Create failed");
      setBusinesses(prev => [payload, ...prev]);
      setShowCreate(false);
      setForm(emptyForm);
    } catch (err) {
      alert("Create error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/auth/logout", { method: "POST" });
    onLogout && onLogout();
    nav("/");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Your Listings</h2>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="px-3 py-1 border rounded">Create New</button>
          <button onClick={handleLogout} className="px-3 py-1 bg-rose-600 text-white rounded">Logout</button>
        </div>
      </div>

      {loading ? <p>Loading…</p> : null}
      {err ? <p className="text-red-500">{err}</p> : null}

      <div className="space-y-3">
        {businesses.length === 0 && !loading ? (
          <p className="text-slate-500">No listings yet. Click "Create New" to add one.</p>
        ) : (
          businesses.map(b => (
            <div key={b._id} className="p-3 border rounded flex justify-between items-center">
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-sm text-slate-500">{b.category} • {b.address?.city}</div>
                <div className="text-xs text-slate-400">Created: {new Date(b.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 border rounded" onClick={() => openEdit(b)}>Edit</button>
                <button className="px-3 py-1 bg-rose-600 text-white rounded" onClick={() => handleDelete(b._id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl bg-white rounded p-6 shadow">
            <h3 className="text-lg font-semibold mb-3">Create Listing</h3>
            <form onSubmit={submitCreate} className="space-y-3">
              <input className="w-full p-2 border rounded" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input className="w-full p-2 border rounded" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <input className="w-full p-2 border rounded" placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className="p-2 border rounded" placeholder="Longitude (e.g. -112.0740)" value={form.lon} onChange={e => setForm({ ...form, lon: e.target.value })} required />
                <input className="p-2 border rounded" placeholder="Latitude (e.g. 33.4484)" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} required />
              </div>
              <textarea className="w-full p-2 border rounded" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div className="flex justify-end gap-2">
                <button type="button" className="px-3 py-1 border rounded" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="px-3 py-1 bg-sky-600 text-white rounded">{saving ? "Saving..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl bg-white rounded p-6 shadow">
            <h3 className="text-lg font-semibold mb-3">Edit Listing</h3>
            <form onSubmit={submitEdit} className="space-y-3">
              <input className="w-full p-2 border rounded" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input className="w-full p-2 border rounded" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <input className="w-full p-2 border rounded" placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className="p-2 border rounded" placeholder="Longitude (e.g. -112.0740)" value={form.lon} onChange={e => setForm({ ...form, lon: e.target.value })} required />
                <input className="p-2 border rounded" placeholder="Latitude (e.g. 33.4484)" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} required />
              </div>
              <textarea className="w-full p-2 border rounded" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div className="flex justify-end gap-2">
                <button type="button" className="px-3 py-1 border rounded" onClick={() => { setShowEdit(false); setEditing(null); }}>Cancel</button>
                <button type="submit" className="px-3 py-1 bg-sky-600 text-white rounded">{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
