import { prisma } from "@/lib/db";
import { getSensitivityLevel } from "../sensitive-words";

export async function autoApproveComments() {
  try {
    // 获取所有待审核的评论
    const pendingComments = await prisma.comment.findMany({
      where: {
        status: "PENDING",
        autoApproved: false,
        createdAt: {
          // 只处理最近24小时内的评论
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        user: {
          select: {
            trustLevel: true,
            commentCount: true,
            approvedCount: true,
          },
        },
      },
    });

    for (const comment of pendingComments) {
      // 重新检查内容敏感度
      const sensitivity = getSensitivityLevel(comment.content);

      // 自动通过的条件：
      // 1. 发布超过30分钟
      // 2. 内容安全
      // 3. 用户信誉良好
      const timeSinceCreation = Date.now() - comment.createdAt.getTime();
      const shouldApprove =
        timeSinceCreation > 30 * 60 * 1000 && // 30分钟
        sensitivity.level === "safe" &&
        comment.user.approvedCount / (comment.user.commentCount || 1) > 0.8;

      if (shouldApprove) {
        await prisma.comment.update({
          where: { id: comment.id },
          data: {
            status: "APPROVED",
            autoApproved: true,
          },
        });

        // 更新用户统计
        await prisma.user.update({
          where: { id: comment.user.id },
          data: {
            approvedCount: { increment: 1 },
          },
        });
      }
    }

    console.log(`Auto approval task completed: ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Error in auto approval task:", error);
  }
}
