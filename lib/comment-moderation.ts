import { prisma } from "@/lib/db";
import { getSensitivityLevel } from "./sensitive-words";

export async function shouldAutoApprove(content: string, userId: string) {
  // 1. 检查用户信誉度
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trustLevel: true,
      commentCount: true,
      approvedCount: true,
      lastCommentAt: true,
    },
  });

  if (!user) return false;

  // 2. 检查敏感内容
  const sensitivity = getSensitivityLevel(content);

  // 危险内容直接拒绝
  if (sensitivity.level === "dangerous") {
    return false;
  }

  // 3. 信任用户的评论处理
  if (user.trustLevel === "trusted") {
    // 即使是信任用户，如果内容可疑也需要审核
    return sensitivity.level === "safe";
  }

  // 4. 评论频率检查（防止垃圾评论）
  if (user.lastCommentAt) {
    const timeSinceLastComment = Date.now() - user.lastCommentAt.getTime();
    if (timeSinceLastComment < 300000) {
      // 5分钟内
      return false;
    }
  }

  // 5. 新用户的处理
  if (user.commentCount === 0) {
    // 新用户的首条评论必须是安全的
    return sensitivity.level === "safe";
  }

  // 6. 普通用户的处理
  if (user.trustLevel === "regular") {
    // 普通用户可疑内容需要审核
    return (
      sensitivity.level === "safe" &&
      user.approvedCount / user.commentCount > 0.8
    );
  }

  // 7. 默认需要审核
  return false;
}

export async function updateUserTrustLevel(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      commentCount: true,
      approvedCount: true,
      trustLevel: true,
    },
  });

  if (!user) return;

  let newTrustLevel = user.trustLevel;
  const approvalRate = user.approvedCount / user.commentCount;

  if (user.commentCount >= 20 && approvalRate > 0.95) {
    newTrustLevel = "trusted";
  } else if (user.commentCount >= 5 && approvalRate > 0.8) {
    newTrustLevel = "regular";
  }

  if (newTrustLevel !== user.trustLevel) {
    await prisma.user.update({
      where: { id: userId },
      data: { trustLevel: newTrustLevel },
    });
  }
}
