"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
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
  const searchParams = useSearchParams();

  const sortBy = (searchParams.get("sort") as SortOption) || "last-modified";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleSortChange = (newSort: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());

    // If default, remove from URL
    if (newSort === "last-modified") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }

    // Keep current path, just update query
    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(`${window.location.pathname}${newUrl}`, { scroll: false });
  };

  const handleCreateCanvas = () => {
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
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onCreateCanvas={handleCreateCanvas}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
