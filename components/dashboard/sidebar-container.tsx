"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

interface SidebarContainerProps {
  items: {
    title: string;
    href: string;
  }[];
}

export function SidebarContainer({ items }: SidebarContainerProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <>
      {/* 移动端菜单按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setShowMobileSidebar(!showMobileSidebar)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* 移动端侧边栏 */}
      <div
        className={`fixed inset-0 z-50 transform md:hidden ${
          showMobileSidebar ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        {/* 遮罩层 */}
        <div
          className={`fixed inset-0 bg-background/80 backdrop-blur-sm ${
            showMobileSidebar ? "opacity-100" : "opacity-0 pointer-events-none"
          } transition-opacity duration-300`}
          onClick={() => setShowMobileSidebar(false)}
        />

        {/* 侧边栏内容 */}
        <div className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs bg-background p-6 shadow-lg">
          <DashboardSidebar items={items} />
        </div>
      </div>

      {/* 桌面端侧边栏 */}
      <aside className="hidden w-[200px] flex-col md:flex lg:w-[240px]">
        <DashboardSidebar items={items} />
      </aside>
    </>
  );
}
