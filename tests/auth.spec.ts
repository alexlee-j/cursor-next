import { test, expect } from '@playwright/test';
import { ADMIN_USER, REGULAR_USER, performLogin, waitForToast, clearLoginState } from './utils/auth-helpers';

test.describe('认证功能测试套件', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test.afterEach(async ({ page }) => {
    await clearLoginState(page);
  });

  test('管理员成功登录', async ({ page }) => {
    // 填写登录表单
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    
    // 点击登录按钮
    await page.click('button[type="submit"]');
    
    // 验证重定向到仪表盘
    await expect(page).toHaveURL('/dashboard');
  });

  test('普通用户成功登录', async ({ page }) => {
    await page.fill('input[type="email"]', REGULAR_USER.email);
    await page.fill('input[type="password"]', REGULAR_USER.password);
    
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('登录失败 - 错误的密码', async ({ page }) => {
    const invalidUser = {
      email: ADMIN_USER.email,
      password: 'wrong_password'
    };

    await page.fill('input[type="email"]', invalidUser.email);
    await page.fill('input[type="password"]', invalidUser.password);
    await page.click('button[type="submit"]');
    
    // 验证错误提示 - 使用更具体的选择器
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    // 确保仍在登录页面
    await expect(page).toHaveURL('/login');
  });

  test('登录失败 - 空字段验证', async ({ page }) => {
    // 直接点击提交按钮触发所有字段的验证
    await page.click('button[type="submit"]');
    
    // 等待一小段时间让验证消息显示
    await page.waitForTimeout(100);
    
    // 验证表单验证消息
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText('请输入有效的邮箱地址');
  });

  test('登录状态持久化', async ({ page, context }) => {
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    
    // 等待登录成功
    await expect(page).toHaveURL('/dashboard');
    
    // 创建新页面验证登录状态保持
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    // 如果能访问dashboard而不被重定向到登录页，说明登录状态保持了
    await expect(newPage).toHaveURL('/dashboard');
  });

  test('密码验证规则', async ({ page }) => {
    const weakPassword = '123';
    
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', weakPassword);
    // 触发验证
    await page.click('button[type="submit"]');
    
    // 验证密码规则提示
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toContainText('密码至少需要8个字符');
  });
});
