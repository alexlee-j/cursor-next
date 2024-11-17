"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface SidebarContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    title: string;
    href: string;
  }[];
}

export function SidebarContainer({ items, className }: SidebarContainerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 移动端侧边栏
  const MobileSidebar = () => (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">打开菜单</span>
      </Button>

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold">导航菜单</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <DashboardSidebar items={items} />
      </div>
    </>
  );

  // 桌面端侧边栏
  const DesktopSidebar = () => (
    <div className="hidden lg:block fixed inset-y-0 z-30 w-72 bg-background border-r px-6 py-8">
      <div className="flex h-full flex-col justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-8">博客管理系统</h2>
          <DashboardSidebar items={items} />
        </div>
        <div className="text-sm text-muted-foreground">© 2024 博客系统</div>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {className?.includes("lg:hidden") ? (
        <MobileSidebar />
      ) : (
        <DesktopSidebar />
      )}
    </div>
  );
}
