"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const registerSchema = z.object({
  displayName: z.string().min(1, "请输入昵称"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setServerError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!json.success) {
      setServerError(json.error || "注册失败，请重试");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <Input
        id="displayName"
        label="昵称"
        type="text"
        placeholder="你的名字"
        error={errors.displayName?.message}
        {...register("displayName")}
      />

      <Input
        id="email"
        label="邮箱"
        type="email"
        placeholder="your@email.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        id="password"
        label="密码"
        type="password"
        placeholder="至少 6 位"
        error={errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "注册中…" : "注册"}
      </Button>
    </form>
  );
}
