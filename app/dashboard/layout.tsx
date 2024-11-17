import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
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
  console.log("DashboardLayout rendering...");
  const user = await checkAuth();
  console.log("User in DashboardLayout:", user);

  if (!user) {
    console.log("No user found, redirecting to login");
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <DashboardNav user={user} />
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
          <DashboardSidebar items={sidebarItems} />
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
