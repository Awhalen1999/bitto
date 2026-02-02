"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import { CanvasHeader } from "@/lib/components/canvas/CanvasHeader";
import { Library } from "@/lib/components/canvas/Library";
import { AssetPlacementProvider } from "@/lib/contexts/AssetPlacementContext";

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const fileId = params.id as string;

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <AssetPlacementProvider>
      <div className="fixed inset-0 flex flex-col bg-black">
        <CanvasHeader fileId={fileId} />

        <div className="flex-1 flex overflow-hidden relative min-h-0">
          <div className="flex-1 relative min-h-0">{children}</div>

          <Library
            fileId={fileId}
            isOpen={isDrawerOpen}
            onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
          />
        </div>
      </div>
    </AssetPlacementProvider>
  );
}
