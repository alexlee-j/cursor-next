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
    if (typeof window === "undefined") return;

    const currentTheme = resolvedTheme || theme;
    if (currentTheme === newTheme) return;

    const overlay = document.createElement("div");
    overlay.className = "theme-transition-overlay";
    overlay.style.backgroundColor = newTheme === "dark" ? "#0a0a0a" : "#ffffff";
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add("active");
    });

    setTimeout(() => {
      setTheme(newTheme);
    }, 100);

    setTimeout(() => {
      overlay.classList.add("fade-out");
      setTimeout(() => {
        overlay.remove();
      }, 150);
    }, 200);
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
