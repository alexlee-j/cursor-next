import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CommentModeration } from "@/components/comment/comment-moderation";
import { hasPermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export default async function CommentsPage() {
  const user = await checkAuth();

  // 检查权限
  if (!hasPermission(user, PERMISSIONS.COMMENT.VIEW_PENDING)) {
    redirect("/");
  }

  // 获取待审核评论
  const pendingComments = await prisma.comment.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          trustLevel: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">评论审核</h1>
      <CommentModeration comments={pendingComments} />
    </div>
  );
}
