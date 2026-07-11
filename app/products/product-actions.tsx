"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, AlertCircle } from "lucide-react";
import { deleteProduct } from "@/lib/api";

interface ProductActionsProps {
  productId: string;
  productName: string;
}

export default function ProductActions({
  productId,
  productName,
}: ProductActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteProduct(productId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (error) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600">
        <AlertCircle size={12} />
        {error}
      </span>
    );
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="text-slate-600 text-xs">Delete &ldquo;{productName}&rdquo;?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {deleting ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 border border-slate-200 text-slate-600 rounded hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Link
        href={`/products/${productId}/edit`}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
        title="Edit"
      >
        <Pencil size={14} />
      </Link>
      <button
        onClick={() => setConfirming(true)}
        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </span>
  );
}
