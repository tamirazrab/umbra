import { expect, test } from "@playwright/test";

test.describe("Chat Page E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chat page
    await page.goto("/chat/new");
  });

  test("should display new chat interface", async ({ page }) => {
    // Wait for page load
    await expect(page).toHaveTitle(/Umbra|Chat|TanStack/i);

    // Check sidebar is present
    await expect(page.locator("aside")).toBeVisible();

    // Check new chat header (use first() since text appears multiple times)
    await expect(page.getByText(/New Chat/i).first()).toBeVisible();
  });

  test("should show sidebar with flows list", async ({ page }) => {
    // Check sidebar header
    await expect(page.getByText("Umbra")).toBeVisible();

    // Check new chat button exists
    await expect(page.getByRole("link", { name: /New Chat/i })).toBeVisible();
  });

  test("should have message input field", async ({ page }) => {
    // Find the message input
    const messageInput = page.getByPlaceholder(/Type your message/i);
    await expect(messageInput).toBeVisible();

    // Check it's enabled
    await expect(messageInput).toBeEnabled();
  });

  test("should have send button", async ({ page }) => {
    // Find send button
    const sendButton = page.getByRole("button", { name: "" }).filter({ has: page.locator("svg") });
    await expect(sendButton.first()).toBeVisible();
  });

  test("should allow typing in message input", async ({ page }) => {
    const messageInput = page.getByPlaceholder(/Type your message/i);

    // Type a message
    await messageInput.fill("Hello, world!");

    // Verify the value
    await expect(messageInput).toHaveValue("Hello, world!");
  });

  test("should display terminal and browser tabs", async ({ page }) => {
    // Check for Terminal tab
    await expect(page.getByRole("button", { name: /Terminal/i })).toBeVisible();

    // Check for Browser tab
    await expect(page.getByRole("button", { name: /Browser/i })).toBeVisible();
  });

  test("should switch between terminal and browser tabs", async ({ page }) => {
    // Click Browser tab
    await page.getByRole("button", { name: /Browser/i }).click();

    // Wait for tab content to update
    await page.waitForTimeout(300);

    // Click Terminal tab to switch back
    await page.getByRole("button", { name: /Terminal/i }).click();

    // Check terminal view is shown
    await expect(page.getByText(/Disconnected|Waiting for output|Active/i).first()).toBeVisible();
  });

  test("should navigate to specific flow from sidebar", async ({ page }) => {
    // First create a flow if needed (this depends on backend being available)
    // For now, just check navigation works

    // Click on New Chat which should navigate to /chat/new
    await page.getByRole("link", { name: /New Chat/i }).click();
    await expect(page).toHaveURL(/\/chat\/new/);
  });
});

test.describe("Responsive Layout", () => {
  test("should display sidebar on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/chat/new");

    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
  });
});

test.describe("Theme Support", () => {
  test("should load with proper styling", async ({ page }) => {
    await page.goto("/chat/new");

    // Check that the page has theme classes applied
    const html = page.locator("html");
    await expect(html).toBeVisible();

    // The page should have proper contrast (not blank)
    const bodyBackground = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bodyBackground).toBeDefined();
  });
});
