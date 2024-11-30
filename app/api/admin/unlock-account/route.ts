import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return Response.json({ error: '无权限访问' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: '邮箱不能为空' }, { status: 400 });
    }

    // 删除该用户的所有登录尝试记录
    await prisma.loginAttempt.deleteMany({
      where: {
        email: email,
      },
    });

    logger.info(`管理员已解除用户 ${email} 的登录限制`);

    return Response.json({ message: '已成功解除登录限制' });
  } catch (error) {
    logger.error('解除登录限制时出错', error);
    return Response.json({ error: '解除登录限制时出错' }, { status: 500 });
  }
}
