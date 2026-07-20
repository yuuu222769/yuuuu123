"use client";

import { Button } from "@/components/ui/button";
import {
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  Undo2,
  RotateCcw,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface StoryboardToolbarProps {
  shotCount: number;
  totalDuration: string;
  canUndo: boolean;
  canRedo: boolean;
  onAddShot: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRegenerateAll: () => void;
  onExportExcel: () => void;
  onExportWord: () => void;
}

export function StoryboardToolbar({
  shotCount,
  totalDuration,
  canUndo,
  canRedo,
  onAddShot,
  onUndo,
  onRedo,
  onRegenerateAll,
  onExportExcel,
  onExportWord,
}: StoryboardToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="h-10 px-4 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
      {/* Left: stats */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-stone-500">
          <span className="font-semibold text-stone-700">{shotCount}</span> 个镜头
        </span>
        <span className="text-[11px] text-stone-400">·</span>
        <span className="text-xs text-stone-500">
          总时长 <span className="font-medium text-stone-700">{totalDuration}</span>
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} title="撤销">
          <Undo2 size={13} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} title="重做">
          <RotateCcw size={13} />
        </Button>

        <span className="w-px h-4 bg-stone-200 mx-1" />

        <Button variant="ghost" size="sm" onClick={onAddShot}>
          <Plus size={14} />
          <span className="text-xs ml-1">添加镜头</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={onRegenerateAll}>
          <Sparkles size={13} />
          <span className="text-xs ml-1">全部重新生成</span>
        </Button>

        <span className="w-px h-4 bg-stone-200 mx-1" />

        {/* Export dropdown */}
        <div className="relative" ref={menuRef}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setExportOpen(!exportOpen)}
          >
            <Download size={13} />
            <span className="text-xs ml-1">导出</span>
            <ChevronDown size={10} className="ml-0.5" />
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-stone-200 rounded-lg shadow-lg py-1 min-w-[140px]">
              <button
                onClick={() => { onExportExcel(); setExportOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <FileSpreadsheet size={13} className="text-emerald-500" />
                导出 Excel (.xlsx)
              </button>
              <button
                onClick={() => { onExportWord(); setExportOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <FileText size={13} className="text-blue-500" />
                导出 Word (.docx)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
