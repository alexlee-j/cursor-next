import crypto from 'crypto';

// 存储验证码和过期时间
const captchaStore = new Map<string, { code: string; expires: number }>();

// 生成随机验证码
function generateRandomCode(length: number = 6): string {
  // 使用更易读的字符集
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 清理过期的验证码
function cleanupExpiredCaptchas() {
  const now = Date.now();
  for (const [token, data] of captchaStore.entries()) {
    if (data.expires < now) {
      captchaStore.delete(token);
    }
  }
}

// 生成新的验证码
export async function generateCaptcha() {
  // 清理过期验证码
  cleanupExpiredCaptchas();

  const code = generateRandomCode();
  const token = crypto.randomBytes(32).toString('hex');
  
  // 存储验证码，5分钟后过期
  captchaStore.set(token, {
    code,
    expires: Date.now() + 5 * 60 * 1000
  });

  return {
    token,
    code
  };
}

// 验证验证码
export async function verifyCaptcha(token: string, code: string): Promise<boolean> {
  const data = captchaStore.get(token);
  if (!data) {
    return false;
  }

  // 验证是否过期
  if (data.expires < Date.now()) {
    captchaStore.delete(token);
    return false;
  }

  // 验证后立即删除，防止重复使用
  captchaStore.delete(token);

  return data.code.toLowerCase() === code.toLowerCase();
}
