import nodemailer from "nodemailer";
import { logger } from "./logger";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class Mailer {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true, // 使用 SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: true, // 启用详细日志
      debug: true  // 启用调试模式
    };

    logger.info("初始化邮件配置", { config: { ...config, auth: { user: config.auth.user } } });

    this.transporter = nodemailer.createTransport(config);

    // 验证配置
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info("SMTP服务器连接成功");
    } catch (error) {
      logger.error("SMTP配置错误", {
        error: error instanceof Error ? error.message : String(error),
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER
      });
    }
  }

  async sendMail({ to, subject, html }: EmailOptions) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("邮件配置缺失");
    }

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    };

    try {
      logger.info("准备发送邮件", {
        to,
        subject,
        from: mailOptions.from
      });

      const info = await this.transporter.sendMail(mailOptions);

      logger.info("邮件发送成功", {
        messageId: info.messageId,
        to,
        subject,
        response: info.response
      });

      return info;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("邮件发送失败", {
        error: errorMessage,
        to,
        subject,
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          secure: true
        }
      });
      throw new Error(`邮件发送失败: ${errorMessage}`);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #333; text-align: center;">验证您的邮箱</h1>
        <p style="color: #666; font-size: 16px;">您好，</p>
        <p style="color: #666; font-size: 16px;">请点击下面的链接验证您的邮箱：</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            验证邮箱
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          或者复制以下链接到浏览器：<br/>
          <a href="${verificationUrl}" style="color: #0070f3;">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">此链接24小时内有效。</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          如果您没有注册账号，请忽略此邮件。
        </p>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: "验证您的邮箱",
      html,
    });
  }

  async sendLoginAlert(email: string, loginInfo: {
    time: string;
    ip: string;
    userAgent: string;
    location?: string;
  }) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">新的登录活动</h2>
        <p style="color: #666;">我们检测到您的账户有新的登录活动：</p>
        <ul style="color: #666;">
          <li>时间：${loginInfo.time}</li>
          <li>IP地址：${loginInfo.ip}</li>
          <li>设备信息：${loginInfo.userAgent}</li>
          ${loginInfo.location ? `<li>位置：${loginInfo.location}</li>` : ''}
        </ul>
        <p style="color: #666;">如果这不是您本人的操作，请立即修改密码并启用双因素认证。</p>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: "新的登录活动提醒",
      html,
    });
  }

  async sendAccountLockNotification(email: string, lockInfo: {
    time: string;
    ip: string;
    location?: string;
    unlockTime: string;
  }) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">账户安全提醒</h2>
        <p style="color: #666;">由于多次登录失败，您的账户已被临时锁定：</p>
        <ul style="color: #666;">
          <li>锁定时间：${lockInfo.time}</li>
          <li>触发IP：${lockInfo.ip}</li>
          ${lockInfo.location ? `<li>位置：${lockInfo.location}</li>` : ''}
          <li>解锁时间：${lockInfo.unlockTime}</li>
        </ul>
        <p style="color: #666;">如果这不是您本人的操作，建议您在账户解锁后立即修改密码并启用双因素认证。</p>
        <p style="color: #666;">如果您需要立即解锁账户，请联系管理员。</p>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: "账户已被临时锁定",
      html,
    });
  }

  async sendTwoFactorCode(email: string, code: string) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">双因素认证验证码</h2>
        <p style="color: #666;">您的验证码是：</p>
        <h1 style="color: #4A90E2; font-size: 32px; letter-spacing: 5px; text-align: center;">${code}</h1>
        <p style="color: #666;">验证码有效期为5分钟。如果这不是您本人的操作，请忽略此邮件。</p>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: "双因素认证验证码",
      html,
    });
  }
}

export const mailer = new Mailer();
