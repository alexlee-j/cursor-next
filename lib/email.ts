import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  debug: true,
  logger: true,
});

// 创建一个初始化函数来测试连接
export async function verifyConnection() {
  try {
    console.log("Testing SMTP connection...");
    const result = await transporter.verify();
    console.log("SMTP connection test result:", result);
    return result;
  } catch (error) {
    console.error("SMTP connection test failed:", error);
    throw error;
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  // 先验证连接
  await verifyConnection();

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "验证您的邮箱",
    html: `
      <h1>验证您的邮箱</h1>
      <p>请点击下面的链接验证您的邮箱：</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>此链接24小时内有效。</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(to: string, token: string) {
  await verifyConnection();

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "重置您的密码",
    html: `
      <h1>重置密码</h1>
      <p>请点击下面的链接重置您的密码：</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>此链接24小时内有效。</p>
      <p>如果您没有请求重置密码，请忽略此邮件。</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully");
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}
