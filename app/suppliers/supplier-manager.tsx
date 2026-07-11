"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Pencil, AlertCircle, Check, X } from "lucide-react";
import clsx from "clsx";
import {
  createBrandSupplier,
  updateBrandSupplier,
  deleteBrandSupplier,
} from "@/lib/api";
import type { BrandSupplier } from "@/lib/types";
import { SUPPLIER_COLOR_OPTIONS, getSupplierColor } from "@/lib/supplier-colors";

interface SupplierManagerProps {
  initialSuppliers: BrandSupplier[];
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SUPPLIER_COLOR_OPTIONS.map((c) => (
        <button
          key={c.key}
          type="button"
          title={c.key}
          onClick={() => onChange(c.key)}
          style={{ backgroundColor: c.bg, borderColor: value === c.key ? c.text : "transparent" }}
          className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
        />
      ))}
    </div>
  );
}

export default function SupplierManager({
  initialSuppliers,
}: SupplierManagerProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState(initialSuppliers);

  // Add form
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newColor, setNewColor] = useState("violet");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editColor, setEditColor] = useState("violet");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const created = await createBrandSupplier({
        name: newName.trim(),
        contact_number: newContact.trim() || undefined,
        color: newColor,
      });
      setSuppliers((prev) => [...prev, created]);
      setNewName("");
      setNewContact("");
      setNewColor("violet");
      router.refresh();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add supplier");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(supplier: BrandSupplier) {
    setEditingId(supplier.documentId);
    setEditName(supplier.name);
    setEditContact(supplier.contact_number ?? "");
    setEditColor(supplier.color ?? "violet");
    setEditError(null);
  }

  async function handleSaveEdit(documentId: string) {
    if (!editName.trim()) return;
    setSaving(true);
    setEditError(null);
    try {
      const updated = await updateBrandSupplier(documentId, {
        name: editName.trim(),
        contact_number: editContact.trim() || undefined,
        color: editColor,
      });
      setSuppliers((prev) =>
        prev.map((s) => (s.documentId === documentId ? updated : s))
      );
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(documentId: string) {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBrandSupplier(documentId);
      setSuppliers((prev) => prev.filter((s) => s.documentId !== documentId));
      setConfirmDeleteId(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Add Supplier</h2>
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Supplier / brand name"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Contact Number
              </label>
              <input
                type="text"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                placeholder="+92 300 0000000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 mb-2">Chip Color</label>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>

          {addError && (
            <div className="flex items-center gap-2 text-sm text-red-600 mb-3">
              <AlertCircle size={13} />
              {addError}
            </div>
          )}

          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className={clsx(
              "inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg",
              "hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Plus size={14} />
            {adding ? "Adding…" : "Add Supplier"}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        {suppliers.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-400">
            No suppliers yet. Add one above.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">Contact Number</th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3"># Products</th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier, i) => {
                const isEditing = editingId === supplier.documentId;
                const color = getSupplierColor(supplier.color);
                return (
                  <tr
                    key={supplier.id}
                    className={i < suppliers.length - 1 ? "border-b border-slate-100 hover:bg-slate-50" : "hover:bg-slate-50"}
                  >
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-500"
                            autoFocus
                          />
                          <ColorPicker value={editColor} onChange={setEditColor} />
                        </div>
                      ) : (
                        <Link
                          href={`/?supplier=${supplier.id}`}
                          className="text-sm font-medium hover:opacity-80 transition-opacity"
                        >
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: color.bg, color: color.text }}
                          >
                            {supplier.name}
                          </span>
                        </Link>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editContact}
                          onChange={(e) => setEditContact(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-500"
                        />
                      ) : (
                        <span className="text-sm text-slate-500">
                          {supplier.contact_number ?? <span className="text-slate-300">—</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500 text-right">
                      {supplier.products?.length ?? 0}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isEditing ? (
                        <span className="inline-flex items-center gap-1">
                          {editError && <span className="text-xs text-red-600 mr-1">{editError}</span>}
                          <button onClick={() => handleSaveEdit(supplier.documentId)} disabled={saving}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors" title="Save">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors" title="Cancel">
                            <X size={14} />
                          </button>
                        </span>
                      ) : confirmDeleteId === supplier.documentId ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs text-slate-600">Delete?</span>
                          <button onClick={() => handleDelete(supplier.documentId)} disabled={deleting}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Confirm">
                            <Check size={13} />
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors" title="Cancel">
                            <X size={13} />
                          </button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <button onClick={() => startEdit(supplier)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setConfirmDeleteId(supplier.documentId)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {deleteError && (
          <div className="flex items-center gap-2 px-5 py-3 text-sm text-red-600 border-t border-slate-100">
            <AlertCircle size={13} />
            {deleteError}
          </div>
        )}
      </div>
    </div>
  );
}
