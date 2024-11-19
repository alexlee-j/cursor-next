import nodemailer from "nodemailer";

// 创建 SMTP 传输对象
const transporter = nodemailer.createTransport({
  service: "QQ", // 使用内置的 QQ 服务配置
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD, // QQ邮箱的授权码
  },
  tls: {
    rejectUnauthorized: false, // 在开发环境中可能需要
  },
});

// 验证配置是否正确
transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP配置错误:", error);
  } else {
    console.log("SMTP服务器连接成功!");
  }
});

export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl: string
) {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: `"博客系统" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "验证您的邮箱",
      html: `
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
      `,
    });

    console.log("邮件发送成功:", info.messageId);
    return info;
  } catch (error) {
    console.error("发送邮件失败:", error);
    throw new Error("发送验证邮件失败，请检查邮箱配置");
  }
}
