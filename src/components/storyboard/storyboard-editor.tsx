"use client";

import type { StoryboardData, StoryboardShot, Project } from "@/types";
import { useReducer, useState, useCallback } from "react";
import { StoryboardGenerator } from "./storyboard-generator";
import { StoryboardShotCard } from "./storyboard-shot-card";
import { StoryboardToolbar } from "./storyboard-toolbar";
import { exportStoryboardExcel, exportStoryboardWord } from "./storyboard-export";
import { Loader2 } from "lucide-react";

// ============================================
// State reducer
// ============================================
interface EditorState {
  shots: StoryboardShot[];
  history: StoryboardShot[][];
  historyIndex: number;
}

type EditorAction =
  | { type: "SET_SHOTS"; shots: StoryboardShot[] }
  | { type: "UPDATE_SHOT"; id: string; field: keyof StoryboardShot; value: string }
  | { type: "UPDATE_SHOT_FULL"; id: string; updates: Partial<StoryboardShot> }
  | { type: "ADD_SHOT" }
  | { type: "DELETE_SHOT"; id: string }
  | { type: "MOVE_UP"; id: string }
  | { type: "MOVE_DOWN"; id: string }
  | { type: "UNDO" }
  | { type: "REDO" };

function renumberShots(shots: StoryboardShot[]): StoryboardShot[] {
  return shots.map((s, i) => ({ ...s, shotNumber: i + 1 }));
}

function pushHistory(state: EditorState, shots: StoryboardShot[]): EditorState {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  return {
    shots,
    history: [...newHistory, shots],
    historyIndex: newHistory.length,
  };
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_SHOTS":
      return {
        shots: action.shots,
        history: [action.shots],
        historyIndex: 0,
      };

    case "UPDATE_SHOT": {
      const shots = renumberShots(
        state.shots.map((s) =>
          s.id === action.id ? { ...s, [action.field]: action.value } : s
        )
      );
      return pushHistory(state, shots);
    }

    case "UPDATE_SHOT_FULL": {
      const shots = renumberShots(
        state.shots.map((s) =>
          s.id === action.id ? { ...s, ...action.updates } : s
        )
      );
      return pushHistory(state, shots);
    }

    case "ADD_SHOT": {
      const maxNum = state.shots.reduce((m, s) => Math.max(m, s.shotNumber), 0);
      const newShot: StoryboardShot = {
        id: crypto.randomUUID(),
        shotNumber: maxNum + 1,
        duration: "3s",
        shotSize: "medium",
        visualDesc: "",
        action: "",
        dialogue: "",
        cameraMovement: "static",
        scene: "",
        props: "",
        soundEffect: "",
        notes: "",
      };
      const shots = renumberShots([...state.shots, newShot]);
      return pushHistory(state, shots);
    }

    case "DELETE_SHOT": {
      const shots = renumberShots(state.shots.filter((s) => s.id !== action.id));
      return pushHistory(state, shots);
    }

    case "MOVE_UP": {
      const idx = state.shots.findIndex((s) => s.id === action.id);
      if (idx <= 0) return state;
      const shots = [...state.shots];
      [shots[idx - 1], shots[idx]] = [shots[idx], shots[idx - 1]];
      return pushHistory(state, renumberShots(shots));
    }

    case "MOVE_DOWN": {
      const idx = state.shots.findIndex((s) => s.id === action.id);
      if (idx < 0 || idx >= state.shots.length - 1) return state;
      const shots = [...state.shots];
      [shots[idx], shots[idx + 1]] = [shots[idx + 1], shots[idx]];
      return pushHistory(state, renumberShots(shots));
    }

    case "UNDO": {
      if (state.historyIndex <= 0) return state;
      const newIdx = state.historyIndex - 1;
      return { ...state, shots: state.history[newIdx], historyIndex: newIdx };
    }

    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIdx = state.historyIndex + 1;
      return { ...state, shots: state.history[newIdx], historyIndex: newIdx };
    }

    default:
      return state;
  }
}

// ============================================
// Component
// ============================================
interface StoryboardEditorProps {
  project: Project;
  scriptText: string;
}

