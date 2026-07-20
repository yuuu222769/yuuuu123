"use client";

import { cn } from "@/lib/utils";
import type { ScriptSegment as ScriptSegmentType } from "@/types";
import { GripVertical } from "lucide-react";
import { useRef, useCallback } from "react";

const ROLE_LABELS: Record<string, string> = {
  hook: "🎯 开头钩子",
  body: "📝 正文",
  cta: "📢 结尾 CTA",
};

interface ScriptSegmentProps {
  segment: ScriptSegmentType;
  isActive: boolean;
  onSelect: (segmentId: string) => void;
  onTextSelect: (text: string, rect: DOMRect) => void;
  onTextDeselect: () => void;
  onChange: (id: string, content: string) => void;
}

export function ScriptSegment({
  segment,
  isActive,
  onSelect,
  onTextSelect,
  onTextDeselect,
  onChange,
}: ScriptSegmentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      onTextDeselect();
      return;
    }

    // Check if selection is within this segment
    if (
      contentRef.current &&
      contentRef.current.contains(selection.anchorNode)
    ) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      onTextSelect(selection.toString().trim(), rect);
    }
  }, [onTextSelect, onTextDeselect]);

  return (
    <div
      className={cn(
        "group relative rounded-lg border transition-colors",
        isActive
          ? "border-amber-300 bg-amber-50/30 ring-1 ring-amber-200"
          : "border-transparent hover:border-stone-200 hover:bg-stone-50/50"
      )}
      onClick={() => onSelect(segment.id)}
    >
      {/* Role label */}
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0.5">
        <GripVertical
          size={12}
          className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <span className="text-[11px] font-medium text-stone-400">
          {ROLE_LABELS[segment.role] || `段落 ${segment.index + 1}`}
        </span>
      </div>

      {/* Editable content */}
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        className="px-3 pb-3 pt-1 text-sm text-stone-800 leading-relaxed outline-none focus:ring-0 whitespace-pre-wrap"
        onMouseUp={handleMouseUp}
        onKeyUp={handleMouseUp}
        onBlur={(e) => {
          const newContent = e.currentTarget.innerText;
          if (newContent !== segment.content) {
            onChange(segment.id, newContent);
          }
        }}
        dangerouslySetInnerHTML={{ __html: segment.content }}
      />

      {/* Char count */}
      <div className="absolute right-2 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-stone-400">
          {segment.content.length} 字
        </span>
      </div>
    </div>
  );
}
