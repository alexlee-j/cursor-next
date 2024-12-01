"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import {
  loadCaptchaEnginge,
  LoadCanvasTemplate,
  validateCaptcha,
} from 'react-simple-captcha';

const formSchema = z.object({
  email: z.string().email({
    message: "请输入有效的邮箱地址",
  }),
  password: z
    .string()
    .min(8, { message: "密码至少需要8个字符" })
    .regex(/[A-Z]/, { message: "密码必须包含至少一个大写字母" })
    .regex(/[0-9]/, { message: "密码必须包含至少一个数字" })
    .regex(/[^A-Za-z0-9]/, { message: "密码必须包含至少一个特殊字符" }),
  captcha: z.string().optional(),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaInitialized = useRef(false);

  useEffect(() => {
    if (showCaptcha && !captchaInitialized.current && captchaRef.current) {
      try {
        loadCaptchaEnginge(6);
        captchaInitialized.current = true;
      } catch (error) {
        console.error('验证码加载失败，请刷新页面重试');
      }
    }
  }, [showCaptcha]);

  const reloadCaptcha = () => {
    if (captchaRef.current) {
      try {
        loadCaptchaEnginge(6);
      } catch (error) {
        console.error('验证码刷新失败，请刷新页面重试');
      }
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      captcha: "",
    },
  });

  const handleLogin = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      // 验证码验证
      if (showCaptcha) {
        if (!values.captcha) {
          toast({
            variant: "destructive",
            title: "验证失败",
            description: "请输入验证码",
          });
          return;
        }
        
        if (!validateCaptcha(values.captcha)) {
          toast({
            variant: "destructive",
            title: "验证失败",
            description: "验证码错误，请重试",
          });
          reloadCaptcha();
          form.setValue('captcha', '');
          return;
        }
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requireCaptcha) {
          setShowCaptcha(true);
          reloadCaptcha();
          throw new Error(data.error || "需要验证码");
        }
        throw new Error(data.error || "登录失败");
      }

      toast({
        title: "登录成功",
        description: "欢迎回来！",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "错误",
        description: error instanceof Error ? error.message : "登录失败",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleLogin)}
        className="space-y-6"
        data-testid="login-form"
        noValidate
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            邮箱地址
          </label>
          <div className="mt-1 relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              data-testid="email-input"
              aria-label="邮箱地址"
              aria-required="true"
              aria-invalid={!!form.formState.errors.email}
              aria-describedby={form.formState.errors.email ? "email-error" : undefined}
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                form.formState.errors.email ? "border-red-300" : "border-gray-300"
              }`}
              {...form.register("email", {
                required: "请输入邮箱地址",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "请输入有效的邮箱地址",
                },
              })}
            />
            {form.formState.errors.email && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          {form.formState.errors.email && (
            <p
              className="mt-2 text-sm text-red-600"
              id="email-error"
              data-testid="email-error"
              role="alert"
            >
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            密码
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              data-testid="password-input"
              aria-label="密码"
              aria-required="true"
              aria-invalid={!!form.formState.errors.password}
              aria-describedby={form.formState.errors.password ? "password-error" : undefined}
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                form.formState.errors.password ? "border-red-300" : "border-gray-300"
              }`}
              {...form.register("password", {
                required: "请输入密码",
                minLength: {
                  value: 8,
                  message: "密码至少需要8个字符",
                },
                pattern: {
                  value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
                  message: "密码必须包含字母和数字",
                },
              })}
            />
            {form.formState.errors.password && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          {form.formState.errors.password && (
            <p
              className="mt-2 text-sm text-red-600"
              id="password-error"
              data-testid="password-error"
              role="alert"
            >
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {showCaptcha && (
          <div data-testid="captcha-container">
            <label
              htmlFor="captcha"
              className="block text-sm font-medium text-gray-700"
            >
              验证码
            </label>
            <div className="mt-1">
              <div className="mb-2">
                <LoadCanvasTemplate reloadColor="blue" reload={true} />
              </div>
              <input
                id="captcha"
                type="text"
                required
                maxLength={6}
                data-testid="captcha-input"
                aria-label="验证码"
                aria-required="true"
                aria-invalid={!!form.formState.errors.captcha}
                aria-describedby={form.formState.errors.captcha ? "captcha-error" : undefined}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  form.formState.errors.captcha ? "border-red-300" : "border-gray-300"
                }`}
                {...form.register("captcha", {
                  required: "请输入验证码",
                })}
              />
            </div>
            {form.formState.errors.captcha && (
              <p
                className="mt-2 text-sm text-red-600"
                id="captcha-error"
                data-testid="captcha-error"
                role="alert"
              >
                {form.formState.errors.captcha.message}
              </p>
            )}
          </div>
        )}

        <div>
          <button
            type="submit"
            data-testid="login-button"
            disabled={form.formState.isSubmitting}
            aria-disabled={form.formState.isSubmitting}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              form.formState.isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {form.formState.isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登录中...
              </span>
            ) : (
              "登录"
            )}
          </button>
        </div>
      </form>
    </Form>
  );
}
