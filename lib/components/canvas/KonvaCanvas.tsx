"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  Hand,
  FilePlus,
  Lock,
  MessageSquare,
  Minus,
  MousePointer2,
  Move,
  PencilLine,
  Plus,
  Redo2,
  Square,
  Type,
  Undo2,
} from "lucide-react";
import { Stage, Layer, Rect, Line, Group, Text, Transformer } from "react-konva";
import type Konva from "konva";
import { useFile } from "@/lib/hooks/useFile";
import { useCanvasElements } from "@/lib/hooks/useCanvasElements";
import { useFileAssets } from "@/lib/hooks/useFileAssets";
import { useAssetPlacement } from "@/lib/contexts/AssetPlacementContext";
import type {
  Element,
  RectangleProps,
  LineProps,
  TextProps,
  AssetProps,
} from "@/lib/api/elements";

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_INCREMENT = 0.1;

const CANVAS_SIZE = 8000;
const CANVAS_HALF = CANVAS_SIZE / 2;
const GRID_SPACING = 40;
const GRID_STROKE = "#404040";
const GRID_STROKE_WIDTH = 0.5;
const CANVAS_FILL = "#171717";

const DEFAULT_ASSET_SIZE = { width: 120, height: 80 };
const MIN_RECT_SIZE = 4;
const LOG_PREFIX = "[Canvas]";

type CanvasTool =
  | "lock"
  | "hand"
  | "pointer"
  | "rectangle"
  | "line"
  | "text"
  | "asset"
  | "comment";

