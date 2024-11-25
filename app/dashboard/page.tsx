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

interface AnalyticsItem {
  viewedAt: Date;
  _count: {
    id: number;
  };
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const [publishedPosts, draftPosts, totalComments, analytics] =
      await Promise.all([
        prisma.post.count({
          where: { status: "PUBLISHED" },
        }),
        prisma.post.count({
          where: { status: "DRAFT" },
        }),
        prisma.comment.count(),
        // 获取访问统计数据
        prisma.$queryRaw<AnalyticsItem[]>`
          SELECT DATE_TRUNC('day', "viewedAt") as "viewedAt",
                 COUNT(id) as "_count__id"
          FROM "PageView"
          WHERE "viewedAt" >= NOW() - INTERVAL '7 days'
          GROUP BY DATE_TRUNC('day', "viewedAt")
          ORDER BY "viewedAt" ASC
        `,
      ]);

    // 计算总访问量
    const totalViews = await prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*) as count FROM "PageView"
    `;

    // 处理最近7天的访问数据
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const viewsMap = new Map(
      analytics.map((item) => [
        item.viewedAt.toISOString().split("T")[0],
        item._count.id,
      ])
    );

    const recentViews = dates.map((date) => ({
      date: date.toISOString().split("T")[0],
      views: viewsMap.get(date.toISOString().split("T")[0]) || 0,
    }));

    return {
      totalPosts: publishedPosts,
      draftPosts,
      totalComments,
      totalViews: Number(totalViews[0]?.count || 0),
      recentViews,
    };
  } catch (error) {
    console.error("获取仪表盘数据失败:", error);
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
      })).reverse(),
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
