import { expect, test } from '../fixtures';
import { AuthPage } from '../pages/auth';
import { generateRandomTestUser } from '../helpers';
import { ChatPage } from '../pages/chat';
import { getMessageByErrorCode } from '@/lib/errors';

test.describe
  .serial('Login and Registration', () => {
    let authPage: AuthPage;

    const testUser = generateRandomTestUser();

    test.beforeEach(async ({ page }) => {
      authPage = new AuthPage(page);
    });

    test('Register new broker account', async () => {
      await authPage.register(testUser.email, testUser.password);
      await authPage.expectToastToContain('Account created successfully!');
    });

    test('Register new account with existing email', async () => {
      await authPage.register(testUser.email, testUser.password);
      await authPage.expectToastToContain('Account already exists!');
    });

    test('Log into broker account that exists', async ({ page }) => {
      await authPage.login(testUser.email, testUser.password);

      await page.waitForURL('/dashboard');
      // Wait for dashboard to load
      await expect(page.getByText('Broker Dashboard')).toBeVisible();
    });

    test('Display user email in user menu', async ({ page }) => {
      await authPage.login(testUser.email, testUser.password);

      await page.waitForURL('/dashboard');

      const sidebarToggleButton = page.getByTestId('sidebar-toggle-button');
      await sidebarToggleButton.click();

      const userEmail = await page.getByTestId('user-email');
      await expect(userEmail).toHaveText(testUser.email);
    });

    test('Log out as broker user', async () => {
      await authPage.logout(testUser.email, testUser.password);
    });

    test('Redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/');
      await page.waitForURL('/login');
      await expect(page).toHaveURL('/login');
    });

    test('Do not navigate to /register for authenticated users', async ({
      page,
    }) => {
      await authPage.login(testUser.email, testUser.password);
      await page.waitForURL('/dashboard');

      await page.goto('/register');
      await expect(page).toHaveURL('/');
    });

    test('Do not navigate to /login for authenticated users', async ({
      page,
    }) => {
      await authPage.login(testUser.email, testUser.password);
      await page.waitForURL('/dashboard');

      await page.goto('/login');
      await expect(page).toHaveURL('/');
    });
  });

test.describe('Broker Entitlements', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
  });

  test('Broker user authentication required for chat', async ({ page }) => {
    // Unauthenticated users should be redirected to login
    await page.goto('/');
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });
});
