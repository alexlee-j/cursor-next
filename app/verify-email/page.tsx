"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");
        if (!token) {
          setVerificationStatus("error");
          setErrorMessage("验证token缺失");
          return;
        }

        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "验证失败");
        }

        setVerificationStatus("success");
      } catch (error) {
        setVerificationStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "验证失败");
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleLoginClick = () => {
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        {verificationStatus === "loading" && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>正在验证邮箱...</p>
          </div>
        )}
        {verificationStatus === "success" && (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold text-green-600">验证成功！</h1>
            <p>您的邮箱已成功验证</p>
            <Button onClick={handleLoginClick}>前往登录</Button>
          </div>
        )}
        {verificationStatus === "error" && (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold text-red-600">验证失败</h1>
            <p className="text-gray-600">{errorMessage}</p>
            <Button variant="outline" onClick={handleLoginClick}>
              返回登录
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
