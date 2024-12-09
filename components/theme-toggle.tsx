"use client";

import * as React from "react";
import { Icons } from "@/components/icons";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    if (typeof window === 'undefined') return;

    // 如果切换到当前主题，直接返回
    const currentTheme = resolvedTheme || theme;
    if (currentTheme === newTheme) return;

    // 移除之前可能存在的overlay
    const existingOverlay = document.querySelector('.theme-transition-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // 创建新的overlay
    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';

    document.body.appendChild(overlay);

    // 强制重绘
    overlay.getBoundingClientRect();

    // 触发动画
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    // 在动画进行到一半时切换主题
    setTimeout(() => {
      setTheme(newTheme);
      // 等待主题完全应用后再移除 overlay
      setTimeout(() => {
        overlay.remove();
      }, 50);
    }, 250);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Icons.sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Icons.moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          浅色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          深色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          跟随系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
