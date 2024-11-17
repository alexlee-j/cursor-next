import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "已退出登录" });

  response.cookies.delete("token");

  return response;
}
