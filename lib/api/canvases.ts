import { apiClient } from "./client";
import { SortOption } from "@/lib/components/dashboard/DashboardHeader";

export type ViewType = "all" | "my-files" | "shared" | "trash";

export interface CanvasObject {
  id: string;
  type: "asset" | "group";
  assetId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  groupId?: string;
  zIndex: number;
  label?: string;
}

export interface CanvasData {
  version: number;
  objects: CanvasObject[];
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
}

export interface Canvas {
  id: string;
  name: string;
  owner_id: string;
  canvas_data: CanvasData | null;
  thumbnail_url: string | null;
  last_edited_at: string;
  created_at: string;
  deleted_at: string | null;
}

export async function getCanvases(
  view: ViewType,
  sort: SortOption,
): Promise<Canvas[]> {
  return apiClient(`/api/canvases?view=${view}&sort=${sort}`);
}

export async function getCanvas(canvasId: string): Promise<Canvas> {
  return apiClient(`/api/canvases/${canvasId}`);
}

export async function createCanvas(data: { name: string }): Promise<Canvas> {
  return apiClient("/api/canvases", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCanvas(
  canvasId: string,
  data: { name?: string; canvas_data?: CanvasData },
): Promise<Canvas> {
  return apiClient(`/api/canvases/${canvasId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCanvas(canvasId: string): Promise<Canvas> {
  return apiClient(`/api/canvases/${canvasId}`, {
    method: "DELETE",
  });
}

export async function restoreCanvas(canvasId: string): Promise<Canvas> {
  return apiClient(`/api/canvases/${canvasId}/restore`, {
    method: "POST",
  });
}

export async function permanentDeleteCanvas(
  canvasId: string,
): Promise<{ success: boolean; id: string }> {
  return apiClient(`/api/canvases/${canvasId}/permanent`, {
    method: "DELETE",
  });
}
