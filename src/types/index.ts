// ============================================
// User types
// ============================================
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

// ============================================
// Project types
// ============================================
export type ContentType =
  | "talk_show"
  | "drama"
  | "vlog"
  | "review"
  | "commercial"
  | "other";

export type Platform =
  | "douyin"
  | "kuaishou"
  | "bilibili"
  | "xiaohongshu"
  | "wechat"
  | "other";

export type ProjectStatus =
  | "draft"
  | "scripting"
  | "storyboarding"
  | "done"
  | "archived";

export interface Project {
  id: string;
  userId: string;
  name: string;
  contentType: ContentType;
  platform: Platform | null;
  targetAudience: string | null;
  duration: string | null;
  style: string | null;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  contentType: ContentType;
  platform?: Platform;
  targetAudience?: string;
  duration?: string;
  style?: string;
  description?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: ProjectStatus;
}

// ============================================
// API response wrapper
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Display metadata
// ============================================
export const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "talk_show", label: "口播" },
  { value: "drama", label: "剧情" },
  { value: "vlog", label: "Vlog" },
  { value: "review", label: "产品评测" },
  { value: "commercial", label: "宣传片" },
  { value: "other", label: "其他" },
];

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "douyin", label: "抖音" },
  { value: "kuaishou", label: "快手" },
  { value: "bilibili", label: "B站" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "wechat", label: "微信视频号" },
  { value: "other", label: "其他" },
];

export const DURATIONS: { value: string; label: string }[] = [
  { value: "15s", label: "15秒" },
  { value: "30s", label: "30秒" },
  { value: "45s", label: "45秒" },
  { value: "60s", label: "60秒" },
  { value: "90s", label: "90秒" },
  { value: "120s", label: "2分钟" },
  { value: "300s", label: "5分钟" },
  { value: "custom", label: "自定义" },
];

export const PROJECT_STATUS_MAP: Record<ProjectStatus, string> = {
  draft: "草稿",
  scripting: "脚本编写中",
  storyboarding: "分镜制作中",
  done: "已完成",
  archived: "已归档",
};

// ============================================
// Script types
// ============================================
export type AIAction =
  | "optimize"       // 优化表达
  | "colloquial"     // 更口语化
  | "conflict"       // 增强冲突
  | "emotion"        // 增强情绪
  | "shorten"        // 缩短内容
  | "expand"         // 扩展内容
  | "de_ai";         // 降低AI感

export const AI_ACTIONS: { value: AIAction; label: string; icon?: string }[] = [
  { value: "optimize", label: "优化表达" },
  { value: "colloquial", label: "更口语化" },
  { value: "conflict", label: "增强冲突" },
  { value: "emotion", label: "增强情绪" },
  { value: "shorten", label: "缩短内容" },
  { value: "expand", label: "扩展内容" },
  { value: "de_ai", label: "降低AI感" },
];

export interface ScriptSegment {
  id: string;
  index: number;
  content: string;
  role: "hook" | "body" | "cta";
}

export interface ScriptStructure {
  sections: { label: string; duration: string; description: string }[];
}

export interface EmotionRhythm {
  points: { position: string; emotion: string; icon: string }[];
}

export interface ScriptData {
  title: string;
  hook: string;
  segments: ScriptSegment[];
  structure: ScriptStructure;
  rhythm: EmotionRhythm;
  fullText: string;
}

export interface ScriptGenerateInput {
  topic: string;
  contentType: ContentType;
  platform: Platform;
  duration: string;
  targetAudience: string;
  style: string;
  reference?: string;
  projectContext?: {
    name: string;
    description?: string | null;
  };
  knowledgeContext?: string;
}

export interface AIModifyRequest {
  originalText: string;
  action: AIAction;
  context?: string;
}

export interface AIModifyResponse {
  modifiedText: string;
  reason: string;
}

// ============================================
// Storyboard types
// ============================================
export type ShotSize =
  | "extreme_wide"
  | "wide"
  | "full"
  | "medium_wide"
  | "medium"
  | "medium_close"
  | "close_up"
  | "extreme_close";

export type CameraMovement =
  | "static"
  | "push_in"
  | "pull_out"
  | "pan_left"
  | "pan_right"
  | "tilt_up"
  | "tilt_down"
  | "tracking"
  | "follow"
  | "handheld"
  | "aerial"
  | "zoom_in"
  | "zoom_out";

export const SHOT_SIZES: { value: ShotSize; label: string }[] = [
  { value: "extreme_wide", label: "远景" },
  { value: "wide", label: "全景" },
  { value: "full", label: "全身" },
  { value: "medium_wide", label: "中全景" },
  { value: "medium", label: "中景" },
  { value: "medium_close", label: "近景" },
  { value: "close_up", label: "特写" },
  { value: "extreme_close", label: "大特写" },
];

export const CAMERA_MOVEMENTS: { value: CameraMovement; label: string }[] = [
  { value: "static", label: "固定" },
  { value: "push_in", label: "推" },
  { value: "pull_out", label: "拉" },
  { value: "pan_left", label: "左摇" },
  { value: "pan_right", label: "右摇" },
  { value: "tilt_up", label: "上摇" },
  { value: "tilt_down", label: "下摇" },
  { value: "tracking", label: "横移" },
  { value: "follow", label: "跟拍" },
  { value: "handheld", label: "手持" },
  { value: "aerial", label: "航拍" },
  { value: "zoom_in", label: "变焦推" },
  { value: "zoom_out", label: "变焦拉" },
];

export interface StoryboardShot {
  id: string;
  shotNumber: number;
  duration: string;
  shotSize: ShotSize;
  visualDesc: string;
  action: string;
  dialogue: string;
  cameraMovement: CameraMovement;
  scene: string;
  props: string;
  soundEffect: string;
  notes: string;
}

export interface StoryboardData {
  shots: StoryboardShot[];
  totalDuration: string;
  shotCount: number;
}

export interface StoryboardGenerateInput {
  scriptText: string;
  contentType: string;
  platform: string;
  duration: string;
  style: string;
}

export interface ModifyShotInput {
  shot: StoryboardShot;
  instruction: string;
}

// ============================================
// Knowledge Base types
// ============================================
export type KnowledgeType =
  | "client_info"
  | "brand_info"
  | "character"
  | "historical_script"
  | "reference_video"
  | "banned_expression"
  | "common_style"
  | "other";

export const KNOWLEDGE_TYPES: { value: KnowledgeType; label: string; icon: string }[] = [
  { value: "client_info", label: "客户资料", icon: "👤" },
  { value: "brand_info", label: "品牌信息", icon: "🏷️" },
  { value: "character", label: "人物设定", icon: "🎭" },
  { value: "historical_script", label: "历史脚本", icon: "📜" },
  { value: "reference_video", label: "参考视频", icon: "🎬" },
  { value: "banned_expression", label: "禁用表达", icon: "🚫" },
  { value: "common_style", label: "常用风格", icon: "🎨" },
  { value: "other", label: "其他", icon: "📋" },
];

export interface KnowledgeEntry {
  id: string;
  projectId: string;
  userId: string;
  type: KnowledgeType;
  title: string;
  content: string;
  tags: string;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeInput {
  type: KnowledgeType;
  title: string;
  content: string;
  tags?: string;
  fileUrl?: string;
}

export interface UpdateKnowledgeInput extends Partial<CreateKnowledgeInput> {}
