"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCanvas } from "@/lib/api/canvases";

export function useDeleteCanvas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCanvas,
    onSuccess: () => {
      // Invalidate ALL canvas queries to refresh all views
      // This covers: all files, my files, shared, and trash
      queryClient.invalidateQueries({
        queryKey: ["canvases"],
      });
    },
    onError: (error) => {
      console.error("Delete canvas error:", error);
    },
  });
}
