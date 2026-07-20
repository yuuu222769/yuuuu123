"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AIAction,
  AIModifyResponse,
  Project,
  ScriptData,
  ScriptSegment as ScriptSegmentType,
} from "@/types";
import {
  Check,
  Copy,
  Loader2,
  RotateCcw,
  Save,
  Undo2,
  MessageSquare,
  History,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ScriptDiffPanel } from "./script-diff-panel";
import { ScriptGenerator } from "./script-generator";
import { ScriptSegment } from "./script-segment";
import { ScriptToolbar } from "./script-toolbar";
import { FeedbackModal } from "./feedback-modal";

// ============================================
// State & Reducer
// ============================================
interface EditorState {
  script: ScriptData | null;
  history: ScriptData[];
  historyIndex: number;
  activeSegmentId: string | null;
  saved: boolean;
}

type EditorAction =
  | { type: "SET_SCRIPT"; script: ScriptData }
  | { type: "UPDATE_SEGMENT"; id: string; content: string }
  | { type: "UPDATE_FIELD"; field: "title" | "hook"; value: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "MARK_SAVED" }
  | { type: "SET_ACTIVE"; id: string | null };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_SCRIPT":
      return {
        script: action.script,
        history: [action.script],
        historyIndex: 0,
        activeSegmentId: null,
        saved: false,
      };

    case "UPDATE_SEGMENT": {
      if (!state.script) return state;
      const segments = state.script.segments.map((s) =>
        s.id === action.id ? { ...s, content: action.content } : s
      );
      const newScript = {
        ...state.script,
        segments,
        fullText: segments.map((s) => s.content).join("\n\n"),
      };
      // Trim history from current index forward
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      return {
        ...state,
        script: newScript,
        history: [...newHistory, newScript],
        historyIndex: newHistory.length,
        saved: false,
      };
    }

    case "UPDATE_FIELD": {
      if (!state.script) return state;
      const newScript = { ...state.script, [action.field]: action.value };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      return {
        ...state,
        script: newScript,
        history: [...newHistory, newScript],
        historyIndex: newHistory.length,
        saved: false,
      };
    }

    case "UNDO": {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        script: state.history[newIndex],
        historyIndex: newIndex,
        saved: false,
      };
    }

    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        script: state.history[newIndex],
        historyIndex: newIndex,
        saved: false,
      };
    }

    case "MARK_SAVED":
      return { ...state, saved: true };

    case "SET_ACTIVE":
      return { ...state, activeSegmentId: action.id };

    default:
      return state;
  }
}

// ============================================
// Component
// ============================================
interface ScriptEditorProps {
  project: Project;
  onScriptChange?: (fullText: string) => void;
}

