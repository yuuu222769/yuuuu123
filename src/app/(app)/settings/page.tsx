"use client";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Check, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

const MODEL_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "deepseek-chat", label: "DeepSeek Chat" },
  { value: "mimo-v2.5", label: "Mimo v2.5" },
  { value: "mimo-v2.5-pro", label: "Mimo v2.5 Pro" },
  { value: "custom", label: "自定义模型" },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; detail?: string } | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [apiBase, setApiBase] = useState("https://api.openai.com/v1");
  const [modelName, setModelName] = useState("gpt-4o");
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [defaultStyle, setDefaultStyle] = useState("");
  const [defaultType, setDefaultType] = useState("");
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          // Don't load masked key into the field — show empty
          if (j.data.apiKey) setHasExistingKey(true);
          setApiBase(j.data.apiBase || "https://api.openai.com/v1");
          setModelName(j.data.modelName || "gpt-4o");
          setDefaultStyle(j.data.defaultStyle || "");
          setDefaultType(j.data.defaultType || "");

          // Check if model is in our list
          const found = MODEL_OPTIONS.some((m) => m.value === j.data.modelName);
          if (!found && j.data.modelName) setIsCustomModel(true);
        }
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: hasExistingKey && !apiKey ? undefined : (apiKey || undefined),
        apiBase,
        modelName,
        defaultStyle,
        defaultType,
      }),
    });

    const json = await res.json();
    if (json.success) {
      setSaved(true);
      setHasExistingKey(!!apiKey);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(json.error || "保存失败");
    }
    setSaving(false);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    setError("");

    try {
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, apiBase, modelName }),
      });

      const json = await res.json();

      if (json.success) {
        setTestResult({
          ok: true,
          message: json.data.message,
          detail: `URL: ${json.data.url}\n延迟: ${json.data.latency}`,
        });
      } else {
        setTestResult({
          ok: false,
          message: json.error || "连接失败",
          detail: json.data ? `URL: ${json.data.url}\n状态: ${json.data.status}\n${json.data.errorBody?.slice(0, 300) || ""}` : "",
        });
      }
    } catch {
      setTestResult({ ok: false, message: "网络请求失败" });
    }

    setTesting(false);
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
      <div className="max-w-lg mx-auto p-5 lg:p-8">
        <h1 className="text-lg font-semibold text-stone-900 mb-1">设置</h1>
        <p className="text-sm text-stone-500 mb-6">API 配置与偏好</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* AI API Configuration */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 lg:p-6 mb-4">
          <h2 className="text-sm font-semibold text-stone-900 mb-1">
            AI 接口配置
          </h2>
          <p className="text-xs text-stone-400 mb-4">
            支持 OpenAI、DeepSeek、通义千问 等兼容接口
          </p>

          <div className="space-y-4">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasExistingKey ? "已有 Key（输入新 Key 替换）" : "sk-..."}
                  className="w-full h-9 rounded-lg border border-stone-200 px-3 pr-9 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                你的 Key 只保存在你的浏览器中，不会明文传输
              </p>
            </div>

            {/* API Base URL */}
            <Input
              id="apiBase"
              label="API 地址"
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />

            {/* Model */}
            <Select
              id="model"
              label="AI 模型"
              options={isCustomModel ? [...MODEL_OPTIONS, { value: modelName, label: modelName }] : MODEL_OPTIONS}
              value={isCustomModel ? modelName : modelName}
              onChange={(e) => {
                setModelName(e.target.value);
                if (e.target.value === "custom") {
                  setIsCustomModel(true);
                  setModelName("");
                } else {
                  setIsCustomModel(false);
                }
              }}
            />

            {/* Custom model name input */}
            {isCustomModel && (
              <Input
                id="customModel"
                label="自定义模型名称"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="输入模型名称，如：gpt-4-vision-preview"
              />
            )}

            {/* Default preferences */}
            <Input
              id="defaultStyle"
              label="默认风格偏好"
              value={defaultStyle}
              onChange={(e) => setDefaultStyle(e.target.value)}
              placeholder="如：轻松口语化、专业严谨"
            />
          </div>
        </div>

        {/* Account info */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 lg:p-6 mb-4">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">
            链接说明
          </h2>
          <div className="space-y-2 text-xs text-stone-500 leading-relaxed">
            <p>
              <strong>OpenAI：</strong>Base URL 填{" "}
              <code className="bg-stone-100 px-1 rounded">https://api.openai.com/v1</code>
              ，去{" "}
              <a href="https://platform.openai.com/api-keys" target="_blank" className="text-stone-700 underline">
                platform.openai.com
              </a>{" "}
              获取 Key
            </p>
            <p>
              <strong>DeepSeek：</strong>Base URL 填{" "}
              <code className="bg-stone-100 px-1 rounded">https://api.deepseek.com/v1</code>
              ，去{" "}
              <a href="https://platform.deepseek.com/api_keys" target="_blank" className="text-stone-700 underline">
                platform.deepseek.com
              </a>{" "}
              获取 Key
            </p>
            <p>
              <strong>通义千问：</strong>Base URL 填{" "}
              <code className="bg-stone-100 px-1 rounded">https://dashscope.aliyuncs.com/compatible-mode/v1</code>
            </p>
          </div>
        </div>

{/* Test result */}
        {testResult && (
          <div className={`p-3 rounded-lg border text-sm ${
            testResult.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}>
            <p className="font-medium">{testResult.ok ? "✅" : "❌"} {testResult.message}</p>
            {testResult.detail && (
              <pre className="mt-1 text-[11px] opacity-75 whitespace-pre-wrap">{testResult.detail}</pre>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} size="lg" className="flex-1">
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> 保存中…</>
            ) : saved ? (
              <><Check size={14} /> 已保存</>
            ) : (
              "保存设置"
            )}
          </Button>
          <Button onClick={handleTest} disabled={testing} variant="secondary" size="lg">
            {testing ? (
              <><Loader2 size={14} className="animate-spin" /></>
            ) : (
              "测试连接"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
