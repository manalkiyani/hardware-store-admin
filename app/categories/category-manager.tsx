"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, AlertCircle, Check, X } from "lucide-react";
import clsx from "clsx";
import { createCategory, deleteCategory } from "@/lib/api";
import type { Category } from "@/lib/types";
import { toPascalCase } from "@/lib/utils";

interface CategoryManagerProps {
  initialCategories: Category[];
}

export default function CategoryManager({
  initialCategories,
}: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const created = await createCategory({
        name: newName.trim(),
        slug: slugify(newName.trim()),
        description: newDescription.trim() || undefined,
        parent_category: newParentId ? parseInt(newParentId, 10) : null,
      });
      setCategories((prev) => [...prev, created]);
      setNewName("");
      setNewDescription("");
      setNewParentId("");
      router.refresh();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.documentId !== id));
      setConfirmDeleteId(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  function getParentName(cat: Category): string {
    if (!cat.parent_category) return "—";
    const parent = categories.find((c) => c.id === cat.parent_category?.id);
    return parent ? toPascalCase(parent.name) : "—";
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Add Category
        </h2>
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Parent Category
              </label>
              <select
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 bg-white"
              >
                <option value="">— None (top-level) —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
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
              "inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg",
              "hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Plus size={14} />
            {adding ? "Adding…" : "Add Category"}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        {categories.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-400">
            No categories yet. Add one above.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  Parent Category
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  Description
                </th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  # Products
                </th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr
                  key={cat.id}
                  className={
                    i < categories.length - 1
                      ? "border-b border-slate-100 hover:bg-slate-50"
                      : "hover:bg-slate-50"
                  }
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/?category=${cat.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-amber-600 transition-colors"
                    >
                      {toPascalCase(cat.name)}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500">
                    {getParentName(cat)}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500">
                    {cat.description ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500 text-right">
                    {cat.products?.length ?? 0}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {confirmDeleteId === cat.documentId ? (
                      <span className="inline-flex items-center gap-2 text-sm">
                        <span className="text-slate-600 text-xs">Delete?</span>
                        <button
                          onClick={() => handleDelete(cat.documentId)}
                          disabled={deleting}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Confirm delete"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                          title="Cancel"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(cat.documentId)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
