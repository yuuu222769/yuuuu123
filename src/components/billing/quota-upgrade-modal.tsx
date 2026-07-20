"use client";

import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuotaUpgradeModalProps {
  used: number;
  total: number;
  onClose: () => void;
}

export function QuotaUpgradeModal({ used, total, onClose }: QuotaUpgradeModalProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                <Sparkles size={16} className="text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-800">AI 额度已用完</h3>
                <p className="text-[11px] text-amber-600">
                  {used}/{total} 次已使用
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-amber-400 hover:text-amber-600 cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-stone-600 mb-4">
            升级套餐以继续使用 AI 生成脚本、修改内容、生成分镜等功能。
          </p>

          <div className="space-y-2 mb-4">
            {Object.entries(PLANS)
              .filter(([tier]) => tier !== "free")
              .map(([tier, plan]) => (
                <div
                  key={tier}
                  className="flex items-center justify-between p-3 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-800">{plan.name}</p>
                    <p className="text-[11px] text-stone-400">
                      {plan.quotaTotal} 次/月 · {plan.memberLimit} 人
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900">${plan.price}/月</span>
                    <span
                      onClick={() => {
                        router.push("/workspace/billing");
                        onClose();
                      }}
                      className="flex items-center gap-1 text-[11px] text-amber-600 font-medium cursor-pointer hover:text-amber-700"
                    >
                      升级 <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              ))}
          </div>

          <Button
            className="w-full"
            onClick={() => { router.push("/workspace/billing"); onClose(); }}
          >
            查看所有方案
          </Button>
          <Button variant="ghost" className="w-full mt-1" size="sm" onClick={onClose}>
            稍后再说
          </Button>
        </div>
      </div>
    </div>
  );
}
