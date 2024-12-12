"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail } from "./actions";

function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setError("验证令牌不能为空");
        return;
      }

      const result = await verifyEmail(token);

      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          router.push("/login?verified=1");
        }, 2000);
      } else {
        setStatus("error");
        setError(result.error || "验证失败");
      }
    }

    verify();
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="container flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">验证中...</h1>
          <p className="mt-2 text-muted-foreground">请稍候，正在验证您的邮箱</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">验证失败</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">验证成功</h1>
        <p className="mt-2 text-muted-foreground">
          您的邮箱已验证成功，即将跳转到登录页面...
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">加载中...</h1>
            <p className="mt-2 text-muted-foreground">请稍候</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
