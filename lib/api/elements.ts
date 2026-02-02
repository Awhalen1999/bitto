import { apiClient } from "./client";

export type ElementType = "rectangle" | "line" | "text" | "asset";

export interface RectangleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface LineProps {
  points: number[];
  stroke?: string;
  strokeWidth?: number;
}

export interface TextProps {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fill?: string;
}

export interface AssetProps {
  asset_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ElementProps =
  | ({ type: "rectangle" } & RectangleProps)
  | ({ type: "line" } & LineProps)
  | ({ type: "text" } & TextProps)
  | ({ type: "asset" } & AssetProps);

export interface Element {
  id: string;
  file_id: string;
  type: ElementType;
  sort_index: number;
  props: RectangleProps | LineProps | TextProps | AssetProps;
  created_at: string;
  updated_at: string;
}

export async function getElements(fileId: string): Promise<Element[]> {
  return apiClient(`/api/elements?fileId=${encodeURIComponent(fileId)}`);
}

export async function getElement(elementId: string): Promise<Element> {
  return apiClient(`/api/elements/${elementId}`);
}

export async function createElement(data: {
  file_id: string;
  type: ElementType;
  sort_index: number;
  props: RectangleProps | LineProps | TextProps | AssetProps;
}): Promise<Element> {
  return apiClient("/api/elements", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateElement(
  elementId: string,
  data: {
    sort_index?: number;
    props?: Partial<RectangleProps | LineProps | TextProps | AssetProps>;
  },
): Promise<Element> {
  return apiClient(`/api/elements/${elementId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteElement(
  elementId: string,
): Promise<{ success: boolean; id: string }> {
  return apiClient(`/api/elements/${elementId}`, {
    method: "DELETE",
  });
}
