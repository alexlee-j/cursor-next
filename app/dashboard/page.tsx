import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { Overview } from "@/components/dashboard/overview";
import { prisma } from "@/lib/db";

interface DashboardData {
  totalPosts: number;
  draftPosts: number;
  totalComments: number;
  totalViews: number;
  recentViews: {
    date: string;
    views: number;
  }[];
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    // 由于数据库可能还没有数据，我们先返回模拟数据
    return {
      totalPosts: 0,
      draftPosts: 0,
      totalComments: 0,
      totalViews: 0,
      recentViews: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        views: 0,
      })),
    };

    // 后续当有真实数据时，可以使用以下代码：
    /*
    const [publishedPosts, draftPosts, totalComments, analytics] = await Promise.all([
      prisma.post.count({
        where: { status: "PUBLISHED" },
      }),
      prisma.post.count({
        where: { status: "DRAFT" },
      }),
      prisma.comment.count(),
      prisma.analytics.findMany({
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { date: "desc" },
        take: 7,
      }),
    ]);

    const totalViews = analytics.reduce((acc, curr) => acc + curr.pageViews, 0);
    const recentViews = analytics.map((item) => ({
      date: item.date.toISOString().split("T")[0],
      views: item.pageViews,
    }));

    return {
      totalPosts: publishedPosts,
      draftPosts,
      totalComments,
      totalViews,
      recentViews,
    };
    */
  } catch (error) {
    console.error("获取仪表盘数据失败:", error);
    return {
      totalPosts: 0,
      draftPosts: 0,
      totalComments: 0,
      totalViews: 0,
      recentViews: [],
    };
  }
}

export default async function DashboardPage() {
  const user = await checkAuth();
  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData();

  return (
    <DashboardShell>
      <DashboardHeader
        heading="仪表盘"
        text="查看您的博客数据概览和最近的活动。"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Overview data={data} />
      </div>
    </DashboardShell>
  );
}
