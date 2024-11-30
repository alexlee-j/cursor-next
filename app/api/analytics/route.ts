import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAuth } from "@/lib/auth";

interface ViewCount {
  viewedAt: Date;
  _count__id: number;
}

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : null;
    const userAgent = req.headers.get("user-agent");

    await prisma.$executeRaw`
      INSERT INTO "PageView" (id, path, "viewedAt", ip, "userAgent")
      VALUES (gen_random_uuid(), ${path}, NOW(), ${ip}, ${userAgent})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record page view:", error);
    return NextResponse.json(
      { error: "Failed to record page view" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7", 10);

    const views = await prisma.$queryRaw<ViewCount[]>`
      SELECT DATE_TRUNC('day', "viewedAt") as "viewedAt",
             COUNT(id) as "_count__id"
      FROM "PageView"
      WHERE "viewedAt" >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('day', "viewedAt")
      ORDER BY "viewedAt" ASC
    `;

    const totalViews = await prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*) as count FROM "PageView"
    `;

    return NextResponse.json({
      views: views.map((view) => ({
        date: view.viewedAt.toISOString().split("T")[0],
        views: Number(view._count__id),
      })),
      total: Number(totalViews[0]?.count || 0),
    });
  } catch (error) {
    console.error("Failed to get analytics:", error);
    return NextResponse.json(
      { error: "Failed to get analytics" },
      { status: 500 }
    );
  }
}
