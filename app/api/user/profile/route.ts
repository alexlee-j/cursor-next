import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import sharp from "sharp";

// 获取用户资料
export async function GET() {
  try {
    const user = await checkAuth();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        website: true,
        location: true,
        socialLinks: true,
        twoFactorEnabled: true,
        createdAt: true,
        trustLevel: true,
        emailVerified: true,
      },
    });

    if (!profile) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 如果有头像数据，转换为 Base64
    if (profile.avatar) {
      const avatarBase64 = Buffer.from(profile.avatar).toString("base64");
      return NextResponse.json({
        ...profile,
        avatar: `data:image/webp;base64,${avatarBase64}`,
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[USER_PROFILE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// 更新用户资料
export async function PUT(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, bio, website, location, socialLinks } = body;

    // 验证用户名格式
    if (name) {
      // 检查用户名长度
      if (name.length < 2 || name.length > 30) {
        return new NextResponse(
          "Username must be between 2 and 30 characters",
          { status: 400 }
        );
      }

      // 检查用户名是否只包含允许的字符
      if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(name)) {
        return new NextResponse(
          "Username can only contain letters, numbers, underscores, and Chinese characters",
          { status: 400 }
        );
      }

      // 检查用户名是否已被使用
      const existingUser = await prisma.user.findFirst({
        where: {
          name,
          id: { not: user.id }, // 排除当前用户
        },
      });

      if (existingUser) {
        return new NextResponse("Username is already taken", { status: 400 });
      }
    }

    // 验证网站URL格式
    if (website && !/^https?:\/\/.+/.test(website)) {
      return new NextResponse("Invalid website URL format", { status: 400 });
    }

    // 验证社交链接
    if (socialLinks) {
      try {
        const links = JSON.parse(JSON.stringify(socialLinks));
        Object.values(links).forEach((url: any) => {
          if (url && !/^https?:\/\/.+/.test(url)) {
            throw new Error("Invalid social link URL format");
          }
        });
      } catch (error) {
        return new NextResponse("Invalid social links format", { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || undefined,
        bio: bio || undefined,
        website: website || undefined,
        location: location || undefined,
        socialLinks: socialLinks || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        website: true,
        location: true,
        socialLinks: true,
        twoFactorEnabled: true,
        createdAt: true,
        trustLevel: true,
        emailVerified: true,
      },
    });

    // 如果有头像数据，转换为 Base64
    if (updatedUser.avatar) {
      const avatarBase64 = Buffer.from(updatedUser.avatar).toString("base64");
      return NextResponse.json({
        ...updatedUser,
        avatar: `data:image/webp;base64,${avatarBase64}`,
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_PROFILE_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// 上传头像
export async function PATCH(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      return new NextResponse("Invalid file type", { status: 400 });
    }

    // 验证文件大小 (最大 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return new NextResponse("File too large (max 2MB)", { status: 400 });
    }

    // 读取文件数据
    const buffer = Buffer.from(await file.arrayBuffer());

    // 使用 Sharp 处理图片
    const processedImageBuffer = await sharp(buffer)
      .resize(200, 200, {
        // 调整尺寸为 200x200
        fit: "cover",
        position: "center",
      })
      .webp({
        // 转换为 WebP 格式
        quality: 80, // 设置质量
        effort: 6, // 压缩级别
      })
      .toBuffer();

    // 将处理后的图片保存到数据库
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        avatar: processedImageBuffer,
      },
      select: {
        id: true,
        avatar: true,
      },
    });

    // 转换为 Base64 返回
    if (updatedUser.avatar) {
      const avatarBase64 = Buffer.from(updatedUser.avatar).toString("base64");
      return NextResponse.json({
        ...updatedUser,
        avatar: `data:image/webp;base64,${avatarBase64}`,
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[AVATAR_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
