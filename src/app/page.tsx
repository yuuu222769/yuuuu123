import { Clapperboard, Edit3, Film, Layers } from "lucide-react";
import Link from "next/link";

const HIGHLIGHTS = [
  {
    icon: Clapperboard,
    title: "AI 理解你的项目背景",
    desc: "项目资料自动带入 AI 对话，不再重复输入",
  },
  {
    icon: Edit3,
    title: "定点修改，不重写全文",
    desc: "选中任意段落，AI 只修改你要改的部分",
  },
  {
    icon: Layers,
    title: "一键生成分镜表",
    desc: "脚本自动拆分为结构化分镜，导出 Excel/PDF",
  },
  {
    icon: Film,
    title: "版本管理，随时回退",
    desc: "每次修改自动保存版本，切换对比无压力",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-5 lg:px-8 shrink-0">
        <Link href="/" className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
          <Clapperboard size={18} className="text-stone-700" />
          AI 编导工作台
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center h-8 px-4 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            免费注册
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-900 text-white mb-6 shadow-lg shadow-stone-900/10">
          <Clapperboard size={28} />
        </div>

        <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight max-w-md">
          AI 编导工作台
        </h1>
        <p className="text-base lg:text-lg text-stone-500 mt-3 max-w-lg leading-relaxed">
          从选题到分镜，一站完成。
          <br className="hidden sm:block" />
          让 AI 记住你的项目，专注创意本身。
        </p>

        <div className="flex items-center gap-3 mt-8">
          <Link
            href="/register"
            className="inline-flex items-center h-11 px-6 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 active:bg-stone-950 transition-colors shadow-sm"
          >
            开始使用
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center h-11 px-6 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors"
          >
            已有账号
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-16 max-w-3xl w-full">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-stone-100"
            >
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center mb-2.5">
                <Icon size={16} className="text-stone-600" />
              </div>
              <h3 className="text-sm font-semibold text-stone-800 mb-1">
                {title}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-stone-400 border-t border-stone-100">
        AI 编导工作台 v0.1 · 让创作回归创作
      </footer>
    </div>
  );
}
