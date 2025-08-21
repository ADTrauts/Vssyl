import { test, expect } from '@playwright/test';

const randomEmail = () => `testuser_${Date.now()}@example.com`;
const testPassword = 'TestPassword123!';
const testName = 'Test User';

// Helper to register a new user
async function register(page, email, password, name) {
  await page.goto('/auth/register');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /register/i }).click();
}

// Helper to login
async function login(page, email, password) {
  await page.goto('/auth/signin');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('Authentication Flows', () => {
  test('Registration page loads', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();
  });

  test('Login page loads', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page).toHaveURL(/.*signin/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('User can register, login, and update profile', async ({ page }) => {
    const email = randomEmail();
    // Register
    await register(page, email, testPassword, testName);
    // Should redirect to login
    await page.waitForURL(/.*login|signin/);
    // Login
    await login(page, email, testPassword);
    // Should redirect to dashboard or profile (assume /profile for this test)
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
    // Update profile name
    const newName = 'Updated User';
    await page.getByLabel('Name').fill(newName);
    await page.getByRole('button', { name: /update name/i }).click();
    await expect(page.getByText('Profile updated!')).toBeVisible();
    // Confirm name updated in profile JSON
    await expect(page.locator('pre')).toContainText(newName);
  });

  test('Registration fails with missing fields', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByRole('button', { name: /register/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('Login fails with invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.getByLabel('Email').fill('notarealuser@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await Promise.all([
      page.waitForNavigation(),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);
    // Debug: print page content after failed login
    console.log(await page.content());
    const errorLocator = page.getByText('Invalid credentials');
    await expect(errorLocator).toBeVisible({ timeout: 10000 });
  });
}); 