export function ScriptEditor({ project, onScriptChange }: ScriptEditorProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    script: null,
    history: [],
    historyIndex: 0,
    activeSegmentId: null,
    saved: true,
  });

  // Selection state for AI toolbar
  const [selectedText, setSelectedText] = useState("");
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);

  // AI modification state
  const [modifying, setModifying] = useState(false);
  const [aiAction, setAiAction] = useState<AIAction | null>(null);
  const [modifyTarget, setModifyTarget] = useState<string>("");
  const [diffResult, setDiffResult] = useState<AIModifyResponse | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [diffError, setDiffError] = useState("");

  // Auto-save timer
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Version management
  const [savedVersions, setSavedVersions] = useState<{ label: string; script: ScriptData; time: string }[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");

  // Feedback modal
  const [showFeedback, setShowFeedback] = useState(false);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  // ============================================
  // Handlers
  // ============================================
  // Notify parent of script changes (for storyboard tab)
  useEffect(() => {
    if (state.script) {
      onScriptChange?.(state.script.fullText);
    }
  }, [state.script, onScriptChange]);

  const handleScriptGenerated = useCallback((script: ScriptData) => {
    dispatch({ type: "SET_SCRIPT", script });
  }, []);

  const handleSegmentChange = useCallback((id: string, content: string) => {
    dispatch({ type: "UPDATE_SEGMENT", id, content });
    // Debounced auto-save (fires after user stops typing for 1.5s)
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      dispatch({ type: "MARK_SAVED" });
      // TODO: persist to database via API
    }, 1500);
  }, []);

  const handleTextSelect = useCallback((text: string, rect: DOMRect) => {
    setSelectedText(text);
    setSelectionRect(rect);
    setShowToolbar(true);
  }, []);

  const handleTextDeselect = useCallback(() => {
    // Small delay to allow toolbar button clicks
    setTimeout(() => setShowToolbar(false), 200);
  }, []);

  const handleAIAction = useCallback(
    async (action: AIAction) => {
      setShowToolbar(false);
      setAiAction(action);
      setModifyTarget(selectedText);
      setModifying(true);
      setDiffResult(null);
      setDiffError("");
      setShowDiff(true);

      try {
        const res = await fetch(`/api/projects/${project.id}/ai/modify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalText: selectedText,
            action,
            context: `视频类型：${project.contentType}，平台：${project.platform || "抖音"}，风格：${project.style || ""}`,
          }),
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error);

        setDiffResult(json.data);
      } catch (err) {
        setDiffError(err instanceof Error ? err.message : "修改失败");
        setDiffResult({
          modifiedText: selectedText,
          reason: "修改失败，请重试",
        });
      } finally {
        setModifying(false);
      }
    },
    [selectedText, project]
  );

  const handleConfirmModify = useCallback(() => {
    if (!diffResult || !state.script) return;

    // Find which segment contains the selected text and replace it
    const newSegments = state.script.segments.map((seg) => {
      if (seg.content.includes(modifyTarget)) {
        return {
          ...seg,
          content: seg.content.replace(modifyTarget, diffResult.modifiedText),
        };
      }
      return seg;
    });

    const newScript = {
      ...state.script,
      segments: newSegments,
      fullText: newSegments.map((s) => s.content).join("\n\n"),
    };

    dispatch({ type: "SET_SCRIPT", script: newScript });
    setShowDiff(false);
    setDiffResult(null);
    setModifyTarget("");
  }, [diffResult, modifyTarget, state.script]);

  const handleRejectModify = useCallback(() => {
    setShowDiff(false);
    setDiffResult(null);
    setModifyTarget("");
    setDiffError("");
  }, []);

  const handleCopyAll = useCallback(() => {
    if (state.script) {
      navigator.clipboard.writeText(state.script.fullText);
    }
  }, [state.script]);

  const handleSaveVersion = useCallback(() => {
    if (!state.script) return;
    const label = versionLabel.trim() || `版本 ${savedVersions.length + 1}`;
    setSavedVersions((prev) => [
      ...prev,
      { label, script: JSON.parse(JSON.stringify(state.script)), time: new Date().toLocaleString("zh-CN") },
    ]);
    setVersionLabel("");
  }, [state.script, savedVersions.length, versionLabel]);

  const handleLoadVersion = useCallback((version: { script: ScriptData }) => {
    dispatch({ type: "SET_SCRIPT", script: version.script });
    setShowVersions(false);
  }, []);

  const handleApplyFeedback = useCallback((revised: ScriptData) => {
    // Save current as version before applying
    if (state.script) {
      const autoLabel = `反馈修改前_${new Date().toLocaleTimeString("zh-CN")}`;
      setSavedVersions((prev) => [
        ...prev,
        { label: autoLabel, script: JSON.parse(JSON.stringify(state.script)), time: new Date().toLocaleString("zh-CN") },
      ]);
    }
    dispatch({ type: "SET_SCRIPT", script: revised });
    setShowFeedback(false);
  }, [state.script]);

  // Clean up auto-save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, []);

  // ============================================
  // Render: No script yet → show generator
  // ============================================
  if (!state.script) {
    return (
      <div className="flex-1 overflow-auto p-5">
        <ScriptGenerator
          project={project}
          onScriptGenerated={handleScriptGenerated}
        />
      </div>
    );
  }

  // ============================================
  // Render: Script editor
  // ============================================
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-stone-100 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "UNDO" })}
            disabled={!canUndo}
            title="撤销"
          >
            <Undo2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "REDO" })}
            disabled={!canRedo}
            title="重做"
          >
            <RotateCcw size={14} />
          </Button>
          <span className="w-px h-4 bg-stone-200 mx-1" />
          <Button variant="ghost" size="sm" onClick={handleCopyAll} title="复制全文">
            <Copy size={14} />
            <span className="text-xs ml-1">复制全文</span>
          </Button>
          <span className="w-px h-4 bg-stone-200 mx-1" />
          <Button variant="ghost" size="sm" onClick={() => setShowFeedback(true)} title="领导反馈">
            <MessageSquare size={14} />
            <span className="text-xs ml-1">应用反馈</span>
          </Button>

          {/* Version management */}
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShowVersions(!showVersions)} title="版本">
              <History size={14} />
              <span className="text-xs ml-1">版本 {savedVersions.length > 0 ? `(${savedVersions.length})` : ""}</span>
            </Button>
            {showVersions && (
              <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-stone-100">
                  <p className="text-[10px] text-stone-400 uppercase tracking-wide">已保存版本</p>
                </div>
                <div className="max-h-48 overflow-auto">
                  {savedVersions.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-stone-400 text-center">暂无保存的版本</p>
                  ) : (
                    savedVersions.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => handleLoadVersion(v)}
                        className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-medium text-stone-700">{v.label}</p>
                          <p className="text-[10px] text-stone-400">{v.time}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-stone-100 px-3 py-2 flex items-center gap-1.5">
                  <input
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveVersion(); }}
                    placeholder="版本名称（可选）"
                    className="flex-1 h-7 text-xs border border-stone-200 rounded-md px-2 outline-none focus:ring-1 focus:ring-stone-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={handleSaveVersion}
                    className="shrink-0 p-1.5 rounded-md bg-stone-900 text-white hover:bg-stone-800 cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[11px]",
              state.saved ? "text-emerald-500" : "text-amber-500"
            )}
          >
            {state.saved ? (
              <>
                <Check size={11} className="inline mr-0.5" />
                已保存
              </>
            ) : (
              "未保存"
            )}
          </span>
          <button
            onClick={() => {
              dispatch({ type: "SET_SCRIPT", script: null as unknown as ScriptData });
            }}
            className="text-xs text-stone-500 hover:text-stone-700 cursor-pointer"
          >
            重新生成
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-5 lg:p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wide">
              📺 视频标题
            </label>
            <input
              value={state.script.title}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_FIELD",
                  field: "title",
                  value: e.target.value,
                })
              }
              className="w-full mt-1 text-lg font-bold text-stone-900 border-none outline-none bg-transparent placeholder:text-stone-300"
              placeholder="输入标题…"
            />
          </div>

          {/* Hook */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
            <label className="text-[11px] font-medium text-amber-600 uppercase tracking-wide">
              🎯 开头3秒黄金钩子
            </label>
            <textarea
              value={state.script.hook}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_FIELD",
                  field: "hook",
                  value: e.target.value,
                })
              }
              className="w-full mt-1 text-sm text-stone-800 leading-relaxed bg-transparent border-none outline-none resize-none placeholder:text-stone-300"
              rows={2}
              placeholder="一句话抓住注意力…"
            />
          </div>

          {/* Script segments */}
          <div>
            <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wide mb-2 block">
              📝 脚本内容
            </label>
            <div className="space-y-2">
              {state.script.segments.map((seg) => (
                <ScriptSegment
                  key={seg.id}
                  segment={seg}
                  isActive={state.activeSegmentId === seg.id}
                  onSelect={(id) => dispatch({ type: "SET_ACTIVE", id })}
                  onTextSelect={handleTextSelect}
                  onTextDeselect={handleTextDeselect}
                  onChange={handleSegmentChange}
                />
              ))}
            </div>
          </div>

          {/* Video structure */}
          {state.script.structure?.sections?.length > 0 && (
            <div>
              <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wide mb-2 block">
                🏗️ 视频结构
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {state.script.structure.sections.map((sec, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200"
                  >
                    <span className="text-xs font-medium text-stone-700">
                      {sec.label}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {sec.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emotion rhythm */}
          {state.script.rhythm?.points?.length > 0 && (
            <div>
              <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wide mb-2 block">
                📈 情绪节奏
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {state.script.rhythm.points.map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-stone-200 text-xs"
                  >
                    <span>{pt.icon}</span>
                    <span className="text-stone-600">{pt.emotion}</span>
                    <span className="text-stone-400">@{pt.position}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spacing at bottom for comfortable editing */}
          <div className="h-32" />
        </div>
      </div>

      {/* Diff panel (bottom drawer) */}
      {showDiff && (
        <div className="shrink-0 border-t border-stone-200 bg-white max-h-[45vh] overflow-auto">
          <div className="max-w-3xl mx-auto p-4">
            <ScriptDiffPanel
              originalText={modifyTarget}
              action={aiAction!}
              diff={diffResult}
              loading={modifying}
              onConfirm={handleConfirmModify}
              onReject={handleRejectModify}
            />
          </div>
        </div>
      )}

      {/* AI Toolbar (floating) */}
      {showToolbar && selectionRect && (
        <ScriptToolbar
          selectedText={selectedText}
          position={{
            top: selectionRect.top + window.scrollY,
            left: selectionRect.left + selectionRect.width / 2,
          }}
          onAction={handleAIAction}
          onClose={() => setShowToolbar(false)}
        />
      )}

      {/* Feedback modal */}
      {showFeedback && state.script && (
        <FeedbackModal
          projectId={project.id}
          currentScript={state.script}
          onApply={handleApplyFeedback}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
