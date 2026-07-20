"use client";

import type { KnowledgeEntry } from "@/types";
import { KNOWLEDGE_TYPES } from "@/types";
import { formatDate, truncate } from "@/lib/utils";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { useState } from "react";

interface KnowledgeCardProps {
  entry: KnowledgeEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function KnowledgeCard({ entry, onEdit, onDelete }: KnowledgeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const typeMeta = KNOWLEDGE_TYPES.find((t) => t.value === entry.type);
  const tags = entry.tags.split(",").filter(Boolean).map((t) => t.trim());

  return (
    <div className="bg-white rounded-lg border border-stone-200 hover:border-stone-300 transition-colors">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-lg">{typeMeta?.icon || "📋"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-stone-900 truncate">{entry.title}</h4>
            {entry.fileUrl && (
              <a
                href={entry.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-stone-400 hover:text-stone-600 shrink-0"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-stone-400">{typeMeta?.label}</span>
            {tags.length > 0 && (
              <div className="flex items-center gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <span className="text-[10px] text-stone-300 ml-auto">
              {formatDate(entry.updatedAt)}
            </span>
          </div>
        </div>

        {/* Expand indicator */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`text-stone-400 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-stone-100">
          <div className="pt-2.5">
            <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">
              {entry.content || "（无内容）"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-stone-50">
            <ActionBtn onClick={onEdit}>
              <Pencil size={11} /> 编辑
            </ActionBtn>
            {showDeleteConfirm ? (
              <span className="text-[11px] text-red-500 ml-2">
                确认删除？
                <button onClick={onDelete} className="ml-1 underline cursor-pointer">是</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="ml-1 underline cursor-pointer">否</button>
              </span>
            ) : (
              <ActionBtn onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={11} /> 删除
              </ActionBtn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}
