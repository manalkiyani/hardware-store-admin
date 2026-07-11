"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, Package, FolderTree, Truck, Phone } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-teal-950 flex flex-col z-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-teal-900">
        <div className="w-8 h-8 bg-teal-800 rounded-lg flex items-center justify-center flex-shrink-0">
          <Wrench size={16} className="text-white" />
        </div>
        <div>
          <span className="font-semibold text-white text-sm leading-tight block">
            Welcome Hardware & Paint Store
          </span>
          <span className="flex items-center gap-1 text-teal-400 text-xs mt-0.5">
            <Phone size={10} />
            0301 5012299
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-teal-800 text-white"
                  : "text-teal-100 hover:bg-teal-900 hover:text-white"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Status badge */}
      <div className="px-4 py-4 border-t border-teal-900">
        <div className="flex items-center gap-2 px-3 py-2 bg-teal-900 rounded-lg">
          <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
          <span className="text-xs text-teal-300 truncate">
            localhost:1337
          </span>
        </div>
      </div>
    </aside>
  );
}
