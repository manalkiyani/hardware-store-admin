"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, Package, FolderTree, Truck, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useSidebar } from "./sidebar-context";

const navItems = [
  { href: "/", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside className={clsx(
      "fixed left-0 top-0 h-screen bg-teal-950 flex flex-col z-10 transition-all duration-200",
      collapsed ? "w-16" : "w-56"
    )}>
      {/* Logo */}
      <div className={clsx(
        "flex items-center border-b border-teal-900 relative",
        collapsed ? "px-0 py-5 justify-center" : "gap-2.5 px-5 py-5"
      )}>
        <div className="w-8 h-8 bg-teal-800 rounded-lg flex items-center justify-center flex-shrink-0">
          <Wrench size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-semibold text-white text-sm leading-tight block">
              Welcome Hardware & Paint Store
            </span>
            <span className="flex items-center gap-1 text-teal-400 text-xs mt-0.5">
              <Phone size={10} />
              0301 5012299
            </span>
          </div>
        )}
        {/* Toggle button */}
        <button
          onClick={toggle}
          className={clsx(
            "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-teal-800 hover:bg-teal-700 border border-teal-700 rounded-full flex items-center justify-center text-white transition-colors"
          )}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-amber-400 text-teal-950 font-semibold"
                  : "text-teal-100 hover:bg-teal-900 hover:text-white"
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Status badge */}
      <div className="px-2 py-4 border-t border-teal-900">
        {collapsed ? (
          <div className="flex justify-center">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-teal-900 rounded-lg">
            <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
            <span className="text-xs text-teal-300 truncate">localhost:1337</span>
          </div>
        )}
      </div>
    </aside>
  );
}
