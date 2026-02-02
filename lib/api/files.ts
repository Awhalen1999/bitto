import { apiClient } from "./client";
import { SortOption } from "@/lib/components/dashboard/DashboardHeader";

export type ViewType = "all" | "my-files" | "shared" | "trash";

export interface File {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getFiles(
  view: ViewType,
  sort: SortOption,
): Promise<File[]> {
  return apiClient(`/api/files?view=${view}&sort=${sort}`);
}

export async function getFile(fileId: string): Promise<File> {
  return apiClient(`/api/files/${fileId}`);
}

export async function createFile(data: {
  name: string;
  file_type: string;
}): Promise<File> {
  return apiClient("/api/files", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFile(
  fileId: string,
  data: { name?: string },
): Promise<File> {
  return apiClient(`/api/files/${fileId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteFile(fileId: string): Promise<File> {
  return apiClient(`/api/files/${fileId}`, {
    method: "DELETE",
  });
}

export async function restoreFile(fileId: string): Promise<File> {
  return apiClient(`/api/files/${fileId}/restore`, {
    method: "POST",
  });
}

export async function permanentDeleteFile(
  fileId: string,
): Promise<{ success: boolean; id: string }> {
  return apiClient(`/api/files/${fileId}/permanent`, {
    method: "DELETE",
  });
}
