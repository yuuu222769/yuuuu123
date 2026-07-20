// ============================================
// Subscription plan definitions
// No server-side imports — safe for client use
// ============================================
export const PLANS = {
  free: {
    name: "免费版",
    price: 0,
    quotaTotal: 10,
    projectLimit: 3,
    memberLimit: 1,
    modelAccess: "basic" as const,
    features: ["基础 AI 生成", "知识库", "复制导出"],
    missingFeatures: ["团队协作", "高级 AI 模型", "Excel/Word 导出", "优先支持"],
  },
  pro: {
    name: "专业版",
    price: 15,
    quotaTotal: 100,
    projectLimit: 999,
    memberLimit: 5,
    modelAccess: "all" as const,
    features: ["100次/月 AI 生成", "5人团队协作", "高级 AI 模型", "全格式导出", "知识库", "优先支持"],
    missingFeatures: ["无限团队成员", "API 接入", "专属客服"],
  },
  team: {
    name: "团队版",
    price: 50,
    quotaTotal: 500,
    projectLimit: 9999,
    memberLimit: 999,
    modelAccess: "priority" as const,
    features: ["500次/月 AI 生成", "无限团队成员", "高级 AI 优先队列", "全格式导出", "知识库", "数据看板", "API 接入"],
    missingFeatures: ["私有部署"],
  },
} as const;

export type PlanTier = keyof typeof PLANS;

export function getPlan(tier: string) {
  return PLANS[tier as PlanTier] || PLANS.free;
}
