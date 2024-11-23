"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { DashboardNav } from "./nav";

export function SidebarContainer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 移动端菜单按钮 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">打开菜单</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <DashboardNav />
        </SheetContent>
      </Sheet>

      {/* 桌面端侧边栏 */}
      <aside className="hidden w-[200px] flex-col md:flex">
        <DashboardNav />
      </aside>
    </>
  );
}
