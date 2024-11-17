import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/db";

export async function checkAuth() {
  console.log("Running checkAuth...");
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    console.log("Token in checkAuth:", token?.value ? "exists" : "not found");

    if (!token) {
      console.log("No token found in checkAuth");
      return null;
    }

    try {
      const decoded = verify(
        token.value,
        process.env.JWT_SECRET || "secret"
      ) as {
        id: string;
        email: string;
      };

      console.log("Token decoded:", decoded);

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (!user) {
        console.log("User not found for id:", decoded.id);
        return null;
      }

      console.log("User found:", user);
      return user;
    } catch (error) {
      console.error("Token verification failed in checkAuth:", error);
      return null;
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    return null;
  }
}
