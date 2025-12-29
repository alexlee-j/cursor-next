import { prisma } from "@/lib/db";
import { getSensitivityLevel } from "./sensitive-words";

export async function shouldAutoApprove(content: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trustLevel: true,
      commentCount: true,
      approvedCount: true,
      lastCommentAt: true,
    },
  });

  if (!user) return true;

  const sensitivity = getSensitivityLevel(content);

  if (sensitivity.level === "dangerous") {
    return false;
  }

  if (user.trustLevel === "trusted") {
    return true;
  }

  if (user.commentCount === 0 && sensitivity.level === "suspicious") {
    return false;
  }

  return true;
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
  const approvalRate = user.commentCount > 0 ? user.approvedCount / user.commentCount : 1;

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
