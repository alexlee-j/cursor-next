import { NextResponse } from "next/server";
import { autoApproveComments } from "@/lib/tasks/comment-auto-approval";

export async function POST(req: Request) {
  try {
    // 验证请求是否来自可信源（例如通过 cron job 服务）
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await autoApproveComments();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error running auto approval task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