/** Keep the visible area inside the canvas so we never show black outside the grid. */
function clampViewport(
  x: number,
  y: number,
  scale: number,
  width: number,
  height: number,
) {
  const s = scale;
  const c = CANVAS_HALF;
  let minX = Math.max(width - c * s, -c * s);
  let maxX = Math.min(c * s, width + c * s);
  let minY = Math.max(height - c * s, -c * s);
  let maxY = Math.min(c * s, height + c * s);
  if (minX > maxX) {
    minX = -c * s;
    maxX = width + c * s;
  }
  if (minY > maxY) {
    minY = -c * s;
    maxY = height + c * s;
  }
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

interface KonvaCanvasProps {
  fileId: string;
}

export function KonvaCanvas({ fileId }: KonvaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [tool, setTool] = useState<CanvasTool>("hand");
  const [isPanning, setIsPanning] = useState(false);

  const { data: file, isLoading: isFileLoading } = useFile(fileId);
  const {
    elements,
    isLoading: isElementsLoading,
    isSaving,
    lastSavedAt,
    createElement: createElementLocal,
    updateElement: updateElementLocal,
  } = useCanvasElements(fileId);
  const { data: assets = [] } = useFileAssets(fileId);
  const { selectedAssetId, setSelectedAssetId } = useAssetPlacement();

  const [lineStartPoint, setLineStartPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [lineEndPoint, setLineEndPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [rectDrawStart, setRectDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [rectDrawCurrent, setRectDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const selectedNodeRef = useRef<Konva.Node | null>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const assetMap = useMemo(
    () => new Map(assets.map((a) => [a.id, a])),
    [assets],
  );

  const sortedElements = useMemo(
    () => [...elements].sort((a, b) => a.sort_index - b.sort_index),
    [elements],
  );

  const measureRef = useRef(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w > 0 && h > 0) setDimensions({ width: w, height: h });
  });

  useLayoutEffect(() => {
    measureRef.current();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measureRef.current);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fileId]);

  const zoomBy = useCallback(
    (direction: 1 | -1) => {
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = viewport.scale;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, oldScale + direction * ZOOM_INCREMENT),
      );
      if (newScale === oldScale) return;

      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const sceneX = (centerX - viewport.x) / oldScale;
      const sceneY = (centerY - viewport.y) / oldScale;
      let newX = centerX - sceneX * newScale;
      let newY = centerY - sceneY * newScale;
      const clamped = clampViewport(
        newX,
        newY,
        newScale,
        dimensions.width,
        dimensions.height,
      );
      newX = clamped.x;
      newY = clamped.y;

      stage.scale({ x: newScale, y: newScale });
      stage.position({ x: newX, y: newY });
      setViewport({ x: newX, y: newY, scale: newScale });
    },
    [viewport, dimensions],
  );

  const setToolWithReset = useCallback(
    (newTool: CanvasTool) => {
      setTool(newTool);
      if (newTool !== "line") {
        setLineStartPoint(null);
        setLineEndPoint(null);
      }
      if (newTool !== "pointer") {
        setSelectedElementId(null);
      }
      if (newTool !== "rectangle") {
        setRectDrawStart(null);
        setRectDrawCurrent(null);
      }
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomBy(1);
      } else if (e.key === "-") {
        e.preventDefault();
        zoomBy(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomBy]);

  const handleStageDragStart = useCallback(() => {
    setIsPanning(true);
  }, []);

  const handleStageDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const scale = stageRef.current?.scaleX() ?? viewport.scale;
      const { x, y } = clampViewport(
        e.target.x(),
        e.target.y(),
        scale,
        dimensions.width,
        dimensions.height,
      );
      setViewport((prev) => ({ ...prev, x, y }));
    },
    [viewport.scale, dimensions],
  );

  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsPanning(false);
      const scale = stageRef.current?.scaleX() ?? viewport.scale;
      const { x, y } = clampViewport(
        e.target.x(),
        e.target.y(),
        scale,
        dimensions.width,
        dimensions.height,
      );
      stageRef.current?.position({ x, y });
      setViewport((prev) => ({ ...prev, x, y }));
    },
    [viewport.scale, dimensions],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      if (tool === "lock") return;
      const stage = stageRef.current;
      if (!stage) return;

      const dx = e.evt.deltaX;
      const dy = e.evt.deltaY;
      const { x: newX, y: newY } = clampViewport(
        viewport.x + dx,
        viewport.y + dy,
        viewport.scale,
        dimensions.width,
        dimensions.height,
      );

      stage.position({ x: newX, y: newY });
      setViewport((prev) => ({ ...prev, x: newX, y: newY }));
    },
    [tool, viewport, dimensions],
  );

  const centerView = useCallback(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const { x, y } = clampViewport(
      centerX,
      centerY,
      viewport.scale,
      dimensions.width,
      dimensions.height,
    );
    stageRef.current?.position({ x, y });
    setViewport((prev) => ({ ...prev, x, y }));
  }, [viewport.scale, dimensions]);

  const getScenePosition = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return null;
      const pos = stage.getPointerPosition();
      if (!pos) return null;
      const scale = stage.scaleX();
      const stagePos = stage.position();
      return {
        x: (pos.x - stagePos.x) / scale,
        y: (pos.y - stagePos.y) / scale,
      };
    },
    [],
  );

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool !== "rectangle") return;
      let node: Konva.Node | null = e.target;
      while (node) {
        if (node.getAttr?.("name") === "element") return;
        node = node.getParent();
      }
      const pos = getScenePosition(e);
      if (!pos) return;
      const inBounds =
        pos.x >= -CANVAS_HALF &&
        pos.x <= CANVAS_HALF &&
        pos.y >= -CANVAS_HALF &&
        pos.y <= CANVAS_HALF;
      if (!inBounds) return;
      setRectDrawStart(pos);
      setRectDrawCurrent(pos);
    },
    [tool, getScenePosition],
  );

  const handleStageMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool !== "rectangle" || !rectDrawStart) return;
      const pos = getScenePosition(e);
      if (!pos) {
        setRectDrawStart(null);
        setRectDrawCurrent(null);
        return;
      }
      const x = Math.min(rectDrawStart.x, pos.x);
      const y = Math.min(rectDrawStart.y, pos.y);
      let width = Math.abs(pos.x - rectDrawStart.x);
      let height = Math.abs(pos.y - rectDrawStart.y);
      if (width < MIN_RECT_SIZE && height < MIN_RECT_SIZE) {
        setRectDrawStart(null);
        setRectDrawCurrent(null);
        return;
      }
      width = Math.max(width, MIN_RECT_SIZE);
      height = Math.max(height, MIN_RECT_SIZE);

      const nextSortIndex =
        elements.length > 0
          ? Math.max(...elements.map((el) => el.sort_index)) + 1
          : 0;
      createElementLocal({
        type: "rectangle",
        sort_index: nextSortIndex,
        props: {
          x,
          y,
          width,
          height,
          stroke: "#52525b",
          strokeWidth: 1,
        },
      });
      setRectDrawStart(null);
      setRectDrawCurrent(null);
    },
    [
      tool,
      rectDrawStart,
      elements,
      createElementLocal,
      getScenePosition,
    ],
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool === "hand" || tool === "lock" || tool === "comment") return;
      if (tool === "pointer") {
        let node: Konva.Node | null = e.target;
        while (node) {
          if (node.getAttr?.("name") === "element") return;
          node = node.getParent();
        }
        setSelectedElementId(null);
        return;
      }
      if (tool === "rectangle") return;
      let node: Konva.Node | null = e.target;
      while (node) {
        if (node.getAttr?.("name") === "element") return;
        node = node.getParent();
      }
      const pos = getScenePosition(e);
      if (!pos) return;

      const inBounds =
        pos.x >= -CANVAS_HALF &&
        pos.x <= CANVAS_HALF &&
        pos.y >= -CANVAS_HALF &&
        pos.y <= CANVAS_HALF;
      if (!inBounds) return;

      const nextSortIndex =
        elements.length > 0
          ? Math.max(...elements.map((el) => el.sort_index)) + 1
          : 0;

      if (tool === "text") {
        createElementLocal({
          type: "text",
          sort_index: nextSortIndex,
          props: {
            x: pos.x,
            y: pos.y,
            text: "Text",
            fontSize: 14,
            fill: "#ffffff",
          },
        });
      } else if (tool === "asset" && selectedAssetId) {
        console.log(`${LOG_PREFIX} Stage click: place asset ${selectedAssetId} at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
        createElementLocal({
          type: "asset",
          sort_index: nextSortIndex,
          props: {
            asset_id: selectedAssetId,
            x: pos.x,
            y: pos.y,
            width: DEFAULT_ASSET_SIZE.width,
            height: DEFAULT_ASSET_SIZE.height,
          },
        });
        setSelectedAssetId(null);
      } else if (tool === "line") {
        if (lineStartPoint) {
          createElementLocal({
            type: "line",
            sort_index: nextSortIndex,
            props: {
              points: [
                lineStartPoint.x,
                lineStartPoint.y,
                pos.x,
                pos.y,
              ],
              stroke: "#a3a3a3",
              strokeWidth: 2,
            },
          });
          setLineStartPoint(null);
          setLineEndPoint(null);
        } else {
          setLineStartPoint(pos);
          setLineEndPoint(pos);
        }
      }
    },
    [
      tool,
      elements,
      createElementLocal,
      selectedAssetId,
      lineStartPoint,
      getScenePosition,
      setSelectedAssetId,
    ],
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = getScenePosition(e);
      if (!pos) return;
      if (lineStartPoint && tool === "line") setLineEndPoint(pos);
      else if (rectDrawStart && tool === "rectangle") setRectDrawCurrent(pos);
    },
    [lineStartPoint, rectDrawStart, tool, getScenePosition],
  );

  useLayoutEffect(() => {
    if (!selectedElementId || !transformerRef.current) return;
    if (selectedNodeRef.current) {
      transformerRef.current.nodes([selectedNodeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedElementId, sortedElements]);

  const stagePosition = useMemo(
    () =>
      dimensions.width > 0 && dimensions.height > 0
        ? clampViewport(
            viewport.x,
            viewport.y,
            viewport.scale,
            dimensions.width,
            dimensions.height,
          )
        : { x: viewport.x, y: viewport.y },
    [
      viewport.x,
      viewport.y,
      viewport.scale,
      dimensions.width,
      dimensions.height,
    ],
  );

  const gridLines = useMemo(() => {
    const lines: [number, number, number, number][] = [];
    for (let i = -CANVAS_HALF; i <= CANVAS_HALF; i += GRID_SPACING) {
      lines.push([i, -CANVAS_HALF, i, CANVAS_HALF]);
      lines.push([-CANVAS_HALF, i, CANVAS_HALF, i]);
    }
    return lines;
  }, []);

  const isLoading = isFileLoading || isElementsLoading;
  const isNotFound = !isLoading && !file;

  const toolButtonClass =
    "flex h-8 w-8 items-center justify-center text-neutral-400 hover:bg-neutral-800 transition-colors";
  const toolButtonActiveClass = "bg-neutral-800 text-neutral-100";

  const cursorClass =
    tool === "lock"
      ? "cursor-not-allowed"
      : tool === "hand"
        ? isPanning
          ? "cursor-grabbing"
          : "cursor-grab"
        : tool === "rectangle" ||
            tool === "line" ||
            tool === "text" ||
            tool === "asset" ||
            tool === "comment"
          ? "cursor-crosshair"
          : "cursor-default";

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 bg-black ${cursorClass}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black">
          <p className="text-sm text-neutral-400">Loading canvas...</p>
        </div>
      )}

      {isNotFound && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black">
          <p className="text-sm text-neutral-500">Canvas not found</p>
        </div>
      )}

      {!isLoading && !isNotFound && dimensions.width > 0 && dimensions.height > 0 && (
        <>
      <div className="absolute top-3 left-3 z-10 flex cursor-pointer items-center gap-2">
        <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900 shadow-sm">
          <button
            type="button"
            onClick={() => setTool("lock")}
            className={`rounded-l-md ${toolButtonClass} ${tool === "lock" ? toolButtonActiveClass : ""}`}
            title="Lock (no movement)"
            aria-label="Lock canvas"
            aria-pressed={tool === "lock"}
          >
            <Lock className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setToolWithReset("hand")}
            className={`border-l border-neutral-700 ${toolButtonClass} ${tool === "hand" ? toolButtonActiveClass : ""}`}
            title="Hand (pan canvas)"
            aria-label="Hand tool"
            aria-pressed={tool === "hand"}
          >
            <Hand className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool("pointer")}
            className={`border-l border-neutral-700 ${toolButtonClass} ${tool === "pointer" ? toolButtonActiveClass : ""}`}
            title="Pointer (select items)"
            aria-label="Pointer tool"
            aria-pressed={tool === "pointer"}
          >
            <MousePointer2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={centerView}
            className="rounded-r-md border-l border-neutral-700 flex h-8 w-8 items-center justify-center text-neutral-400 hover:bg-neutral-800 transition-colors"
            title="Center view at 0,0"
            aria-label="Center view"
          >
            <Move className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900 shadow-sm">
          <button
            type="button"
            onClick={() => setToolWithReset("rectangle")}
            className={`rounded-l-md ${toolButtonClass} ${tool === "rectangle" ? toolButtonActiveClass : ""}`}
            title="Rectangle"
            aria-label="Rectangle (draw)"
            aria-pressed={tool === "rectangle"}
          >
            <Square className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool("line")}
            className={`border-l border-neutral-700 ${toolButtonClass} ${tool === "line" ? toolButtonActiveClass : ""}`}
            title="Line"
            aria-label="Line (draw)"
            aria-pressed={tool === "line"}
          >
            <PencilLine className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setToolWithReset("text")}
            className={`border-l border-neutral-700 ${toolButtonClass} ${tool === "text" ? toolButtonActiveClass : ""}`}
            title="Text"
            aria-label="Text (draw)"
            aria-pressed={tool === "text"}
          >
            <Type className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool("asset")}
            className={`border-l border-neutral-700 ${toolButtonClass} ${tool === "asset" ? toolButtonActiveClass : ""}`}
            title="Add asset (click canvas to upload at that spot)"
            aria-label="Add asset (upload)"
            aria-pressed={tool === "asset"}
          >
            <FilePlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setToolWithReset("comment")}
            className={`rounded-r-md border-l border-neutral-700 ${toolButtonClass} ${tool === "comment" ? toolButtonActiveClass : ""}`}
            title="Add comment"
            aria-label="Add comment"
            aria-pressed={tool === "comment"}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable={tool === "hand" && !selectedElementId}
        dragBoundFunc={(pos) =>
          clampViewport(
            pos.x,
            pos.y,
            viewport.scale,
            dimensions.width,
            dimensions.height,
          )
        }
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        onClick={handleStageClick}
        onMouseMove={handleStageMouseMove}
        onDragStart={handleStageDragStart}
        onDragMove={handleStageDragMove}
        onDragEnd={handleStageDragEnd}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
      >
        <Layer listening={false}>
          <Rect
            x={-CANVAS_HALF}
            y={-CANVAS_HALF}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            fill={CANVAS_FILL}
            listening={false}
          />
          {gridLines.map((points, i) => (
            <Line
              key={i}
              points={points}
              stroke={GRID_STROKE}
              strokeWidth={GRID_STROKE_WIDTH}
              listening={false}
            />
          ))}
        </Layer>
        <Layer listening={true}>
          {sortedElements
            .filter((el) => el.id !== selectedElementId)
            .map((element) => (
              <ElementNode
                key={element.id}
                element={element}
                assetMap={assetMap}
                tool={tool}
                isSelected={false}
                onSelect={() => setSelectedElementId(element.id)}
                selectedNodeRef={undefined}
                onUpdate={(props) =>
                  updateElementLocal(element.id, { props })
                }
              />
            ))}
          {lineStartPoint && lineEndPoint && tool === "line" && (
            <Line
              points={[
                lineStartPoint.x,
                lineStartPoint.y,
                lineEndPoint.x,
                lineEndPoint.y,
              ]}
              stroke="#a3a3a3"
              strokeWidth={2}
              dash={[4, 4]}
              listening={false}
            />
          )}
          {rectDrawStart && rectDrawCurrent && tool === "rectangle" && (
            <Rect
              x={Math.min(rectDrawStart.x, rectDrawCurrent.x)}
              y={Math.min(rectDrawStart.y, rectDrawCurrent.y)}
              width={Math.abs(rectDrawCurrent.x - rectDrawStart.x)}
              height={Math.abs(rectDrawCurrent.y - rectDrawStart.y)}
              stroke="#52525b"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )}
          {selectedElementId &&
            ["rectangle", "asset"].includes(
              elements.find((e) => e.id === selectedElementId)?.type ?? "",
            ) && (
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              rotateLineVisible={false}
              boundBoxFunc={(oldBox, newBox) => {
                if (
                  Math.abs(newBox.width) < MIN_RECT_SIZE ||
                  Math.abs(newBox.height) < MIN_RECT_SIZE
                ) {
                  return oldBox;
                }
                return newBox;
              }}
              onTransformEnd={() => {
                const node = selectedNodeRef.current;
                if (!node || !selectedElementId) return;
                const el = elements.find((x) => x.id === selectedElementId);
                if (!el || (el.type !== "rectangle" && el.type !== "asset"))
                  return;
                const props = el.props as RectangleProps | AssetProps;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                updateElementLocal(selectedElementId, {
                  props: {
                    ...props,
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(MIN_RECT_SIZE, (props.width ?? 0) * scaleX),
                    height: Math.max(MIN_RECT_SIZE, (props.height ?? 0) * scaleY),
                  },
                });
              }}
            />
          )}
          {selectedElementId &&
            sortedElements
              .filter((el) => el.id === selectedElementId)
              .map((element) => (
                <ElementNode
                  key={element.id}
                  element={element}
                  assetMap={assetMap}
                  tool={tool}
                  isSelected={true}
                  onSelect={() => setSelectedElementId(element.id)}
                  selectedNodeRef={selectedNodeRef}
                  transformerRef={transformerRef}
                  onUpdate={(props) =>
                    updateElementLocal(element.id, { props })
                  }
                />
              ))}
        </Layer>
      </Stage>

      <div className="absolute bottom-3 left-3 flex cursor-pointer items-center gap-2">
        {(isSaving || lastSavedAt) && (
          <div
            className="flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-700 bg-neutral-900/90 text-xs"
            aria-live="polite"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-neutral-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Saved
              </span>
            )}
          </div>
        )}
        <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900 shadow-sm">
          <button
            type="button"
            onClick={() => zoomBy(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-l-md text-neutral-400 hover:bg-neutral-800"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span
            className="min-w-12 px-2 text-center text-xs font-medium text-neutral-300"
            aria-live="polite"
          >
            {Math.round(viewport.scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoomBy(1)}
            className="flex h-8 w-8 items-center justify-center rounded-r-md text-neutral-400 hover:bg-neutral-800"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900 shadow-sm">
          <button
            type="button"
            disabled
            className="flex h-8 w-8 items-center justify-center rounded-l-md text-neutral-500 cursor-not-allowed"
            title="Undo (coming soon)"
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled
            className="flex h-8 w-8 items-center justify-center rounded-r-md border-l border-neutral-700 text-neutral-500 cursor-not-allowed"
            title="Redo (coming soon)"
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

interface ElementNodeProps {
  element: Element;
  assetMap: Map<string, { id: string; name: string }>;
  tool: CanvasTool;
  isSelected?: boolean;
  onSelect?: () => void;
  selectedNodeRef?: React.MutableRefObject<Konva.Node | null>;
  transformerRef?: React.RefObject<Konva.Transformer | null>;
  onUpdate: (props: Partial<RectangleProps | LineProps | TextProps | AssetProps>) => void;
}

function ElementNode({
  element,
  assetMap,
  tool,
  isSelected,
  onSelect,
  selectedNodeRef,
  transformerRef,
  onUpdate,
}: ElementNodeProps) {
  const draggable = tool === "pointer";
  const canSelect = tool === "pointer";

  const handleDragStart = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
    },
    [],
  );

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      transformerRef?.current?.forceUpdate();
      transformerRef?.current?.getLayer()?.batchDraw();
    },
    [transformerRef],
  );

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (canSelect && onSelect) onSelect();
    },
    [canSelect, onSelect],
  );

  const setRef = useCallback(
    (node: Konva.Node | null) => {
      if (selectedNodeRef) {
        selectedNodeRef.current = isSelected ? node : null;
      }
    },
    [selectedNodeRef, isSelected],
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      const node = e.target;
      const x = node.x();
      const y = node.y();
      if (element.type === "rectangle" || element.type === "text") {
        const props = element.props as RectangleProps | TextProps;
        onUpdate({ ...props, x, y });
      } else if (element.type === "asset") {
        const props = element.props as AssetProps;
        onUpdate({ ...props, x, y });
      }
      transformerRef?.current?.forceUpdate();
    },
    [element, onUpdate, transformerRef],
  );

  if (element.type === "rectangle") {
    const p = element.props as RectangleProps;
    return (
      <Group
        ref={setRef}
        name="element"
        x={p.x}
        y={p.y}
        draggable={draggable}
        cursor={draggable ? "grab" : "default"}
        onClick={handleClick}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        dragBoundFunc={(pos) => ({
          x: Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF - p.width, pos.x)),
          y: Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF - p.height, pos.y)),
        })}
      >
        <Rect
          x={0}
          y={0}
          width={p.width}
          height={p.height}
          fill={p.fill ?? "transparent"}
          stroke={p.stroke ?? "#52525b"}
          strokeWidth={p.strokeWidth ?? 1}
        />
      </Group>
    );
  }

  if (element.type === "line") {
    const p = element.props as LineProps;
    return (
      <Line
        ref={setRef}
        name="element"
        points={p.points}
        stroke={p.stroke ?? "#a3a3a3"}
        strokeWidth={p.strokeWidth ?? 2}
        cursor={canSelect ? "pointer" : "default"}
        onClick={handleClick}
        listening={true}
      />
    );
  }

  if (element.type === "text") {
    const p = element.props as TextProps;
    return (
      <Group
        ref={setRef}
        name="element"
        x={p.x}
        y={p.y}
        draggable={draggable}
        cursor={draggable ? "grab" : "default"}
        onClick={handleClick}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        dragBoundFunc={(pos) => ({
          x: Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF, pos.x)),
          y: Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF, pos.y)),
        })}
      >
        <Text
          x={0}
          y={0}
          text={p.text}
          fontSize={p.fontSize ?? 14}
          fill={p.fill ?? "#ffffff"}
          fontFamily="system-ui, sans-serif"
          listening={false}
        />
      </Group>
    );
  }

  if (element.type === "asset") {
    const p = element.props as AssetProps;
    const asset = assetMap.get(p.asset_id);
    return (
      <Group
        ref={setRef}
        name="element"
        x={p.x}
        y={p.y}
        draggable={draggable}
        cursor={draggable ? "grab" : "default"}
        onClick={handleClick}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        dragBoundFunc={(pos) => ({
          x: Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF - p.width, pos.x)),
          y: Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF - p.height, pos.y)),
        })}
      >
        <Rect
          x={0}
          y={0}
          width={p.width}
          height={p.height}
          fill="#404040"
          stroke="#52525b"
          strokeWidth={1}
        />
        <Text
          x={0}
          y={p.height / 2 - 8}
          width={p.width}
          text={asset?.name ?? "Asset"}
          fontSize={12}
          fontFamily="system-ui, sans-serif"
          fill="white"
          align="center"
          listening={false}
        />
      </Group>
    );
  }

  return null;
}
