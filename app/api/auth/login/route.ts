import { NextResponse, NextRequest } from "next/server";
import { compare } from "bcryptjs";
import * as jose from "jose";
import { prisma } from "@/lib/db";
import { rateLimiter } from "@/lib/utils/rate-limiter";
import { logger } from "@/lib/utils/logger";
import { ipTracker } from "@/lib/utils/ip-tracker";
import { mailer } from "@/lib/utils/mailer";
import { twoFactorAuth } from "@/lib/utils/two-factor-auth";
import { generateCaptcha, verifyCaptcha } from "@/lib/utils/captcha";

interface LoginRequestBody {
  email: string;
  password: string;
  captcha?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, captcha }: LoginRequestBody = await req.json();
    
    // 调试日志
    logger.info("登录尝试", { email });
    
    // 检查是否被限制登录
    if (rateLimiter.isBlocked(email)) {
      const timeToReset = Math.ceil(rateLimiter.getTimeToReset(email) / 1000 / 60);
      logger.warn("登录被限制", { email, timeToReset });

      // 获取 IP 和位置信息用于通知
      const trackInfo = await ipTracker.trackLoginAttempt(req);
      
      try {
        // 发送账户锁定通知
        await mailer.sendAccountLockNotification(email, {
          time: new Date().toLocaleString(),
          ip: trackInfo.ip,
          location: trackInfo.location.city 
            ? `${trackInfo.location.city}, ${trackInfo.location.country}`
            : undefined,
          unlockTime: new Date(Date.now() + timeToReset * 60 * 1000).toLocaleString(),
        });
      } catch (error) {
        logger.error("发送账户锁定通知失败", error);
      }

      return NextResponse.json({
        error: `登录尝试次数过多，请在 ${timeToReset} 分钟后重试`
      }, { status: 429 });
    }

    // 获取 IP 和位置信息
    const trackInfo = await ipTracker.trackLoginAttempt(req);
    logger.info("IP追踪信息", trackInfo);

    // 检查是否需要验证码
    const remainingAttempts = rateLimiter.getRemainingAttempts(email);
    if (remainingAttempts <= 3) {
      // 如果需要验证但没有提供验证码
      if (!captcha) {
        return NextResponse.json({
          error: "需要验证码",
          requireCaptcha: true
        }, { status: 400 });
      }
    }

    // 记录登录尝试
    await prisma.loginAttempt.create({
      data: {
        email,
        ip: trackInfo.ip,
        success: false,
        location: trackInfo.location,
      },
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        emailVerified: true,
        isActive: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      logger.info("登录失败：用户不存在", { email });
      return NextResponse.json({ error: "用户不存在" }, { status: 400 });
    }

    if (!user.isActive) {
      logger.warn("登录失败：账户已禁用", { email });
      return NextResponse.json({ error: "账户已被禁用" }, { status: 400 });
    }

    if (!user.emailVerified) {
      logger.warn("登录失败：邮箱未验证", { email });
      return NextResponse.json({ error: "请先验证邮箱" }, { status: 400 });
    }

    const passwordMatch = await compare(password, user.password);
    logger.info("密码验证", { email, match: passwordMatch });

    if (!passwordMatch) {
      // 记录失败次数
      rateLimiter.addAttempt(email);
      const remainingAttempts = rateLimiter.getRemainingAttempts(email);

      // 记录失败的登录历史
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ip: trackInfo.ip,
          userAgent: trackInfo.userAgent,
          location: trackInfo.location,
          success: false,
        },
      });

      if (remainingAttempts <= 3) {
        return NextResponse.json({
          error: `密码错误，还剩 ${remainingAttempts} 次尝试机会`,
          requireCaptcha: true
        }, { status: 400 });
      }

      return NextResponse.json({
        error: `密码错误，还剩 ${remainingAttempts} 次尝试机会`
      }, { status: 400 });
    }

    // 检查是否需要双因素认证
    if (user.twoFactorEnabled) {
      // 生成并发送新的验证码
      await twoFactorAuth.generateAndSendCode(user.id, user.email);
      return NextResponse.json({
        requireTwoFactor: true,
        message: "请输入双因素认证码",
      });
    }

    logger.info("生成 JWT token");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "secret");
    const token = await new jose.SignJWT({
      id: user.id,
      email: user.email,
      isVerified: user.emailVerified,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    logger.info("JWT token 已生成");

    // 记录成功的登录历史
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ip: trackInfo.ip,
        userAgent: trackInfo.userAgent,
        location: trackInfo.location,
        success: true,
      },
    });

    try {
      // 发送登录通知邮件
      await mailer.sendLoginAlert(user.email, {
        time: new Date().toLocaleString(),
        ip: trackInfo.ip,
        userAgent: trackInfo.userAgent,
        location: trackInfo.location.city 
          ? `${trackInfo.location.city}, ${trackInfo.location.country}`
          : "未知位置",
      });
    } catch (error) {
      // 邮件发送失败不影响登录流程
      logger.error("发送登录通知邮件失败", error);
    }

    logger.info("登录成功", {
      userId: user.id,
      email: user.email,
      ip: trackInfo.ip,
    });

    const response = NextResponse.json({
      message: "登录成功",
      user: {
        id: user.id,
        email: user.email,
      },
    });

    // 设置 JWT token
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    logger.error("登录过程发生错误", { 
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: "登录过程发生错误", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
