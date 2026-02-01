// app/canvas/[id]/layout.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import { CanvasHeader } from "@/lib/components/canvas/CanvasHeader";
import { AssetDrawer } from "@/lib/components/canvas/AssetDrawer";

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const canvasId = params.id as string;

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-950">
      {/* Header */}
      <CanvasHeader canvasId={canvasId} />

      {/* Main Content - FIXED positioning */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Canvas Area - FIXED */}
        <div className="flex-1 relative min-h-0">{children}</div>

        {/* Asset Drawer */}
        <AssetDrawer
          canvasId={canvasId}
          isOpen={isDrawerOpen}
          onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
        />
      </div>
    </div>
  );
}
