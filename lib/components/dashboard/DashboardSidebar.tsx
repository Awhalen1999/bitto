"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, User, Users, Trash2 } from "lucide-react";
import { UserDropdown } from "./UserDropdown";

const navItems = [
  { view: "all", label: "All files", icon: FileText },
  { view: "my-files", label: "My files", icon: User },
  { view: "shared", label: "Shared with me", icon: Users },
  { view: "trash", label: "Trash", icon: Trash2 },
];

export function DashboardSidebar() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "all";

  return (
    <div className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen">
      {/* User Dropdown at Top */}
      <div className="p-4 border-b border-zinc-800">
        <UserDropdown />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;

          return (
            <Link
              key={item.view}
              href={`/?view=${item.view}`}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA at Bottom */}
      <div className="p-4 border-t border-zinc-800">
        <div className="bg-zinc-800 rounded-lg p-3">
          <p className="text-xs text-zinc-400 mb-2">
            Upgrade for premium features
          </p>
          <button className="w-full bg-white text-black text-sm py-2 rounded-md hover:bg-zinc-200 transition-colors font-medium">
            View plans
          </button>
        </div>
      </div>
    </div>
  );
}
