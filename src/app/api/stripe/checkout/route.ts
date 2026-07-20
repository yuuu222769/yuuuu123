import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Price mapping — replace with your actual Stripe Price IDs after creating products
const STRIPE_PRICES: Record<string, string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
  team: process.env.STRIPE_TEAM_PRICE_ID || "price_team_placeholder",
};

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { planTier, workspaceSlug } = body;

    if (!planTier || !PLANS[planTier as keyof typeof PLANS]) {
      return NextResponse.json({ success: false, error: "无效的方案" }, { status: 400 });
    }

    if (planTier === "free") {
      return NextResponse.json({ success: false, error: "免费版无需购买" }, { status: 400 });
    }

    // Find workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });
    if (!workspace) {
      return NextResponse.json({ success: false, error: "工作空间不存在" }, { status: 404 });
    }

    const priceId = STRIPE_PRICES[planTier];
    if (!priceId || priceId.includes("placeholder")) {
      // Stripe not configured — use mock upgrade for now
      const plan = PLANS[planTier as keyof typeof PLANS];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await prisma.subscription.upsert({
        where: { workspaceId: workspace.id },
        create: {
          workspaceId: workspace.id,
          planTier,
          quotaTotal: plan.quotaTotal,
          quotaUsed: 0,
          quotaResetAt: nextMonth,
          projectLimit: plan.projectLimit,
          memberLimit: plan.memberLimit,
          features: JSON.stringify(plan.features),
        },
        update: {
          planTier,
          quotaTotal: plan.quotaTotal,
          quotaUsed: 0,
          quotaResetAt: nextMonth,
          projectLimit: plan.projectLimit,
          memberLimit: plan.memberLimit,
          features: JSON.stringify(plan.features),
        },
      });

      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { planTier },
      });

      return NextResponse.json({
        success: true,
        data: {
          mockMode: true,
          message: `已升级到${plan.name}`,
          planTier,
          quotaTotal: plan.quotaTotal,
        },
      });
    }

    // Real Stripe checkout
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspace/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspace/billing?canceled=1`,
      client_reference_id: workspace.id,
      metadata: {
        workspaceId: workspace.id,
        planTier,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: { url: session.url },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "支付初始化失败" }, { status: 500 });
  }
}
