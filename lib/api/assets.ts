import { apiClient } from "./client";

export interface Asset {
  id: string;
  file_id: string;
  name: string;
  file_type: string;
  r2_url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z_index: number;
  created_at: string;
  updated_at: string;
}

export async function getFileAssets(fileId: string): Promise<Asset[]> {
  return apiClient(`/api/assets/file/${fileId}`);
}

export async function getAsset(assetId: string): Promise<Asset> {
  return apiClient(`/api/assets/${assetId}`);
}

export async function createAsset(data: {
  file_id: string;
  name: string;
  file_type: string;
  r2_url: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  z_index?: number;
}): Promise<Asset> {
  return apiClient("/api/assets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAsset(
  assetId: string,
  data: {
    name?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    z_index?: number;
  },
): Promise<Asset> {
  return apiClient(`/api/assets/${assetId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(
  assetId: string,
): Promise<{ success: boolean; id: string }> {
  return apiClient(`/api/assets/${assetId}`, {
    method: "DELETE",
  });
}
