"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Theme, themes } from "@/config/theme";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: string;
}) {
  const [theme, setTheme] = useState<Theme>(themes.light);

  useEffect(() => {
    // 从 localStorage 获取主题设置
    const savedTheme = localStorage.getItem("theme") || defaultTheme;

    if (savedTheme === "system") {
      // 检查系统主题偏好
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(themes[prefersDark ? "dark" : "light"]);

      // 监听系统主题变化
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        setTheme(themes[e.matches ? "dark" : "light"]);
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      setTheme(themes[savedTheme] || themes.light);
    }
  }, [defaultTheme]);

  const handleSetTheme = (themeName: string) => {
    const newTheme = themes[themeName] || themes.light;
    setTheme(newTheme);
    localStorage.setItem("theme", themeName);

    // 更新 HTML 的 class
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(themeName);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
