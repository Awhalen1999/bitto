import { apiClient } from "./client";
import { SortOption } from "@/lib/components/dashboard/DashboardHeader";

export type ViewType = "all" | "my-files" | "shared" | "trash";

export interface Canvas {
  id: string;
  name: string;
  owner_id: string;
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
