import { Page } from '@playwright/test';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const ADMIN_USER: LoginCredentials = {
  email: process.env.TEST_ADMIN_EMAIL || '',
  password: process.env.TEST_ADMIN_PASSWORD || '',
};

export const REGULAR_USER: LoginCredentials = {
  email: process.env.TEST_REGULAR_EMAIL || '',
  password: process.env.TEST_REGULAR_PASSWORD || '',
};

export async function performLogin(page: Page, credentials: LoginCredentials) {
  // 等待登录表单加载
  await page.waitForSelector('[data-testid="login-form"]', { state: 'visible' });
  
  // 填写表单
  await page.fill('[data-testid="email-input"]', credentials.email);
  await page.fill('[data-testid="password-input"]', credentials.password);
  
  // 提交表单
  await Promise.all([
    page.click('[data-testid="login-button"]'),
    // 等待网络请求完成
    page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.status() === 200
    ).catch(() => null) // 忽略可能的超时错误
  ]);
}

export async function waitForToast(page: Page, expectedText: string) {
  const toast = await page.waitForSelector('[role="alert"]', { state: 'visible' });
  const toastText = await toast.textContent();
  return toastText?.includes(expectedText) || false;
}

export async function clearLoginState(page: Page) {
  // 清除所有cookies和localStorage
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function ensureLoggedOut(page: Page) {
  await clearLoginState(page);
  await page.goto('/login');
  // 确保重定向到登录页面
  await page.waitForURL('**/login');
}
