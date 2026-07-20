"use client";

import { Button } from "@/components/ui/button";
import type { AIAction } from "@/types";
import { Check, X, Sparkles, Loader2 } from "lucide-react";

interface DiffData {
  modifiedText: string;
  reason: string;
}

interface ScriptDiffPanelProps {
  originalText: string;
  action: AIAction;
  diff: DiffData | null;
  loading: boolean;
  onConfirm: () => void;
  onReject: () => void;
}

const ACTION_LABELS: Record<AIAction, string> = {
  optimize: "优化表达",
  colloquial: "更口语化",
  conflict: "增强冲突",
  emotion: "增强情绪",
  shorten: "缩短内容",
  expand: "扩展内容",
  de_ai: "降低AI感",
};

export function ScriptDiffPanel({
  originalText,
  action,
  diff,
  loading,
  onConfirm,
  onReject,
}: ScriptDiffPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
            <Sparkles size={12} className="text-amber-600" />
          </div>
          <span className="text-sm font-medium text-stone-700">
            AI 修改建议 · {ACTION_LABELS[action]}
          </span>
        </div>
        <button
          onClick={onReject}
          className="p-1 rounded-md hover:bg-stone-200 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Original */}
        <div>
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wide mb-1.5">
            修改前
          </p>
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-100">
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
              {originalText}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-amber-500">
              <path d="M6 1.5v9M2.5 5L6 1.5 9.5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Modified */}
        <div>
          <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wide mb-1.5">
            修改后
          </p>
          {loading || !diff ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-amber-500" />
              <span className="text-sm text-stone-500 ml-2">AI 正在修改…</span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
              <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
                {diff.modifiedText}
              </p>
            </div>
          )}
        </div>

        {/* Reason */}
        {diff?.reason && (
          <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
            <span className="text-xs mt-0.5">💡</span>
            <p className="text-xs text-blue-700 leading-relaxed">{diff.reason}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {diff && !loading && (
        <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onReject}>
            <X size={14} />
            放弃修改
          </Button>
          <Button size="sm" onClick={onConfirm}>
            <Check size={14} />
            采用修改
          </Button>
        </div>
      )}
    </div>
  );
}
