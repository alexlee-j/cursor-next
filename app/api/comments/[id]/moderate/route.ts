import { NextRequest } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAllPermissions } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve((await context.params));
    const body = await req.json();
    
    if (!body || typeof body.action !== 'string') {
      return new Response(
        JSON.stringify({ error: "无效的请求参数" }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { action } = body;
    const user = await checkAuth();

    // 检查权限
    const requiredPermission = action === "approve"
      ? [PERMISSIONS.COMMENT.APPROVE]
      : [PERMISSIONS.COMMENT.REJECT];

    if (!(await hasAllPermissions(user, requiredPermission))) {
      return new Response(
        JSON.stringify({ error: "没有权限执行此操作" }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!comment) {
      return new Response(
        JSON.stringify({ error: "评论不存在" }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 更新评论状态
    await prisma.comment.update({
      where: { id },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
      },
    });

    // 如果通过，更新用户统计
    if (action === "approve") {
      await prisma.user.update({
        where: { id: comment.userId },
        data: {
          approvedCount: {
            increment: 1,
          },
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "审核评论失败" }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
