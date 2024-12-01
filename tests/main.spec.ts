import { test, expect } from '@playwright/test';

// 测试账号信息
const TEST_USERS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || '',
    password: process.env.TEST_ADMIN_PASSWORD || '',
    validPassword: process.env.TEST_ADMIN_PASSWORD || '',
    invalidPassword: 'wrongpassword'
  }
};

test.describe('登录功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 在每个测试前访问登录页面
    await page.goto('/login');
    // 等待登录表单完全加载
    await page.waitForSelector('[data-testid="login-form"]', { state: 'visible' });
  });

  test('成功登录测试', async ({ page }) => {
    // 填写正确的登录信息
    await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
    await page.fill('[data-testid="password-input"]', TEST_USERS.admin.validPassword);
    
    // 点击登录按钮并等待导航
    await Promise.all([
      page.click('[data-testid="login-button"]'),
      page.waitForResponse(response => 
        response.url().includes('/api/auth/login') && 
        response.status() === 200
      )
    ]);

    // 验证成功提示
    const toast = await page.waitForSelector('[role="alert"]');
    const toastText = await toast.textContent();
    expect(toastText).toContain('登录成功');

    // 验证页面跳转
    await page.waitForURL('**/dashboard');
  });

  test('密码错误测试', async ({ page }) => {
    // 填写错误的密码
    await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
    await page.fill('[data-testid="password-input"]', TEST_USERS.admin.invalidPassword);
    
    // 点击登录按钮
    await page.click('[data-testid="login-button"]');

    // 验证错误提示
    const toast = await page.waitForSelector('[role="alert"]');
    const toastText = await toast.textContent();
    expect(toastText).toContain('密码错误');

    // 验证仍在登录页面
    expect(page.url()).toContain('/login');
  });

  test('邮箱格式验证测试', async ({ page }) => {
    // 填写无效的邮箱格式
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', TEST_USERS.admin.validPassword);
    
    // 点击登录按钮
    await page.click('[data-testid="login-button"]');

    // 验证错误提示
    const errorMessage = await page.textContent('[data-testid="email-error"]');
    expect(errorMessage).toContain('请输入有效的邮箱地址');
  });

  test('密码长度验证测试', async ({ page }) => {
    // 填写过短的密码
    await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
    await page.fill('[data-testid="password-input"]', '123');
    
    // 点击登录按钮
    await page.click('[data-testid="login-button"]');

    // 验证错误提示
    const errorMessage = await page.textContent('[data-testid="password-error"]');
    expect(errorMessage).toContain('密码至少需要8个字符');
  });

  test('验证码显示测试', async ({ page }) => {
    // 连续输入错误密码3次
    for (let i = 0; i < 3; i++) {
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.admin.invalidPassword);
      await page.click('[data-testid="login-button"]');
      if (i < 2) {
        await page.waitForSelector('[role="alert"]');
      }
    }

    // 验证验证码输入框显示
    const captchaContainer = await page.waitForSelector('[data-testid="captcha-container"]');
    expect(await captchaContainer.isVisible()).toBeTruthy();
  });
});
