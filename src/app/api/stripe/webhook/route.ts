import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  const signature = request.headers.get("stripe-signature") || "";
  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { workspaceId, planTier } = session.metadata || {};

    if (workspaceId && planTier) {
      const plan = PLANS[planTier as keyof typeof PLANS] || PLANS.free;
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await prisma.subscription.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          planTier,
          quotaTotal: plan.quotaTotal,
          quotaUsed: 0,
          quotaResetAt: nextMonth,
          projectLimit: plan.projectLimit,
          memberLimit: plan.memberLimit,
          features: JSON.stringify(plan.features),
          stripeCustomerId: session.customer as string || undefined,
          stripeSubId: session.subscription as string || undefined,
        },
        update: {
          planTier,
          quotaTotal: plan.quotaTotal,
          quotaUsed: 0,
          quotaResetAt: nextMonth,
          projectLimit: plan.projectLimit,
          memberLimit: plan.memberLimit,
          features: JSON.stringify(plan.features),
          stripeCustomerId: session.customer as string || undefined,
          stripeSubId: session.subscription as string || undefined,
        },
      });

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { planTier },
      });
    }
  }

  // Handle subscription cancellation
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const sub = await prisma.subscription.findFirst({
      where: { stripeSubId: subscription.id },
    });
    if (sub) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planTier: "free",
          quotaTotal: PLANS.free.quotaTotal,
          projectLimit: PLANS.free.projectLimit,
          memberLimit: PLANS.free.memberLimit,
          features: JSON.stringify(PLANS.free.features),
          quotaUsed: sub.quotaUsed,
          quotaResetAt: nextMonth,
        },
      });
      await prisma.workspace.update({
        where: { id: sub.workspaceId },
        data: { planTier: "free" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
