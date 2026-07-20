"use client";

import { Button } from "@/components/ui/button";
import type { StoryboardData } from "@/types";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface StoryboardGeneratorProps {
  scriptText: string;
  projectId: string;
  onGenerated: (data: StoryboardData) => void;
  hasExisting: boolean;
}

export function StoryboardGenerator({
  scriptText,
  projectId,
  onGenerated,
  hasExisting,
}: StoryboardGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!scriptText.trim()) {
      setError("请先生成脚本内容");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/ai/generate-storyboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptText }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      onGenerated(json.data as StoryboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <Sparkles size={14} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">
              AI 分镜生成
            </h2>
            <p className="text-xs text-stone-500">
              将脚本自动转化为专业分镜表
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="p-3 rounded-lg bg-stone-50 border border-stone-100">
          <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-1">
            输入脚本
          </p>
          <p className="text-xs text-stone-600 leading-relaxed line-clamp-4 whitespace-pre-wrap">
            {scriptText || "暂无脚本内容，请先在「脚本」Tab 中生成"}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading || !scriptText.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              AI 分析脚本中…
            </>
          ) : (
            <>
              <Sparkles size={14} />
              {hasExisting ? "重新生成分镜表" : "生成分镜表"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
