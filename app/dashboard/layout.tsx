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
    <div className="flex min-h-screen flex-col">
      <DashboardNav user={user} />
      <div className="container flex-1 items-start md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <SidebarContainer items={sidebarItems} />
        <main className="flex w-full flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
