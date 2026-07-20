"use client";

import { cn } from "@/lib/utils";
import type { StoryboardShot, ShotSize, CameraMovement } from "@/types";
import { SHOT_SIZES, CAMERA_MOVEMENTS } from "@/types";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Sparkles,
  Clock,
  Eye,
  Camera,
  MapPin,
  Music,
  Package,
  StickyNote,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface StoryboardShotCardProps {
  shot: StoryboardShot;
  index: number;
  total: number;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (id: string, field: keyof StoryboardShot, value: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
}

export function StoryboardShotCard({
  shot,
  index,
  total,
  isActive,
  onSelect,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
  onRegenerate,
}: StoryboardShotCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div
      className={cn(
        "group bg-white rounded-xl border transition-all duration-150",
        isActive
          ? "border-stone-400 ring-1 ring-stone-300 shadow-md"
          : "border-stone-200 hover:border-stone-300 shadow-sm"
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <div className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
            <GripVertical size={14} />
          </div>

          {/* Shot number badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stone-900 text-white text-xs font-bold">
              {shot.shotNumber}
            </span>
            <span className="text-xs text-stone-400">/ {total}</span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-1.5 text-stone-500">
            <Clock size={12} />
            <EditableField
              value={shot.duration}
              onChange={(v) => onUpdate(shot.id, "duration", v)}
              className="w-10 text-xs font-medium text-stone-700 bg-amber-50/50 px-1.5 py-0.5 rounded"
              placeholder="3s"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconBtn title="上移" onClick={onMoveUp} disabled={index === 0}>
            <ChevronUp size={13} />
          </IconBtn>
          <IconBtn title="下移" onClick={onMoveDown} disabled={index === total - 1}>
            <ChevronDown size={13} />
          </IconBtn>
          <IconBtn title="AI重新生成" onClick={onRegenerate}>
            <Sparkles size={13} />
          </IconBtn>
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1 px-1">
              <span className="text-[11px] text-red-500">确认?</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setShowDeleteConfirm(false); }}
                className="px-2 py-0.5 text-[11px] bg-red-500 text-white rounded cursor-pointer"
              >
                删
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                className="px-2 py-0.5 text-[11px] border border-stone-200 rounded cursor-pointer"
              >
                否
              </button>
            </div>
          ) : (
            <IconBtn title="删除" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={13} />
            </IconBtn>
          )}
        </div>
      </div>

      {/* Body — field grid */}
      <div className="p-4 space-y-3">
        {/* Row 1: Shot size + Camera movement */}
        <div className="grid grid-cols-2 gap-3">
          <FieldBlock
            icon={<Eye size={12} />}
            label="景别"
            value={shot.shotSize}
            onChange={(v) => onUpdate(shot.id, "shotSize", v)}
            type="select"
            options={SHOT_SIZES}
          />
          <FieldBlock
            icon={<Camera size={12} />}
            label="摄影机运动"
            value={shot.cameraMovement}
            onChange={(v) => onUpdate(shot.id, "cameraMovement", v)}
            type="select"
            options={CAMERA_MOVEMENTS}
          />
        </div>

        {/* Row 2: Visual description (full width) */}
        <FieldBlock
          icon={<Eye size={12} />}
          label="画面内容"
          value={shot.visualDesc}
          onChange={(v) => onUpdate(shot.id, "visualDesc", v)}
          type="textarea"
        />

        {/* Row 3: Action + Dialogue */}
        <div className="grid grid-cols-2 gap-3">
          <FieldBlock
            label="人物动作"
            value={shot.action}
            onChange={(v) => onUpdate(shot.id, "action", v)}
            type="textarea"
            rows={2}
          />
          <FieldBlock
            label="台词/旁白"
            value={shot.dialogue}
            onChange={(v) => onUpdate(shot.id, "dialogue", v)}
            type="textarea"
            rows={2}
          />
        </div>

        {/* Row 4: Scene + Props */}
        <div className="grid grid-cols-2 gap-3">
          <FieldBlock
            icon={<MapPin size={12} />}
            label="场景"
            value={shot.scene}
            onChange={(v) => onUpdate(shot.id, "scene", v)}
          />
          <FieldBlock
            icon={<Package size={12} />}
            label="道具"
            value={shot.props}
            onChange={(v) => onUpdate(shot.id, "props", v)}
          />
        </div>

        {/* Row 5: Sound + Notes */}
        <div className="grid grid-cols-2 gap-3">
          <FieldBlock
            icon={<Music size={12} />}
            label="音效"
            value={shot.soundEffect}
            onChange={(v) => onUpdate(shot.id, "soundEffect", v)}
          />
          <FieldBlock
            icon={<StickyNote size={12} />}
            label="备注"
            value={shot.notes}
            onChange={(v) => onUpdate(shot.id, "notes", v)}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================
function IconBtn({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

function EditableField({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange(draft); setEditing(false); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        onClick={(e) => e.stopPropagation()}
        className={cn("border border-amber-300 rounded bg-white outline-none", className)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(value); }}
      className={cn("cursor-text hover:bg-amber-50/50 transition-colors rounded", className)}
    >
      {value || placeholder || "—"}
    </span>
  );
}

function FieldBlock({
  icon,
  label,
  value,
  onChange,
  type = "input",
  options,
  rows = 1,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "input" | "textarea" | "select";
  options?: { value: string; label: string }[];
  rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
    // Sync draft when value changes externally
    setDraft(value);
  }, [editing, value]);

  const handleSave = () => {
    onChange(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex-1">
        <div className="flex items-center gap-1 mb-1">
          {icon}
          <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wide">
            {label}
          </span>
        </div>
        {type === "select" && options ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-xs text-stone-700 border border-amber-300 rounded-md px-2 py-1.5 bg-white outline-none"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            rows={rows}
            className="w-full text-xs text-stone-700 border border-amber-300 rounded-md px-2 py-1.5 bg-white outline-none resize-none"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-xs text-stone-700 border border-amber-300 rounded-md px-2 py-1.5 bg-white outline-none"
          />
        )}
      </div>
    );
  }

  // Display mode
  if (type === "select" && options) {
    const selected = options.find((o) => o.value === value);
    return (
      <div
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className="flex-1 cursor-pointer hover:bg-stone-50 rounded-md p-1.5 -m-1 transition-colors"
      >
        <div className="flex items-center gap-1 mb-0.5">
          {icon}
          <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wide">
            {label}
          </span>
        </div>
        <p className="text-xs text-stone-700 font-medium">
          {selected?.label || value || "—"}
        </p>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      className="flex-1 cursor-pointer hover:bg-stone-50 rounded-md p-1.5 -m-1 transition-colors"
    >
      <div className="flex items-center gap-1 mb-0.5">
        {icon}
        <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className={cn(
        "text-xs leading-relaxed",
        value ? "text-stone-700" : "text-stone-300 italic",
        rows > 1 && "whitespace-pre-wrap"
      )}>
        {value || "点击编辑…"}
      </p>
    </div>
  );
}
