"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FileText, User, Users, Trash2 } from "lucide-react";
import { UserDropdown } from "./UserDropdown";

const navItems = [
  { href: "/", label: "All files", icon: FileText },
  { href: "/my-files", label: "My files", icon: User },
  { href: "/shared", label: "Shared with me", icon: Users },
  { href: "/trash", label: "Trash", icon: Trash2 },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort");

  return (
    <div className="w-60 bg-black border-r border-neutral-800 flex flex-col h-screen">
      <div className="p-4 border-b border-neutral-800">
        <UserDropdown />
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          let href = item.href;
          if (currentSort && currentSort !== "last-modified") {
            href += `?sort=${currentSort}`;
          }

          return (
            <Link
              key={item.href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${isActive ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"}
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <div className="bg-neutral-800 rounded-lg p-3">
          <p className="text-xs text-neutral-400 mb-2">Upgrade for premium features</p>
          <button className="w-full bg-white text-black text-sm py-2 rounded-lg hover:bg-neutral-200 transition-colors font-medium">
            View plans
          </button>
        </div>
      </div>
    </div>
  );
}
