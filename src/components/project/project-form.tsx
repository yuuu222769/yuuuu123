"use client";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  CONTENT_TYPES,
  DURATIONS,
  PLATFORMS,
} from "@/types";
import type { CreateProjectInput, UpdateProjectInput } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(1, "请输入项目名称").max(100, "项目名称不超过 100 字"),
  contentType: z.enum([
    "talk_show",
    "drama",
    "vlog",
    "review",
    "commercial",
    "other",
  ]),
  platform: z.enum(["douyin", "kuaishou", "bilibili", "xiaohongshu", "wechat", "other"]).optional(),
  targetAudience: z.string().optional(),
  duration: z.string().optional(),
  style: z.string().optional(),
  description: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: CreateProjectInput;
  projectId?: string;
  isEditing?: boolean;
}

export function ProjectForm({ initialData, projectId, isEditing }: ProjectFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialData?.name || "",
      contentType: initialData?.contentType || "talk_show",
      platform: initialData?.platform || "douyin",
      targetAudience: initialData?.targetAudience || "",
      duration: initialData?.duration || "60s",
      style: initialData?.style || "",
      description: initialData?.description || "",
    },
  });

  async function onSubmit(data: ProjectFormData) {
    setServerError("");

    const url = isEditing
      ? `/api/projects/${projectId}`
      : "/api/projects";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!json.success) {
      setServerError(json.error || "提交失败，请重试");
      return;
    }

    if (isEditing) {
      router.refresh();
      router.push(`/projects/${projectId}`);
    } else {
      router.push(`/projects/${json.data.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {serverError}
        </div>
      )}

      {/* Project name */}
      <Input
        id="name"
        label="项目名称"
        placeholder="如：XX品牌618大促口播"
        error={errors.name?.message}
        {...register("name")}
      />

      {/* Content type */}
      <Select
        id="contentType"
        label="内容类型"
        options={CONTENT_TYPES}
        error={errors.contentType?.message}
        {...register("contentType")}
      />

      {/* Platform */}
      <Select
        id="platform"
        label="发布平台"
        options={PLATFORMS}
        error={(errors as Record<string, {message?:string}>).platform?.message}
        {...register("platform")}
      />

      {/* Duration */}
      <Select
        id="duration"
        label="视频时长"
        options={DURATIONS}
        error={(errors as Record<string, {message?:string}>).duration?.message}
        {...register("duration")}
      />

      {/* Target audience */}
      <Input
        id="targetAudience"
        label="目标受众"
        placeholder="如：25-35岁职场女性"
        error={(errors as Record<string, {message?:string}>).targetAudience?.message}
        {...register("targetAudience")}
      />

      {/* Style */}
      <Input
        id="style"
        label="内容风格"
        placeholder="如：轻松幽默、专业严谨、感性温暖"
        error={(errors as Record<string, {message?:string}>).style?.message}
        {...register("style")}
      />

      {/* Description */}
      <Textarea
        id="description"
        label="项目描述"
        placeholder="品牌信息、核心卖点、特殊要求等…"
        error={(errors as Record<string, {message?:string}>).description?.message}
        {...register("description")}
      />

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting
            ? "保存中…"
            : isEditing
              ? "保存修改"
              : "创建项目"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.back()}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
