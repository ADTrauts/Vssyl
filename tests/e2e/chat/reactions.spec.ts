import { test, expect } from '@playwright/test';

test.describe('Chat Reactions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat page
    await page.goto('/chat');
    
    // Wait for chat to load
    await page.waitForSelector('[data-testid="chat-main-panel"]', { timeout: 10000 });
  });

  test('should display reaction buttons on messages', async ({ page }) => {
    // Wait for messages to load
    await page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 });
    
    // Check if reaction buttons are present
    const reactionButtons = await page.locator('[data-testid="reaction-button"]');
    await expect(reactionButtons.first()).toBeVisible();
  });

  test('should show quick reactions when clicking reaction button', async ({ page }) => {
    // Wait for messages to load
    await page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 });
    
    // Click on the first reaction button
    const firstReactionButton = await page.locator('[data-testid="reaction-button"]').first();
    await firstReactionButton.click();
    
    // Check if quick reactions popup appears
    const quickReactions = await page.locator('[data-testid="quick-reactions"]');
    await expect(quickReactions).toBeVisible();
    
    // Check if common emojis are present
    await expect(page.locator('text=👍')).toBeVisible();
    await expect(page.locator('text=❤️')).toBeVisible();
    await expect(page.locator('text=😂')).toBeVisible();
  });

  test('should add reaction when clicking on quick reaction', async ({ page }) => {
    // Wait for messages to load
    await page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 });
    
    // Click on the first reaction button
    const firstReactionButton = await page.locator('[data-testid="reaction-button"]').first();
    await firstReactionButton.click();
    
    // Click on thumbs up reaction
    const thumbsUpButton = await page.locator('[data-testid="quick-reaction-👍"]');
    await thumbsUpButton.click();
    
    // Check if reaction appears on the message
    const reactionDisplay = await page.locator('[data-testid="reaction-display"]');
    await expect(reactionDisplay).toBeVisible();
    await expect(page.locator('text=👍')).toBeVisible();
  });

  test('should show emoji picker when clicking more emojis', async ({ page }) => {
    // Wait for messages to load
    await page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 });
    
    // Click on the first reaction button
    const firstReactionButton = await page.locator('[data-testid="reaction-button"]').first();
    await firstReactionButton.click();
    
    // Click on more emojis button
    const moreEmojisButton = await page.locator('[data-testid="more-emojis-button"]');
    await moreEmojisButton.click();
    
    // Check if emoji picker appears
    const emojiPicker = await page.locator('[data-testid="emoji-picker"]');
    await expect(emojiPicker).toBeVisible();
  });

  test('should toggle reaction when clicking on existing reaction', async ({ page }) => {
    // Wait for messages to load
    await page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 });
    
    // Add a reaction first
    const firstReactionButton = await page.locator('[data-testid="reaction-button"]').first();
    await firstReactionButton.click();
    
    const thumbsUpButton = await page.locator('[data-testid="quick-reaction-👍"]');
    await thumbsUpButton.click();
    
    // Wait for reaction to appear
    await page.waitForSelector('[data-testid="reaction-display"]');
    
    // Click on the reaction to remove it
    const reactionButton = await page.locator('[data-testid="reaction-👍"]');
    await reactionButton.click();
    
    // Check if reaction is removed
    await expect(page.locator('text=👍')).not.toBeVisible();
  });
}); 