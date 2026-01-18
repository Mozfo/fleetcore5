/**
 * E2E Tests: Payment Pages
 *
 * V6.2-12: Test payment success and cancelled pages accessibility
 *
 * Tests:
 * - /payment-success page loads correctly
 * - /payment-cancelled page loads correctly
 * - i18n works (EN/FR)
 * - UI elements are present
 */

import { test, expect } from "@playwright/test";

test.describe("Payment Success Page", () => {
  test("should load payment success page in English", async ({ page }) => {
    await page.goto("/en/payment-success");

    // Check page loaded
    await expect(page).toHaveURL(/\/en\/payment-success/);

    // Check main elements are visible
    await expect(
      page.getByRole("heading", { name: /payment successful/i })
    ).toBeVisible();

    // Check welcome message
    await expect(page.getByText(/welcome to fleetcore/i)).toBeVisible();

    // Check next steps section
    await expect(page.getByText(/what happens next/i)).toBeVisible();

    // Check back to homepage link
    await expect(
      page.getByRole("link", { name: /back to homepage/i })
    ).toBeVisible();
  });

  test("should load payment success page in French", async ({ page }) => {
    await page.goto("/fr/payment-success");

    // Check page loaded
    await expect(page).toHaveURL(/\/fr\/payment-success/);

    // Check main elements are visible (French)
    await expect(
      page.getByRole("heading", { name: /paiement réussi/i })
    ).toBeVisible();

    // Check welcome message (French)
    await expect(page.getByText(/bienvenue sur fleetcore/i)).toBeVisible();

    // Check next steps section (French)
    await expect(page.getByText(/et maintenant/i)).toBeVisible();
  });

  test("should display order details with session_id", async ({ page }) => {
    // Note: This test requires a valid session_id from Stripe
    // For E2E testing, we mock the API response
    await page.route("**/api/public/crm/payment-success*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            companyName: "Test Company",
            email: "test@example.com",
            planName: "FleetCore Pro",
            amount: "99.00",
            currency: "EUR",
          },
        }),
      });
    });

    await page.goto("/en/payment-success?session_id=test_session_123");

    // Should show company name in welcome
    await expect(page.getByText(/test company/i)).toBeVisible();

    // Should show plan details
    await expect(page.getByText(/fleetcore pro/i)).toBeVisible();
    await expect(page.getByText(/99.00/)).toBeVisible();
  });
});

test.describe("Payment Cancelled Page", () => {
  test("should load payment cancelled page in English", async ({ page }) => {
    await page.goto("/en/payment-cancelled");

    // Check page loaded
    await expect(page).toHaveURL(/\/en\/payment-cancelled/);

    // Check main elements are visible
    await expect(
      page.getByRole("heading", { name: /payment cancelled/i })
    ).toBeVisible();

    // Check reassurance message
    await expect(page.getByText(/no worries/i)).toBeVisible();
    await expect(page.getByText(/not been charged/i)).toBeVisible();

    // Check help options
    await expect(page.getByText(/have questions/i)).toBeVisible();
    await expect(page.getByText(/not ready yet/i)).toBeVisible();

    // Check retry button
    await expect(
      page.getByRole("link", { name: /book another demo/i })
    ).toBeVisible();

    // Check back to homepage link
    await expect(
      page.getByRole("link", { name: /back to homepage/i })
    ).toBeVisible();
  });

  test("should load payment cancelled page in French", async ({ page }) => {
    await page.goto("/fr/payment-cancelled");

    // Check page loaded
    await expect(page).toHaveURL(/\/fr\/payment-cancelled/);

    // Check main elements are visible (French)
    await expect(
      page.getByRole("heading", { name: /paiement annulé/i })
    ).toBeVisible();

    // Check reassurance message (French)
    await expect(page.getByText(/pas de souci/i)).toBeVisible();
  });

  test('should navigate to book-demo when clicking "Book Another Demo"', async ({
    page,
  }) => {
    await page.goto("/en/payment-cancelled");

    // Click retry button
    await page.getByRole("link", { name: /book another demo/i }).click();

    // Should navigate to book-demo page
    await expect(page).toHaveURL(/\/en\/book-demo/);
  });

  test("should navigate to homepage when clicking back button", async ({
    page,
  }) => {
    await page.goto("/en/payment-cancelled");

    // Click back to homepage
    await page.getByRole("link", { name: /back to homepage/i }).click();

    // Should navigate to homepage
    await expect(page).toHaveURL(/\/en\/?$/);
  });
});
