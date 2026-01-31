"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/lib/components/dashboard/DashboardSidebar";
import {
  DashboardHeader,
  SortOption,
} from "@/lib/components/dashboard/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get sort from URL or default to 'last-modified'
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "last-modified",
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    // Update URL with sort param
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreateCanvas = () => {
    // TODO: Open create canvas modal
    console.log("Create canvas clicked");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader
          onCreateCanvas={handleCreateCanvas}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />

        {/* Page Content - Pass sortBy to children */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
