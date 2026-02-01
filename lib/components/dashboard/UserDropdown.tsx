"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Settings, CreditCard, LogOut, ChevronDown } from "lucide-react";

export function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const initials =
    user?.displayName?.trim().split(/\s+/)[0]?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full p-2 hover:bg-neutral-800 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white text-sm font-medium shrink-0">
          {initials}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user?.displayName || user?.email?.split("@")[0] || "User"}
          </p>
          <p className="text-xs text-neutral-500">Free</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 overflow-hidden z-50">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-neutral-700 flex items-center gap-3"
          >
            <Settings className="w-4 h-4" />
            Account Settings
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-neutral-700 flex items-center gap-3"
          >
            <CreditCard className="w-4 h-4" />
            Billing
          </button>
          <div className="border-t border-neutral-700" />
          <button
            onClick={handleSignOut}
            className="w-full px-3 py-2.5 text-left text-sm text-red-400 hover:bg-neutral-700 flex items-center gap-3"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
