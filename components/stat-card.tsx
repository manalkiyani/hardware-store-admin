import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
}

export default function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className="w-11 h-11 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-teal-700" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
