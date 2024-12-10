import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/utils/logger";
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export default NextAuth(authOptions);

export async function checkAuth(required = false) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      logger.warn("No token found in cookies");
      return null;
    }

    try {
      const decoded = verify(
        token.value,
        process.env.JWT_SECRET || "secret"
      ) as {
        id: string;
        email: string;
        isVerified: boolean;
        exp: number;
      };

      logger.info("Token decoded successfully", {
        userId: decoded.id,
        email: decoded.email,
        isVerified: decoded.isVerified,
      });

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
        include: {
          roles: {
            include: {
              permissions: true
            }
          }
        }
      });

      if (!user) {
        logger.error("User not found in database", { userId: decoded.id });
        return null;
      }

      if (!user.emailVerified) {
        logger.warn("User email not verified", {
          userId: user.id,
          email: user.email,
        });
        return null;
      }

      logger.info("User authenticated successfully", {
        userId: user.id,
        email: user.email,
        roles: user.roles.map((r) => r.name),
      });

      let userWithAvatar = { ...user };
      if (user.avatar) {
        const avatarBase64 = Buffer.from(user.avatar).toString("base64");
        userWithAvatar.avatar = `data:image/webp;base64,${avatarBase64}`;
      }

      return userWithAvatar;
    } catch (verifyError) {
      logger.error("Token verification failed", {
        error:
          verifyError instanceof Error
            ? verifyError.message
            : String(verifyError),
      });
      return null;
    }
  } catch (error) {
    logger.error("Authentication failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}
