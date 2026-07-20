"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { ScriptData } from "@/types";
import { Sparkles, Loader2, X, ArrowRight } from "lucide-react";
import { useState } from "react";

interface FeedbackModalProps {
  projectId: string;
  currentScript: ScriptData;
  onApply: (revised: ScriptData) => void;
  onClose: () => void;
}

export function FeedbackModal({ projectId, currentScript, onApply, onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revised, setRevised] = useState<ScriptData | null>(null);
  const [diffView, setDiffView] = useState<"side-by-side" | "revised-only">("side-by-side");

  async function handleSubmit() {
    if (!feedback.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/ai/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentScript: currentScript.fullText,
          feedback: feedback.trim(),
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setRevised(json.data as ScriptData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "修改失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <Sparkles size={14} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">领导反馈修改</h2>
              <p className="text-[11px] text-stone-400">粘贴领导/客户意见，AI 自动修改</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-stone-100 text-stone-400 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* Feedback input */}
          {!revised && (
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                领导的修改意见
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={`粘贴领导的意见，例如：\n- 第三段语气太生硬了，改得温柔一点\n- 品牌调性不对，我们是走高端路线的\n- 把产品价格加上去\n- 删掉那个网络梗，不符合品牌形象\n- 多加一些用户痛点描述`}
                rows={6}
              />
              <p className="text-[10px] text-stone-400 mt-1">
                可以贴多条意见，AI 会逐条处理
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Diff view */}
          {revised && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-stone-600">修改对比</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDiffView("side-by-side")}
                    className={`px-2 py-0.5 text-[11px] rounded cursor-pointer ${diffView === "side-by-side" ? "bg-stone-200 text-stone-800" : "text-stone-500"}`}
                  >
                    对比
                  </button>
                  <button
                    onClick={() => setDiffView("revised-only")}
                    className={`px-2 py-0.5 text-[11px] rounded cursor-pointer ${diffView === "revised-only" ? "bg-stone-200 text-stone-800" : "text-stone-500"}`}
                  >
                    只看修改后
                  </button>
                </div>
              </div>

              {diffView === "side-by-side" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-medium text-stone-400 uppercase mb-1">修改前</p>
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 max-h-96 overflow-auto">
                      <pre className="text-xs text-stone-500 whitespace-pre-wrap font-sans leading-relaxed">
                        {currentScript.fullText}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-blue-600 uppercase mb-1">
                      <ArrowRight size={10} className="inline mr-0.5" /> 修改后
                    </p>
                    <div className="p-3 rounded-lg bg-blue-50/30 border border-blue-200 max-h-96 overflow-auto">
                      <pre className="text-xs text-stone-800 whitespace-pre-wrap font-sans leading-relaxed">
                        {revised.fullText}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-blue-50/30 border border-blue-200 max-h-96 overflow-auto">
                  <pre className="text-xs text-stone-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {revised.fullText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between rounded-b-xl">
          <p className="text-[10px] text-stone-400">
            {revised ? "确认无误后点击采用" : "描述越具体，修改越精准"}
          </p>
          <div className="flex items-center gap-2">
            {revised ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setRevised(null)}>
                  重新修改
                </Button>
                <Button size="sm" onClick={() => onApply(revised)}>
                  采用此版本
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onClose}>取消</Button>
                <Button size="sm" onClick={handleSubmit} disabled={loading || !feedback.trim()}>
                  {loading ? <><Loader2 size={13} className="animate-spin" /> 修改中…</> : <><Sparkles size={13} /> AI 修改</>}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
