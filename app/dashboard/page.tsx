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

async function getDashboardData(userId: string): Promise<DashboardData> {
  try {
    // 1. 获取用户的文章和评论统计
    const [publishedPosts, draftPosts, totalComments] = await Promise.all([
      prisma.post.count({
        where: { 
          status: "PUBLISHED",
          authorId: userId
        },
      }),
      prisma.post.count({
        where: { 
          status: "DRAFT",
          authorId: userId
        },
      }),
      prisma.comment.count({
        where: {
          post: {
            authorId: userId
          }
        }
      }),
    ]);

    // 2. 获取7天前的日期
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 3. 获取用户文章的访问统计
    const userPosts = await prisma.post.findMany({
      where: { authorId: userId },
      select: { id: true }
    });
    
    const postPaths = userPosts.map(post => `/posts/${post.id}`);

    // 4. 获取每日访问统计
    const analytics = await prisma.pageView.groupBy({
      by: ["viewedAt"],
      where: {
        path: { in: postPaths },
        viewedAt: {
          gte: sevenDaysAgo,
        }
      },
      _count: {
        id: true,
      },
      orderBy: {
        viewedAt: "asc",
      },
    });

    // 5. 获取总访问量
    const totalViews = await prisma.pageView.count({
      where: {
        path: { in: postPaths }
      }
    });

    // 6. 处理最近7天的访问数据
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    // 7. 创建日期到访问量的映射
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
      totalViews,
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

  const data = await getDashboardData(user.id);

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
