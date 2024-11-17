"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail } from "./actions";

export default function VerifyEmailPage() {
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
        router.push("/login");
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
          <h1 className="text-2xl font-bold">验证失败</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">验证成功</h1>
        <p className="mt-2 text-muted-foreground">
          您的邮箱已验证，正在跳转到登录页面...
        </p>
      </div>
    </div>
  );
}
