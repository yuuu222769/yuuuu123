"use client";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { QuotaUpgradeModal } from "@/components/billing/quota-upgrade-modal";
import {
  CONTENT_TYPES,
  DURATIONS,
  PLATFORMS,
} from "@/types";
import type { Project, ScriptData } from "@/types";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

interface ScriptGeneratorProps {
  project: Project;
  onScriptGenerated: (script: ScriptData) => void;
}

export function ScriptGenerator({ project, onScriptGenerated }: ScriptGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState<string>(project.contentType);
  const [platform, setPlatform] = useState<string>(project.platform || "douyin");
  const [duration, setDuration] = useState<string>(project.duration || "60s");
  const [targetAudience, setTargetAudience] = useState(project.targetAudience || "");
  const [style, setStyle] = useState(project.style || "");
  const [reference, setReference] = useState("");
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");
  const [quotaExhausted, setQuotaExhausted] = useState<{ used: number; total: number } | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("请输入视频主题");
      return;
    }

    setGenerating(true);
    setError("");
    setStreamText("");

    try {
      const res = await fetch(`/api/projects/${project.id}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          contentType,
          platform,
          duration,
          targetAudience,
          style,
          reference,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "生成失败");
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === "chunk") {
            setStreamText((prev) => prev + (data.content || ""));
          } else if (data.type === "done") {
            onScriptGenerated(data.data as ScriptData);
          } else if (data.type === "error") {
            throw new Error(data.error);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "生成失败，请重试";
      // Check for quota exhaustion
      if (msg.includes("429") || msg.includes("额度已用完")) {
        const match = msg.match(/(\d+)\/(\d+)/);
        setQuotaExhausted({
          used: match ? parseInt(match[1]) : 0,
          total: match ? parseInt(match[2]) : 10,
        });
      } else {
        setError(msg);
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Sparkles size={14} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">
                AI 脚本生成
              </h2>
              <p className="text-xs text-stone-500">
                基于项目资料自动生成完整脚本
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <Input
            id="topic"
            label="视频主题"
            placeholder="你想做什么内容？如：618大促口红种草视频"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !generating) handleGenerate();
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="contentType"
              label="内容类型"
              options={CONTENT_TYPES}
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            />
            <Select
              id="platform"
              label="发布平台"
              options={PLATFORMS}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="duration"
              label="视频时长"
              options={DURATIONS}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <Input
              id="targetAudience"
              label="目标受众"
              placeholder="如：25-35岁女性"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          <Input
            id="style"
            label="内容风格"
            placeholder="如：轻松种草、专业测评、搞笑剧情"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />

          <Textarea
            id="reference"
            label="参考案例（选填）"
            placeholder="粘贴竞品链接或描述你想要的风格参考…"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            rows={2}
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <p className="text-xs text-stone-400">
            基于项目「{project.name}」的资料生成
          </p>
          <Button onClick={handleGenerate} disabled={generating || !topic.trim()}>
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                AI 创作中…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                生成脚本
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Streaming preview */}
      {generating && streamText && (
        <div className="mt-4 bg-white rounded-xl border border-stone-200 shadow-sm p-5">
          <p className="text-xs text-stone-400 mb-2">正在生成…</p>
          <pre className="text-sm text-stone-700 whitespace-pre-wrap font-sans leading-relaxed">
            {streamText}
          </pre>
        </div>
      )}

      {/* Quota upgrade modal */}
      {quotaExhausted && (
        <QuotaUpgradeModal
          used={quotaExhausted.used}
          total={quotaExhausted.total}
          onClose={() => setQuotaExhausted(null)}
        />
      )}
    </div>
  );
}
