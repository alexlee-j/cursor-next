import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/permissions";

export async function GET() {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ permissions: [] });
    }

    const permissions = await getUserPermissions(user.id);
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
