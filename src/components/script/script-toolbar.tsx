"use client";

import { cn } from "@/lib/utils";
import type { AIAction } from "@/types";
import {
  Zap,
  MessageCircle,
  Swords,
  Heart,
  Shrink,
  Expand,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const ACTION_BUTTONS: {
  action: AIAction;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}[] = [
  { action: "optimize", label: "优化表达", icon: Zap },
  { action: "colloquial", label: "更口语化", icon: MessageCircle },
  { action: "conflict", label: "增强冲突", icon: Swords },
  { action: "emotion", label: "增强情绪", icon: Heart },
  { action: "shorten", label: "缩短", icon: Shrink },
  { action: "expand", label: "扩展", icon: Expand },
  { action: "de_ai", label: "降低AI感", icon: Sparkles },
];

interface ScriptToolbarProps {
  selectedText: string;
  onAction: (action: AIAction) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export function ScriptToolbar({
  selectedText,
  onAction,
  onClose,
  position,
}: ScriptToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay to avoid immediate close from the selection click
    setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-white border border-stone-200 rounded-xl shadow-lg py-1.5 px-1.5"
      style={{
        top: Math.max(0, position.top - 50),
        left: Math.max(8, Math.min(position.left - 100, window.innerWidth - 420)),
      }}
    >
      <div className="flex items-center gap-0.5 flex-wrap">
        {ACTION_BUTTONS.map(({ action, label, icon: Icon }) => (
          <button
            key={action}
            onClick={() => onAction(action)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer whitespace-nowrap"
            title={label}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="mt-1 pt-1 border-t border-stone-100 px-1">
        <p className="text-[10px] text-stone-400 truncate max-w-[380px]">
          已选：{selectedText.slice(0, 40)}{selectedText.length > 40 ? "…" : ""}
        </p>
      </div>
    </div>
  );
}
