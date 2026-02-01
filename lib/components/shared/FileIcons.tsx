import { Workflow } from "lucide-react";

const iconBoxBase =
  "shrink-0 bg-blue-500/20 border border-blue-500/30 rounded flex items-center justify-center";

interface CanvasFileIconProps {
  size?: "sm" | "md";
}

export function CanvasFileIcon({ size = "md" }: CanvasFileIconProps) {
  if (size === "sm") {
    return (
      <div className={`${iconBoxBase} w-6 h-6`}>
        <Workflow className="w-3.5 h-3.5 text-blue-400" />
      </div>
    );
  }
  return (
    <div className={`${iconBoxBase} w-7 h-7`}>
      <Workflow className="w-4 h-4 text-blue-400" />
    </div>
  );
}
