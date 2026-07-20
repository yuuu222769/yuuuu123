"use client";

import type { KnowledgeEntry, KnowledgeType, Project } from "@/types";
import { KNOWLEDGE_TYPES } from "@/types";
import { Plus, Search, BookOpen, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KnowledgeCard } from "./knowledge-card";
import { KnowledgeForm } from "./knowledge-form";

interface KnowledgeBaseProps {
  project: Project;
}

export function KnowledgeBase({ project }: KnowledgeBaseProps) {
  // Fetch ALL entries once, filter locally
  const [allEntries, setAllEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${project.id}/knowledge`);
    const json = await res.json();
    if (json.success) setAllEntries(json.data);
    setLoading(false);
  }, [project.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filter locally — always uses full dataset for accurate counts
  const entries = useMemo(() => {
    let result = allEntries;
    if (typeFilter !== "all") result = result.filter((e) => e.type === typeFilter);
    if (selectedTag) result = result.filter((e) => e.tags.split(",").map((t) => t.trim()).includes(selectedTag));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.tags.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allEntries, typeFilter, selectedTag, search]);

  // Counts always from full dataset
  const typeCounts = useMemo(() => {
    return KNOWLEDGE_TYPES.map((t) => ({
      ...t,
      count: allEntries.filter((e) => e.type === t.value).length,
    }));
  }, [allEntries]);

  // All unique tags from full dataset
  const allTags = useMemo(
    () =>
      Array.from(
        new Set(allEntries.flatMap((e) => e.tags.split(",").filter(Boolean).map((t) => t.trim())))
      ).sort(),
    [allEntries]
  );

  const handleDelete = async (entryId: string) => {
    await fetch(`/api/projects/${project.id}/knowledge/${entryId}`, { method: "DELETE" });
    fetchAll();
  };

  const hasAnyFilter = typeFilter !== "all" || search || selectedTag;

  return (
    <div className="flex-1 flex min-h-0">
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r border-stone-200 bg-white overflow-auto p-3 flex flex-col gap-4">
        {/* Type filters — counts from ALL entries */}
        <div>
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mb-1.5 px-1">
            资料分类
          </p>
          <button
            onClick={() => { setTypeFilter("all"); setSelectedTag(""); }}
            className={`w-full text-left px-2 py-1 rounded-md text-xs transition-colors mb-0.5 cursor-pointer ${
              typeFilter === "all" && !selectedTag ? "bg-stone-100 text-stone-900 font-medium" : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            全部 ({allEntries.length})
          </button>
          {typeCounts.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTypeFilter(t.value); setSelectedTag(""); }}
              className={`w-full text-left px-2 py-1 rounded-md text-xs transition-colors mb-0.5 cursor-pointer flex items-center justify-between ${
                typeFilter === t.value ? "bg-stone-100 text-stone-900 font-medium" : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              <span>{t.icon} {t.label}</span>
              {t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  typeFilter === t.value ? "bg-stone-700 text-white" : "bg-stone-200/70 text-stone-500"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tags — from ALL entries */}
        {allTags.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mb-1.5 px-1">
              标签
            </p>
            <div className="flex flex-wrap gap-1 px-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setSelectedTag(selectedTag === tag ? "" : tag); setTypeFilter("all"); }}
                  className={`px-2 py-0.5 rounded-full text-[10px] transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? "bg-stone-800 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-stone-50">
        {/* Search bar */}
        <div className="px-4 py-2 border-b border-stone-200 bg-white flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题、内容、标签…"
              className="w-full h-8 pl-7 pr-3 text-xs rounded-md border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:bg-white"
            />
          </div>
          {hasAnyFilter && (
            <button
              onClick={() => { setTypeFilter("all"); setSearch(""); setSelectedTag(""); }}
              className="text-[11px] text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              清除筛选
            </button>
          )}
          <button
            onClick={() => { setEditingEntry(null); setShowForm(true); }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer shrink-0 ml-auto"
          >
            <Plus size={13} />
            添加资料
          </button>
        </div>

        {/* Entries list */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={18} className="animate-spin text-stone-400" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <BookOpen size={24} className="text-stone-300" />
              </div>
              {allEntries.length === 0 ? (
                <>
                  <h3 className="text-sm font-medium text-stone-500 mb-1">暂无知识库资料</h3>
                  <p className="text-xs text-stone-400 max-w-xs mb-4">
                    添加客户资料、品牌信息等，AI 生成脚本时自动参考
                  </p>
                  <button
                    onClick={() => { setEditingEntry(null); setShowForm(true); }}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <Plus size={13} /> 添加第一条资料
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-medium text-stone-500 mb-1">无匹配结果</h3>
                  <p className="text-xs text-stone-400">换个分类或关键词试试</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-w-3xl">
              {entries.map((entry) => (
                <KnowledgeCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => { setEditingEntry(entry); setShowForm(true); }}
                  onDelete={() => handleDelete(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <KnowledgeForm
          projectId={project.id}
          entry={editingEntry}
          onClose={() => { setShowForm(false); setEditingEntry(null); }}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}
