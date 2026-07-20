import { LoginForm } from "@/components/auth/login-form";
import { Clapperboard } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-stone-900 text-white mb-3">
            <Clapperboard size={20} />
          </div>
          <h1 className="text-lg font-semibold text-stone-900">
            AI 编导工作台
          </h1>
          <p className="text-sm text-stone-500 mt-1">登录你的账号</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-stone-400 mt-6">
          还没有账号？{" "}
          <Link
            href="/register"
            className="text-stone-700 font-medium hover:text-stone-900 transition-colors underline underline-offset-2"
          >
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
