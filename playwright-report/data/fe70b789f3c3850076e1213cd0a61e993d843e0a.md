# Test info

- Name: Complete User Flow - Search to Setlist Interaction >> should complete full user journey from search to voting
- Location: /Users/seth/setlist-score-show-3/e2e/e2e-user-flow.spec.ts:4:3

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: locator('input[placeholder*="Search for artists or shows"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for locator('input[placeholder*="Search for artists or shows"]')

    at /Users/seth/setlist-score-show-3/e2e/e2e-user-flow.spec.ts:21:33
    at /Users/seth/setlist-score-show-3/e2e/e2e-user-flow.spec.ts:16:16
```

# Page snapshot

```yaml
- banner:
  - img
  - text: TheSet
  - navigation:
    - link "Home":
      - /url: /
    - link "Artists":
      - /url: /artists
    - link "Shows":
      - /url: /search
  - button:
    - img
  - button "Login"
  - button "Sign up"
- heading "Crowdsourced concert setlists at scale." [level=1]
- paragraph: Discover upcoming shows and vote on setlists for your favorite artists.
- img
- textbox "Search for artists, venues, or cities..."
- text: "Popular searches:"
- button "Taylor Swift"
- button "Drake"
- button "Billie Eilish"
- button "The Weeknd"
- button "Bad Bunny"
- button "Explore Shows"
- button "How It Works"
- heading "Trending Shows" [level=2]
- paragraph: Unable to load trending shows. Please try again later.
- button "Retry"
- heading "How TheSet Works" [level=2]
- text: "1"
- heading "Find Your Show" [level=3]
- paragraph: Search for your favorite artists and discover their upcoming concerts and tour dates.
- text: "2"
- heading "Vote on Setlists" [level=3]
- paragraph: Upvote the songs you want to hear live and see what other fans are voting for in real-time.
- text: "3"
- heading "Compare After the Show" [level=3]
- paragraph: See how your fan-created setlist stacks up against what was actually played at the concert.
- contentinfo:
  - heading "TheSet" [level=3]
  - paragraph: A platform for fans to influence concert setlists through voting, connecting artists with their audience.
  - heading "Navigation" [level=4]
  - list:
    - listitem:
      - link "Home":
        - /url: /
    - listitem:
      - link "Artists":
        - /url: /search
    - listitem:
      - link "Sign In":
        - /url: /login
  - heading "Legal" [level=4]
  - list:
    - listitem:
      - link "Privacy Policy":
        - /url: "#"
    - listitem:
      - link "Terms of Service":
        - /url: "#"
    - listitem:
      - link "About":
        - /url: "#"
  - heading "Connect" [level=4]
  - paragraph: Made with passion for music fans worldwide
  - paragraph: © 2025 TheSet. All rights reserved.
- region "Notifications alt+T"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Complete User Flow - Search to Setlist Interaction', () => {
   4 |   test('should complete full user journey from search to voting', async ({ page }) => {
   5 |     console.log('🚀 Starting complete user flow test...');
   6 |     
   7 |     // Step 1: Navigate to homepage
   8 |     await test.step('Navigate to homepage', async () => {
   9 |       await page.goto('/');
   10 |       await expect(page).toHaveTitle(/TheSet/);
   11 |       await page.waitForLoadState('networkidle');
   12 |       console.log('✅ Homepage loaded successfully');
   13 |     });
   14 |
   15 |     // Step 2: Search for "dispatch"
   16 |     await test.step('Search for "dispatch"', async () => {
   17 |       console.log('🔍 Searching for "dispatch"...');
   18 |       
   19 |       // Look for the search input with the specific placeholder
   20 |       const searchInput = page.locator('input[placeholder*="Search for artists or shows"]');
>  21 |       await expect(searchInput).toBeVisible({ timeout: 10000 });
      |                                 ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
   22 |       
   23 |       await searchInput.fill('dispatch');
   24 |       
   25 |       // Click the search button
   26 |       const searchButton = page.locator('button[type="submit"]').filter({ hasText: 'Search' });
   27 |       await searchButton.click();
   28 |       
   29 |       // Wait for navigation to search results page
   30 |       await page.waitForURL('**/search?q=dispatch', { timeout: 10000 });
   31 |       await page.waitForLoadState('networkidle');
   32 |       
   33 |       console.log('✅ Search completed and navigated to results');
   34 |     });
   35 |
   36 |     // Step 3: Wait for artist results and click on first one
   37 |     await test.step('Click on artist result', async () => {
   38 |       console.log('👤 Looking for artist results...');
   39 |       
   40 |       // Wait for the artists tab to be active and results to load
   41 |       await page.waitForTimeout(3000);
   42 |       
   43 |       // Look for ArtistCard components (they are wrapped in Link components)
   44 |       const artistCard = page.locator('div.grid a').first();
   45 |       
   46 |       // Wait for artist cards to appear
   47 |       await expect(artistCard).toBeVisible({ timeout: 15000 });
   48 |       
   49 |       await artistCard.click();
   50 |       await page.waitForLoadState('networkidle');
   51 |       console.log('✅ Artist page loaded');
   52 |     });
   53 |
   54 |     // Step 4: Verify artist page and look for shows
   55 |     await test.step('Verify artist page and shows', async () => {
   56 |       console.log('🎵 Verifying artist page content...');
   57 |       
   58 |       // Wait for artist page to load
   59 |       await page.waitForTimeout(3000);
   60 |       
   61 |       // Look for shows or concerts section
   62 |       const showsSectionExists = await page.locator('text=shows').isVisible({ timeout: 5000 }).catch(() => false) ||
   63 |                                   await page.locator('text=concerts').isVisible({ timeout: 5000 }).catch(() => false) ||
   64 |                                   await page.locator('text=upcoming').isVisible({ timeout: 5000 }).catch(() => false);
   65 |       
   66 |       if (showsSectionExists) {
   67 |         console.log('✅ Shows section found on artist page');
   68 |       } else {
   69 |         console.log('⚠️ Shows section not immediately visible, continuing test');
   70 |       }
   71 |     });
   72 |
   73 |     // Step 5: Try to navigate to a show page
   74 |     await test.step('Navigate to show page', async () => {
   75 |       console.log('🎪 Looking for show to navigate to...');
   76 |       
   77 |       // Look for show links or buttons
   78 |       const showLink = page.locator('a[href*="/show/"]').first();
   79 |       
   80 |       if (await showLink.isVisible({ timeout: 5000 })) {
   81 |         await showLink.click();
   82 |         await page.waitForLoadState('networkidle');
   83 |         console.log('✅ Show page loaded');
   84 |       } else {
   85 |         // If no shows found, navigate to a test show page
   86 |         console.log('⚠️ No shows found, navigating to test show page');
   87 |         await page.goto('/show/1');
   88 |         await page.waitForLoadState('networkidle');
   89 |       }
   90 |     });
   91 |
   92 |     // Step 6: Look for setlist and voting functionality
   93 |     await test.step('Interact with setlist functionality', async () => {
   94 |       console.log('🎵 Looking for setlist and voting functionality...');
   95 |       
   96 |       await page.waitForTimeout(2000);
   97 |       
   98 |       // Look for voting buttons (upvote/downvote)
   99 |       const upvoteButton = page.locator('button').filter({ hasText: /^\+$|↑|▲|up/i }).first();
  100 |       const voteButton = page.locator('[aria-label*="vote"]').first();
  101 |       const anyVoteButton = page.locator('button[class*="vote"]').first();
  102 |       
  103 |       let votingFound = false;
  104 |       
  105 |       // Try different voting button selectors
  106 |       if (await upvoteButton.isVisible({ timeout: 3000 })) {
  107 |         await upvoteButton.click();
  108 |         console.log('✅ Upvote button clicked');
  109 |         votingFound = true;
  110 |       } else if (await voteButton.isVisible({ timeout: 3000 })) {
  111 |         await voteButton.click();
  112 |         console.log('✅ Vote button clicked');
  113 |         votingFound = true;
  114 |       } else if (await anyVoteButton.isVisible({ timeout: 3000 })) {
  115 |         await anyVoteButton.click();
  116 |         console.log('✅ Voting button clicked');
  117 |         votingFound = true;
  118 |       }
  119 |       
  120 |       if (!votingFound) {
  121 |         console.log('⚠️ Voting functionality not found on this page');
```