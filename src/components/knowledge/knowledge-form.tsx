"use client";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { KnowledgeEntry, KnowledgeType } from "@/types";
import { KNOWLEDGE_TYPES } from "@/types";
import { X, Info } from "lucide-react";
import { useState, useMemo } from "react";

interface KnowledgeFormProps {
  projectId: string;
  entry: KnowledgeEntry | null;
  onClose: () => void;
  onSaved: () => void;
}

// Type-specific guidance
const TYPE_GUIDE: Record<KnowledgeType, {
  titleHint: string;
  contentHint: string;
  contentPlaceholder: string;
  example: string;
}> = {
  client_info: {
    titleHint: "客户信息标题",
    contentHint: "写清楚客户是谁、偏好什么、忌讳什么",
    contentPlaceholder: `客户名称：
职位/角色：
沟通风格（直接/委婉/细节控/只看结果）：
偏好内容方向：
特别注意（禁忌）：
历史合作情况：`,
    example: "如：XX品牌市场部-李总",
  },
  brand_info: {
    titleHint: "品牌信息标题",
    contentHint: "品牌的核心定位、调性、关键词",
    contentPlaceholder: `品牌全称：
品牌Slogan：
品牌调性（高端/年轻/专业/亲民）：
核心关键词（3-5个）：
品牌色/视觉风格：
竞品品牌：`,
    example: "如：XX护肤品牌调性规范",
  },
  character: {
    titleHint: "人物设定标题",
    contentHint: "角色的身份、性格、说话方式",
    contentPlaceholder: `角色名称：
年龄/性别/职业：
性格特点：
说话方式（语速/用词/口头禅）：
服装风格：
在视频中的功能定位：`,
    example: "如：口播博主-小美的人物设定",
  },
  historical_script: {
    titleHint: "历史脚目标题",
    contentHint: "粘贴过往效果好的脚本作为参考",
    contentPlaceholder: `【脚本标题】
【文案内容】
粘贴完整脚本…
【为什么效果好】
数据表现/客户反馈/个人评价`,
    example: "如：618爆款口播脚本",
  },
  reference_video: {
    titleHint: "参考视频标题",
    contentHint: "粘贴参考视频链接 + 值得借鉴的点",
    contentPlaceholder: `视频链接：
创作者/账号名：
值得借鉴的点1：
值得借鉴的点2：
总结（这个视频为什么好）：`,
    example: "如：参考-李佳琦口红种草",
  },
  banned_expression: {
    titleHint: "禁用表达标题",
    contentHint: "绝对不能用的词、句式、表达方式",
    contentPlaceholder: `禁用词1：
禁用词2：
禁用句式：
品牌禁用原因：
替代建议：`,
    example: "如：广告法禁用词清单",
  },
  common_style: {
    titleHint: "常用风格标题",
    contentHint: "常用的表达风格、开头模板、结尾模板",
    contentPlaceholder: `风格名称：
适用场景：
开头模板：
正文结构模板：
结尾模板：
风格特点描述：`,
    example: "如：轻松种草风格模板",
  },
  other: {
    titleHint: "资料标题",
    contentHint: "任何AI生成时需要参考的资料",
    contentPlaceholder: "输入内容…",
    example: "如：特殊拍摄要求",
  },
};

export function KnowledgeForm({ projectId, entry, onClose, onSaved }: KnowledgeFormProps) {
  const isEditing = !!entry;
  const [type, setType] = useState<KnowledgeType>(entry?.type || "client_info");
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");
  const [tags, setTags] = useState(entry?.tags || "");
  const [fileUrl, setFileUrl] = useState(entry?.fileUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const guide = useMemo(() => TYPE_GUIDE[type], [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("请输入标题"); return; }

    setSaving(true);
    setError("");

    const body = {
      type,
      title: title.trim(),
      content: content.trim(),
      tags: tags.trim(),
      fileUrl: fileUrl.trim() || null,
    };

    const url = isEditing
      ? `/api/projects/${projectId}/knowledge/${entry!.id}`
      : `/api/projects/${projectId}/knowledge`;
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (json.success) {
      onSaved();
      onClose();
    } else {
      setError(json.error || "保存失败");
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-900">
            {isEditing ? "编辑资料" : "添加知识库资料"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-stone-100 text-stone-400 cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Type selector — prominent */}
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1.5 block">选择资料类型</label>
            <div className="grid grid-cols-4 gap-1.5">
              {KNOWLEDGE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-[11px] transition-colors cursor-pointer border ${
                    type === t.value
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <span className="text-base">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Guide tip */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
            <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-blue-700 leading-relaxed">
              {guide.contentHint}
            </p>
          </div>

          <Input
            id="title"
            label={`标题 — ${guide.titleHint}`}
            placeholder={guide.example}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            id="content"
            label="详细内容"
            placeholder={guide.contentPlaceholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />

          {/* Tags & Link — compact row */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="tags"
              label="标签"
              placeholder="轻松, 女性向, 种草"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <Input
              id="fileUrl"
              label="参考链接（选填）"
              placeholder="https://..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" size="md" disabled={saving}>
              {saving ? "保存中…" : isEditing ? "保存修改" : "添加资料"}
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              取消
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
