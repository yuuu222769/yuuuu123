"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuotaIndicator } from "@/components/billing/quota-indicator";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWs, setActiveWs] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setWorkspaces(j.data);
          if (j.data.length > 0) loadMembers(j.data[0].slug);
        }
        setLoading(false);
      });
  }, []);

  function loadMembers(slug: string) {
    const ws = workspaces.find((w) => w.slug === slug) || workspaces[0];
    setActiveWs(ws);
    fetch(`/api/workspaces/${slug}/members`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setMembers(j.data); });
  }

  async function inviteMember() {
    if (!inviteEmail.trim() || !activeWs) return;
    setInviting(true);
    await fetch(`/api/workspaces/${activeWs.slug}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: "member" }),
    });
    setInviteEmail("");
    setInviting(false);
    loadMembers(activeWs.slug);
  }

  async function removeMember(memberId: string) {
    if (!activeWs) return;
    await fetch(`/api/workspaces/${activeWs.slug}/members?memberId=${memberId}`, { method: "DELETE" });
    loadMembers(activeWs.slug);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-stone-50">
      <div className="max-w-2xl mx-auto p-5 lg:p-8 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">工作空间设置</h1>
          <p className="text-sm text-stone-500 mt-0.5">管理团队和AI额度</p>
        </div>

        {/* Workspace selection */}
        {workspaces.map((ws) => (
          <div key={ws.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">{ws.name}</h2>
                <p className="text-xs text-stone-400">{ws.memberCount} 人 · {ws.projectCount} 项目 · {ws.planTier.toUpperCase()} · {ws.role}</p>
              </div>
            </div>

            {/* Quota */}
            <div className="px-5 py-4 border-b border-stone-50">
              <QuotaIndicator used={ws.quota.used} total={ws.quota.total} planTier={ws.planTier} />
            </div>

            {/* Team members */}
            <div className="px-5 py-3">
              <h3 className="text-xs font-medium text-stone-500 mb-2">团队成员</h3>
              <div className="space-y-1.5 mb-3">
                {members.filter(m => m.workspaceId === ws.id || true).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs text-stone-500">
                        {(m.displayName || m.email)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-stone-700">{m.displayName || m.email}</p>
                        <p className="text-[10px] text-stone-400">{m.email} · {m.role}</p>
                      </div>
                    </div>
                    {m.role !== "owner" && ws.role === "owner" && (
                      <button onClick={() => removeMember(m.id)} className="text-stone-400 hover:text-red-500 cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Invite */}
              {ws.role === "owner" && (
                <div className="flex items-center gap-2 pt-2 border-t border-stone-50">
                  <Input
                    placeholder="输入邮箱邀请成员…"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && inviteMember()}
                    className="text-xs h-8"
                  />
                  <Button size="sm" onClick={inviteMember} disabled={inviting}>
                    <UserPlus size={12} />
                    邀请
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
