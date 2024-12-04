import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

export async function POST() {
  try {
    logger.info("用户退出登录");

    const response = NextResponse.json({ 
      success: true,
      message: "已退出登录" 
    });

    // 删除认证 cookie
    response.cookies.delete("token");

    logger.info("退出登录成功，已清除 token");
    return response;
  } catch (error) {
    logger.error("退出登录失败", error);
    return NextResponse.json({ 
      success: false,
      error: "退出登录失败" 
    }, { 
      status: 500 
    });
  }
}
