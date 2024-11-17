import { DashboardNav } from "@/components/dashboard/nav";
import { SidebarContainer } from "@/components/dashboard/sidebar-container";
import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

const sidebarItems = [
  {
    title: "概览",
    href: "/dashboard",
  },
  {
    title: "文章管理",
    href: "/dashboard/posts",
  },
  {
    title: "评论管理",
    href: "/dashboard/comments",
  },
  {
    title: "数据统计",
    href: "/dashboard/analytics",
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await checkAuth();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      {/* 侧边栏 - 桌面端固定，移动端可滑动 */}
      <SidebarContainer items={sidebarItems} className="hidden lg:block" />

      {/* 主内容区 */}
      <div className="flex flex-col">
        <DashboardNav user={user}>
          <SidebarContainer items={sidebarItems} className="lg:hidden" />
        </DashboardNav>
        <main className="flex-1">
          <div className="container max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
