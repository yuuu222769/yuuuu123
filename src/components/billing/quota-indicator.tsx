"use client";

import { cn } from "@/lib/utils";
import { Sparkles, AlertCircle } from "lucide-react";

interface QuotaIndicatorProps {
  used: number;
  total: number;
  planTier: string;
  compact?: boolean;
}

export function QuotaIndicator({ used, total, planTier, compact }: QuotaIndicatorProps) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 100;
  const low = pct > 80;
  const exhausted = used >= total;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" title={`${used}/${total} AI 次数`}>
        <div className="w-16 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              exhausted ? "bg-red-400" : low ? "bg-amber-400" : "bg-stone-700"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-stone-400">{used}/{total}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-stone-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className={exhausted ? "text-red-400" : "text-stone-600"} />
          <span className="text-xs font-medium text-stone-700">AI 额度</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 uppercase">{planTier}</span>
        </div>
        <span className="text-xs text-stone-500">{used} / {total}</span>
      </div>
      <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            exhausted ? "bg-red-400" : low ? "bg-amber-400" : "bg-stone-700"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {exhausted && (
        <div className="flex items-center gap-1 mt-2 text-[11px] text-red-500">
          <AlertCircle size={11} />
          额度已用尽，请升级套餐
        </div>
      )}
      {low && !exhausted && (
        <div className="flex items-center gap-1 mt-2 text-[11px] text-amber-500">
          <AlertCircle size={11} />
          额度即将用尽
        </div>
      )}
    </div>
  );
}