export function StoryboardEditor({ project, scriptText }: StoryboardEditorProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    shots: [],
    history: [],
    historyIndex: 0,
  });

  const [activeShotId, setActiveShotId] = useState<string | null>(null);
  const [regeneratingShot, setRegeneratingShot] = useState<string | null>(null);
  const [regeneratingAll, setRegeneratingAll] = useState(false);

  const hasShots = state.shots.length > 0;
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  const totalDuration = state.shots.reduce((sum, s) => {
    const num = parseInt(s.duration) || 0;
    return sum + num;
  }, 0);

  // ============================================
  // Regenerate single shot
  // ============================================
  const handleRegenerateShot = useCallback(async (shotId: string) => {
    const shot = state.shots.find((s) => s.id === shotId);
    if (!shot) return;

    setRegeneratingShot(shotId);

    try {
      const res = await fetch(`/api/projects/${project.id}/ai/modify-shot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shot,
          instruction: `重新设计这个镜头，保持它在脚本中的位置和功能，但改进画面描述、景别选择和运镜方式，让视觉更有冲击力`,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        dispatch({ type: "UPDATE_SHOT_FULL", id: shotId, updates: json.data });
      }
    } catch {
      // silently fail
    } finally {
      setRegeneratingShot(null);
    }
  }, [state.shots, project.id]);

  // ============================================
  // Regenerate all
  // ============================================
  const handleRegenerateAll = useCallback(async () => {
    if (!scriptText) return;
    setRegeneratingAll(true);

    try {
      const res = await fetch(`/api/projects/${project.id}/ai/generate-storyboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptText }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        dispatch({ type: "SET_SHOTS", shots: json.data.shots });
      }
    } catch {
      // silently fail
    } finally {
      setRegeneratingAll(false);
    }
  }, [scriptText, project.id]);

  // ============================================
  // Render: No shots → show generator
  // ============================================
  if (!hasShots) {
    return (
      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-xl mx-auto">
          <StoryboardGenerator
            scriptText={scriptText}
            projectId={project.id}
            onGenerated={(data) => dispatch({ type: "SET_SHOTS", shots: data.shots })}
            hasExisting={false}
          />
        </div>
      </div>
    );
  }

  // ============================================
  // Render: Storyboard editor
  // ============================================
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <StoryboardToolbar
        shotCount={state.shots.length}
        totalDuration={`${totalDuration}s`}
        canUndo={canUndo}
        canRedo={canRedo}
        onAddShot={() => dispatch({ type: "ADD_SHOT" })}
        onUndo={() => dispatch({ type: "UNDO" })}
        onRedo={() => dispatch({ type: "REDO" })}
        onRegenerateAll={handleRegenerateAll}
        onExportExcel={() => exportStoryboardExcel(state.shots, project.name)}
        onExportWord={() => exportStoryboardWord(state.shots, project.name)}
      />

      {/* Shot cards */}
      <div className="flex-1 overflow-auto">
        {regeneratingAll && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-stone-500 bg-amber-50/50 border-b border-amber-100">
            <Loader2 size={14} className="animate-spin" />
            重新生成全部镜头…
          </div>
        )}

        <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-3">
          {state.shots.map((shot, i) => (
            <div key={shot.id} className="relative">
              {regeneratingShot === shot.id && (
                <div className="absolute inset-0 bg-white/60 z-10 rounded-xl flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-stone-600 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
                    <Loader2 size={14} className="animate-spin" />
                    AI 重新设计中…
                  </div>
                </div>
              )}
              <StoryboardShotCard
                shot={shot}
                index={i}
                total={state.shots.length}
                isActive={activeShotId === shot.id}
                onSelect={() => setActiveShotId(shot.id)}
                onUpdate={(id, field, value) =>
                  dispatch({ type: "UPDATE_SHOT", id, field, value })
                }
                onMoveUp={() => dispatch({ type: "MOVE_UP", id: shot.id })}
                onMoveDown={() => dispatch({ type: "MOVE_DOWN", id: shot.id })}
                onDelete={() => dispatch({ type: "DELETE_SHOT", id: shot.id })}
                onRegenerate={() => handleRegenerateShot(shot.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
