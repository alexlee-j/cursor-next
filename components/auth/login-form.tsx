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
          reloadCaptcha(); // 重新加载验证码
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
          reloadCaptcha(); // 重新加载验证码
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
      <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showCaptcha && (
          <>
            <div className="my-4" ref={captchaRef}>
              <LoadCanvasTemplate reloadColor="blue" reload={true} />
            </div>
            <FormField
              control={form.control}
              name="captcha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>验证码</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入验证码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "登录中..." : "登录"}
        </Button>
      </form>
    </Form>
  );
}
