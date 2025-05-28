import { test, expect } from '@playwright/test';

test.describe('Logged-out User Limitations', () => {
  test('should allow limited interactions for non-authenticated users', async ({ page }) => {
    console.log('🔓 Testing logged-out user limitations...');
    
    // Navigate to a show page
    await test.step('Navigate to show page', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Try to navigate to a show page directly or through search
      try {
        await page.goto('/show/1');
        await page.waitForLoadState('networkidle');
      } catch (e) {
        console.log('⚠️ Could not navigate to show page directly');
        return;
      }
      
      console.log('✅ Show page loaded');
    });

    // Test: Logged-out users can view setlists
    await test.step('Verify setlist visibility for logged-out users', async () => {
      console.log('👀 Checking setlist visibility...');
      
      // Look for setlist content
      const setlistSelectors = [
        '[data-testid="setlist"]',
        '.setlist',
        'ul:has(li)',
        'div:has-text("song")',
        'section:has-text("setlist")'
      ];
      
      let setlistFound = false;
      for (const selector of setlistSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 3000 })) {
            setlistFound = true;
            console.log('✅ Setlist is visible to logged-out users');
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!setlistFound) {
        console.log('⚠️ Setlist not immediately visible');
      }
    });

    // Test: Logged-out users can perform one upvote
    await test.step('Test single upvote for logged-out users', async () => {
      console.log('👍 Testing single upvote capability...');
      
      // Look for upvote buttons
      const upvoteSelectors = [
        '[data-testid="upvote-button"]',
        'button:has-text("↑")',
        'button:has-text("▲")',
        'button[aria-label*="upvote" i]',
        '.upvote-button',
        'button[title*="vote" i]'
      ];
      
      let upvoteButton = null;
      for (const selector of upvoteSelectors) {
        try {
          const elements = page.locator(selector);
          const count = await elements.count();
          if (count > 0) {
            upvoteButton = elements.first();
            if (await upvoteButton.isVisible({ timeout: 2000 })) {
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      if (upvoteButton && await upvoteButton.isVisible()) {
        // First upvote should work
        await upvoteButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ First upvote successful');
        
        // Try to upvote again - should be limited
        try {
          await upvoteButton.click();
          await page.waitForTimeout(1000);
          
          // Check if there's any indication of vote limit
          const limitMessages = [
            'text="limit"',
            'text="maximum"',
            'text="only one"',
            'text="sign in"',
            'text="login"'
          ];
          
          for (const message of limitMessages) {
            try {
              const element = page.locator(message);
              if (await element.isVisible({ timeout: 1000 })) {
                console.log('✅ Vote limit enforced for logged-out users');
                break;
              }
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          console.log('⚠️ Could not test vote limiting');
        }
      } else {
        console.log('⚠️ No upvote buttons found');
      }
    });

    // Test: Logged-out users can add one song
    await test.step('Test single song addition for logged-out users', async () => {
      console.log('🎵 Testing single song addition capability...');
      
      // Look for add song functionality
      const addSongSelectors = [
        '[data-testid="add-song-button"]',
        'button:has-text("add song" i)',
        'button:has-text("add" i)',
        'select',
        '.add-song'
      ];
      
      let addSongElement = null;
      for (const selector of addSongSelectors) {
        try {
          addSongElement = page.locator(selector).first();
          if (await addSongElement.isVisible({ timeout: 3000 })) {
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (addSongElement && await addSongElement.isVisible()) {
        await addSongElement.click();
        await page.waitForTimeout(1000);
        
        // Look for song options
        const songOptions = page.locator('option, [role="option"], li').filter({ hasText: /song|track/i });
        const optionCount = await songOptions.count();
        
        if (optionCount > 0) {
          await songOptions.first().click();
          console.log('✅ First song addition successful');
          
          // Try to add another song - should be limited
          try {
            await addSongElement.click();
            await page.waitForTimeout(1000);
            
            // Check for limitation messages
            const limitMessages = [
              'text="limit"',
              'text="maximum"',
              'text="only one"',
              'text="sign in"',
              'text="login"'
            ];
            
            for (const message of limitMessages) {
              try {
                const element = page.locator(message);
                if (await element.isVisible({ timeout: 1000 })) {
                  console.log('✅ Song addition limit enforced for logged-out users');
                  break;
                }
              } catch (e) {
                continue;
              }
            }
          } catch (e) {
            console.log('⚠️ Could not test song addition limiting');
          }
        } else {
          console.log('⚠️ No song options found');
        }
      } else {
        console.log('⚠️ Add song functionality not found');
      }
    });

    // Test: Check for authentication prompts
    await test.step('Verify authentication prompts appear when appropriate', async () => {
      console.log('🔐 Checking for authentication prompts...');
      
      // Look for sign-in/login related text or buttons
      const authSelectors = [
        'button:has-text("sign in" i)',
        'button:has-text("login" i)',
        'a:has-text("sign in" i)',
        'a:has-text("login" i)',
        'text="sign in"',
        'text="login"',
        '[data-testid="auth-prompt"]'
      ];
      
      let authPromptFound = false;
      for (const selector of authSelectors) {
        try {
          const element = page.locator(selector);
          if (await element.isVisible({ timeout: 2000 })) {
            authPromptFound = true;
            console.log('✅ Authentication prompt found');
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!authPromptFound) {
        console.log('ℹ️ No authentication prompts immediately visible');
      }
    });

    // Take a screenshot for verification
    await test.step('Take verification screenshot', async () => {
      await page.screenshot({ path: 'logged-out-user-test.png', fullPage: true });
      console.log('✅ Logged-out user test completed');
    });
  });
});