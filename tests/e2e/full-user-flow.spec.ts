import { test, expect } from '@playwright/test';

test.describe('Complete User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from homepage
    await page.goto('/');
  });

  test('should complete full user journey from search to voting', async ({ page }) => {
    // Step 1: Search for an artist
    await page.fill('[data-testid="search-input"]', 'Taylor Swift');
    await page.keyboard.press('Enter');
    
    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]');
    
    // Step 2: Click on artist
    await page.click('[data-testid="artist-card"]:first-child');
    
    // Wait for artist page
    await page.waitForURL(/\/artist\//);
    await expect(page.locator('h1')).toContainText('Taylor Swift');
    
    // Step 3: Select an upcoming show
    await page.click('[data-testid="upcoming-show"]:first-child');
    
    // Wait for show page
    await page.waitForURL(/\/show\//);
    
    // Step 4: Sign up/Login
    const loginButton = page.locator('[data-testid="login-button"]');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Fill login form
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'testpassword123');
      await page.click('[type="submit"]');
      
      // Wait for redirect back to show page
      await page.waitForURL(/\/show\//);
    }
    
    // Step 5: Vote for songs
    const songCards = page.locator('[data-testid="song-card"]');
    const songCount = await songCards.count();
    
    // Vote for up to 5 songs
    for (let i = 0; i < Math.min(5, songCount); i++) {
      const voteButton = songCards.nth(i).locator('[data-testid="vote-button"]');
      
      if (await voteButton.isEnabled()) {
        await voteButton.click();
        
        // Wait for vote to register
        await expect(voteButton).toBeDisabled();
        
        // Check vote count increased
        const voteCount = songCards.nth(i).locator('[data-testid="vote-count"]');
        await expect(voteCount).not.toContainText('0');
      }
    }
    
    // Step 6: Check vote limits
    const voteLimitIndicator = page.locator('[data-testid="vote-limits"]');
    await expect(voteLimitIndicator).toBeVisible();
    await expect(voteLimitIndicator).toContainText(/\d+ votes remaining/);
  });

  test('should show real-time vote updates', async ({ page, context }) => {
    // Navigate to a show page
    await page.goto('/');
    await page.fill('[data-testid="search-input"]', 'Taylor Swift');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="search-results"]');
    await page.click('[data-testid="artist-card"]:first-child');
    await page.click('[data-testid="upcoming-show"]:first-child');
    
    const showUrl = page.url();
    
    // Open second tab
    const page2 = await context.newPage();
    await page2.goto(showUrl);
    
    // Login on first page
    await page.click('[data-testid="login-button"]');
    await page.fill('[name="email"]', 'test1@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('[type="submit"]');
    await page.waitForURL(showUrl);
    
    // Login on second page
    await page2.click('[data-testid="login-button"]');
    await page2.fill('[name="email"]', 'test2@example.com');
    await page2.fill('[name="password"]', 'testpassword123');
    await page2.click('[type="submit"]');
    await page2.waitForURL(showUrl);
    
    // Vote on first page
    const firstSongVoteButton = page.locator('[data-testid="song-card"]:first-child [data-testid="vote-button"]');
    await firstSongVoteButton.click();
    
    // Check vote appears on second page
    const firstSongVoteCount = page2.locator('[data-testid="song-card"]:first-child [data-testid="vote-count"]');
    await expect(firstSongVoteCount).not.toContainText('0', { timeout: 5000 });
  });

  test('should enforce vote limits', async ({ page }) => {
    // Quick navigation to show page
    await page.goto('/show/test-show-with-many-songs');
    
    // Login
    await page.click('[data-testid="login-button"]');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('[type="submit"]');
    
    // Try to vote for 11 songs (limit is 10)
    const voteButtons = page.locator('[data-testid="vote-button"]:enabled');
    const availableButtons = await voteButtons.count();
    
    for (let i = 0; i < Math.min(11, availableButtons); i++) {
      const button = voteButtons.nth(0); // Always get first enabled button
      await button.click();
      
      if (i < 10) {
        // Should succeed
        await expect(button).toBeDisabled();
      } else {
        // 11th vote should show error
        await expect(page.locator('[data-testid="toast-error"]')).toContainText('vote limit reached');
      }
      
      await page.waitForTimeout(100); // Small delay between votes
    }
    
    // Check that no more vote buttons are enabled
    await expect(page.locator('[data-testid="vote-button"]:enabled')).toHaveCount(0);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/show/test-show');
    
    // Login
    await page.click('[data-testid="login-button"]');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('[type="submit"]');
    
    // Simulate network failure
    await page.route('**/rpc/vote_for_song', route => route.abort());
    
    // Try to vote
    await page.click('[data-testid="vote-button"]:first-child');
    
    // Should show error message
    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="toast-error"]')).toContainText(/failed|error/i);
    
    // Vote button should be re-enabled
    await expect(page.locator('[data-testid="vote-button"]:first-child')).toBeEnabled();
  });

  test('should import artist catalog successfully', async ({ page }) => {
    // Navigate to artist page
    await page.goto('/artist/spotify-artist-without-songs');
    
    // Login as admin
    await page.click('[data-testid="login-button"]');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'adminpassword123');
    await page.click('[type="submit"]');
    
    // Click import catalog button
    await page.click('[data-testid="import-catalog-button"]');
    
    // Should show progress
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();
    
    // Wait for import to complete (with timeout)
    await expect(page.locator('[data-testid="import-complete"]')).toBeVisible({ timeout: 30000 });
    
    // Songs should now be visible
    await expect(page.locator('[data-testid="artist-songs"]')).toBeVisible();
    await expect(page.locator('[data-testid="song-item"]')).toHaveCount(greaterThan(0));
  });
});

test.describe('Mobile User Flow', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should work on mobile devices', async ({ page }) => {
    await page.goto('/');
    
    // Mobile menu should be visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Search should work
    await page.fill('[data-testid="search-input"]', 'Taylor Swift');
    await page.keyboard.press('Enter');
    
    // Results should be mobile-optimized
    await expect(page.locator('[data-testid="search-results"]')).toHaveCSS('display', 'flex');
    await expect(page.locator('[data-testid="search-results"]')).toHaveCSS('flex-direction', 'column');
    
    // Navigate to show
    await page.click('[data-testid="artist-card"]:first-child');
    await page.click('[data-testid="upcoming-show"]:first-child');
    
    // Voting interface should be mobile-friendly
    const voteButtons = page.locator('[data-testid="vote-button"]');
    const firstButton = voteButtons.first();
    
    // Check button is large enough for mobile
    const box = await firstButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44); // iOS minimum touch target
  });
});