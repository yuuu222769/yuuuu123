import { prisma } from "./db";
import type { PlanTier } from "./plans";
import { getPlan } from "./plans";

// ============================================
// Workspace helpers
// ============================================

/** Get or create a user's default personal workspace */
export async function getOrCreateDefaultWorkspace(user: { id: string; email: string; displayName: string | null }) {
  // Find existing membership
  const existingMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
  });

  if (existingMember) {
    return existingMember.workspace;
  }

  // Create personal workspace
  const slug = `personal-${user.id.slice(0, 8)}`;
  const workspace = await prisma.workspace.create({
    data: {
      name: user.displayName || user.email?.split("@")[0] || "我的工作空间",
      slug,
      ownerId: user.id,
      planTier: "free",
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
  });

  // Create free subscription
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  await prisma.subscription.create({
    data: {
      workspaceId: workspace.id,
      planTier: "free",
      quotaTotal: 10,
      quotaUsed: 0,
      quotaResetAt: nextMonth,
      projectLimit: 3,
      memberLimit: 1,
      features: JSON.stringify(["basic_ai", "knowledge_base", "export_copy"]),
    },
  });

  return workspace;
}

/** Get user's role in a workspace */
export async function getUserRole(workspaceId: string, userId: string): Promise<string | null> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return member?.role || null;
}

/** Check if user can access a workspace */
export async function canAccessWorkspace(workspaceId: string, userId: string): Promise<boolean> {
  const role = await getUserRole(workspaceId, userId);
  return role !== null;
}

/** Check if user can manage a workspace (owner or admin) */
export async function canManageWorkspace(workspaceId: string, userId: string): Promise<boolean> {
  const role = await getUserRole(workspaceId, userId);
  return role === "owner" || role === "admin";
}

// ============================================
// Quota helpers
// ============================================

/** Check and increment quota. Returns true if within limit. */
export async function checkQuota(workspaceId: string): Promise<{ allowed: boolean; remaining: number; used: number; total: number }> {
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (!sub) {
    return { allowed: false, remaining: 0, used: 0, total: 0 };
  }

  // Reset quota if needed
  const now = new Date();
  if (now > sub.quotaResetAt) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    await prisma.subscription.update({
      where: { workspaceId },
      data: { quotaUsed: 0, quotaResetAt: nextMonth },
    });
    return { allowed: true, remaining: sub.quotaTotal, used: 0, total: sub.quotaTotal };
  }

  const remaining = Math.max(0, sub.quotaTotal - sub.quotaUsed);
  return {
    allowed: sub.quotaUsed < sub.quotaTotal,
    remaining,
    used: sub.quotaUsed,
    total: sub.quotaTotal,
  };
}

/** Log an AI usage event and increment quota */
export async function logUsage(params: {
  workspaceId?: string | null;
  userId: string;
  projectId?: string | null;
  operation: string;
  modelName: string;
  tokensIn?: number;
  tokensOut?: number;
}) {
  // Log the event
  await prisma.aIUsageLog.create({
    data: {
      workspaceId: params.workspaceId || null,
      userId: params.userId,
      projectId: params.projectId || null,
      operation: params.operation,
      modelName: params.modelName,
      tokensIn: params.tokensIn || 0,
      tokensOut: params.tokensOut || 0,
      cost: ((params.tokensIn || 0) + (params.tokensOut || 0)) * 0.000002, // rough estimate
    },
  });

  // Increment quota
  if (params.workspaceId) {
    await prisma.subscription.updateMany({
      where: { workspaceId: params.workspaceId },
      data: { quotaUsed: { increment: 1 } },
    });
  }
}

export function getPlanLimits(tier: string) {
  return getPlan(tier);
}
