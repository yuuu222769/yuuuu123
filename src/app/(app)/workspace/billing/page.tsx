"use client";

import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function BillingContent() {
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [message, setMessage] = useState("");
  const [mockMode, setMockMode] = useState(false);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then(async (j) => {
        if (j.success && j.data.length > 0) {
          setWorkspaceSlug(j.data[0].slug);
          const res = await fetch(`/api/workspaces/${j.data[0].slug}/subscription`);
          const s = await res.json();
          if (s.success) setSub(s.data);
        }
        setLoading(false);
      });
  }, [success]);

  async function handleUpgrade(tier: string) {
    if (tier === "free") return;
    setUpgrading(tier);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planTier: tier, workspaceSlug }),
    });

    const json = await res.json();
    if (!json.success) {
      setMessage(json.error || "支付初始化失败");
      setUpgrading(null);
      return;
    }

    if (json.data.mockMode) {
      // Mock mode - upgrade instantly without Stripe
      setMockMode(true);
      setMessage(json.data.message);
      // Refresh subscription data
      const subRes = await fetch(`/api/workspaces/${workspaceSlug}/subscription`);
      const s = await subRes.json();
      if (s.success) setSub(s.data);
      setUpgrading(null);
      setTimeout(() => setMessage(""), 3000);
    } else if (json.data.url) {
      // Redirect to Stripe Checkout
      window.location.href = json.data.url;
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-stone-400" />
      </div>
    );
  }

  const plans = Object.entries(PLANS).map(([tier, plan]) => ({
    tier,
    ...plan,
    isCurrent: sub?.currentPlan?.tier === tier,
  }));

  return (
    <div className="flex-1 overflow-auto bg-stone-50">
      <div className="max-w-4xl mx-auto p-5 lg:p-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-stone-900">选择适合你的方案</h1>
          <p className="text-sm text-stone-500 mt-1">
            {mockMode ? "已激活演示模式，升级即时生效" : "14 天免费试用所有功能"}
          </p>
        </div>

        {/* Messages */}
        {success === "1" && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 text-center">
            支付成功！你的套餐已升级 🎉
          </div>
        )}
        {canceled === "1" && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 text-center">
            支付已取消。如需升级可随时再来
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 text-center">
            {message}
          </div>
        )}

        {/* Current plan */}
        {sub && (
          <div className="mb-6 p-4 bg-white rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-700">
                当前方案：<span className="uppercase font-bold">{sub.currentPlan.tier}</span> · {sub.currentPlan.name}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {sub.quota ? `AI 额度：${sub.quota.used}/${sub.quota.total}，剩余 ${sub.quota.remaining} 次，${new Date(sub.quota.resetAt).toLocaleDateString("zh-CN")} 重置` : ""}
              </p>
            </div>
            <span className="text-xs text-stone-400">
              {sub.quota ? `${Math.round((sub.quota.used / sub.quota.total) * 100)}% 已用` : ""}
            </span>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={cn(
                "bg-white rounded-xl border overflow-hidden flex flex-col",
                plan.isCurrent ? "border-stone-400 ring-1 ring-stone-400 shadow-md" : "border-stone-200 shadow-sm"
              )}
            >
              <div className="px-5 py-4 border-b border-stone-100">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-stone-900">{plan.name}</h3>
                  {plan.isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 text-white font-medium">
                      当前
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-0.5 mt-2">
                  <span className="text-2xl font-bold text-stone-900">
                    {plan.price === 0 ? "免费" : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-xs text-stone-400">/月</span>}
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  {plan.quotaTotal} 次 AI · {plan.projectLimit === 9999 ? "无限" : plan.projectLimit} 项目 · {plan.memberLimit === 999 ? "无限" : plan.memberLimit} 人
                </p>
              </div>

              <div className="px-5 py-3 space-y-2 flex-1">
                {plan.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2">
                    <Check size={12} className="text-emerald-500 shrink-0" />
                    <span className="text-xs text-stone-600">{feat}</span>
                  </div>
                ))}
                {plan.missingFeatures.map((feat) => (
                  <div key={feat} className="flex items-center gap-2 opacity-40">
                    <Check size={12} className="text-stone-300 shrink-0" />
                    <span className="text-xs text-stone-400">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-stone-50">
                {plan.price === 0 ? (
                  <Button className="w-full" variant="secondary" disabled size="sm">
                    当前方案
                  </Button>
                ) : plan.isCurrent ? (
                  <Button className="w-full" variant="secondary" disabled size="sm">
                    使用中
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={upgrading === plan.tier}
                  >
                    {upgrading === plan.tier ? (
                      <><Loader2 size={12} className="animate-spin" /> 处理中…</>
                    ) : (
                      `升级到 ${plan.name}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-xs text-stone-400 max-w-md mx-auto">
          <p>
            当前为{mockMode ? "演示" : "开发"}模式。
            {mockMode
              ? "升级即时生效，无需真实支付。"
              : "配置 Stripe Key 后即可启用真实支付。在 .env 中添加 STRIPE_SECRET_KEY、STRIPE_PRO_PRICE_ID、STRIPE_TEAM_PRICE_ID。"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 size={18} className="animate-spin text-stone-400" /></div>}>
      <BillingContent />
    </Suspense>
  );
}
