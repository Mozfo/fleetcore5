/**
 * E2E Tests: V6.3 Status Transitions
 *
 * V6.2-12: Test status transition rules from V6.3 spec
 *
 * V6.3 Transition Rules (8 statuses):
 * - new → demo, nurturing, disqualified
 * - demo → proposal_sent, nurturing, lost, disqualified
 * - proposal_sent → payment_pending, lost, nurturing
 * - payment_pending → converted, lost
 * - converted → (terminal, no transitions)
 * - lost → nurturing
 * - nurturing → demo, proposal_sent, lost
 * - disqualified → (terminal, no transitions)
 *
 * Key test: nurturing → demo requires re-booking, not commercial action
 */

import { test, expect, Page } from "@playwright/test";

// ============================================================================
// FIXTURES & HELPERS
// ============================================================================

/**
 * Authenticate admin user
 */
async function loginAsAdmin(page: Page) {
  const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
  const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD are required"
    );
  }

  await page.goto("/en/sign-in");
  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL(/\/(dashboard|crm)/, { timeout: 30000 });
}

/**
 * Open lead drawer by clicking on a lead card
 */
async function openLeadDrawer(page: Page) {
  const leadCard = page.locator('[data-testid="lead-card"]').first();
  await leadCard.click();
  await page.waitForSelector('[data-testid="lead-drawer"]', { timeout: 10000 });
}

/**
 * Get available status options from dropdown
 */
async function getAvailableStatusOptions(page: Page): Promise<string[]> {
  await page.getByTestId("status-dropdown").click();

  const options = await page.locator('[role="option"]').allTextContents();

  // Close dropdown by clicking elsewhere
  await page.keyboard.press("Escape");

  return options;
}

// ============================================================================
// TRANSITION VALIDATION TESTS
// ============================================================================

test.describe("V6.3 Status Transitions - API Level", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should allow valid transition: new → demo", async ({ request }) => {
    // Test via API to validate backend transition logic
    const response = await request.post("/api/v1/crm/leads/test-transition", {
      data: {
        from_status: "new",
        to_status: "demo",
      },
    });

    const result = await response.json();

    // Should be allowed
    expect(result.allowed).toBe(true);
  });

  test("should reject invalid transition: new → converted", async ({
    request,
  }) => {
    // Test via API to validate backend transition logic
    const response = await request.post("/api/v1/crm/leads/test-transition", {
      data: {
        from_status: "new",
        to_status: "converted",
      },
    });

    const result = await response.json();

    // Should be rejected
    expect(result.allowed).toBe(false);
  });

  test("should reject invalid transition: nurturing → demo (commercial action)", async ({
    request,
  }) => {
    // V6.3 CRITICAL: nurturing → demo requires re-booking, not UI action
    // The commercial should NOT be able to move a lead from nurturing to demo
    // via the status dropdown. It requires the lead to book another demo.

    const response = await request.post("/api/v1/crm/leads/test-transition", {
      data: {
        from_status: "nurturing",
        to_status: "demo",
        via_commercial: true, // Flag indicating this is a commercial action
      },
    });

    const result = await response.json();

    // Should be rejected for commercial actions
    // (only allowed via lead re-booking)
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("re-booking");
  });

  test("should reject transition from terminal status: converted", async ({
    request,
  }) => {
    const response = await request.post("/api/v1/crm/leads/test-transition", {
      data: {
        from_status: "converted",
        to_status: "demo",
      },
    });

    const result = await response.json();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("terminal");
  });

  test("should reject transition from terminal status: disqualified", async ({
    request,
  }) => {
    const response = await request.post("/api/v1/crm/leads/test-transition", {
      data: {
        from_status: "disqualified",
        to_status: "demo",
      },
    });

    const result = await response.json();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("terminal");
  });
});

// ============================================================================
// UI TRANSITION TESTS
// ============================================================================

test.describe("V6.3 Status Transitions - UI Level", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/en/crm/leads");
  });

  test("should only show allowed transitions in dropdown", async ({ page }) => {
    await openLeadDrawer(page);

    // Get available options (current status determines which transitions are shown)
    const availableOptions = await getAvailableStatusOptions(page);

    // Based on V6.3 rules, verify only allowed transitions are shown
    // This is a general check - specific status checks below

    expect(availableOptions.length).toBeGreaterThan(0);
    expect(availableOptions.length).toBeLessThanOrEqual(4); // Max 4 transitions for any status
  });

  test("new status should show: demo, nurturing, disqualified", async ({
    page,
  }) => {
    // Mock or find a lead with "new" status
    await page.route("**/api/v1/crm/leads/*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "test-lead-id",
              status: "new",
              email: "test@example.com",
              company_name: "Test Company",
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await openLeadDrawer(page);
    const options = await getAvailableStatusOptions(page);

    // Should include allowed transitions
    expect(options.some((o) => /demo/i.test(o))).toBe(true);
    expect(options.some((o) => /nurturing/i.test(o))).toBe(true);
    expect(options.some((o) => /disqualified|disqualifié/i.test(o))).toBe(true);

    // Should NOT include disallowed transitions
    expect(options.some((o) => /converted|converti/i.test(o))).toBe(false);
    expect(options.some((o) => /proposal_sent|proposition/i.test(o))).toBe(
      false
    );
    expect(options.some((o) => /payment_pending|paiement/i.test(o))).toBe(
      false
    );
  });

  test("demo status should show: proposal_sent, nurturing, lost, disqualified", async ({
    page,
  }) => {
    await page.route("**/api/v1/crm/leads/*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "test-lead-id",
              status: "demo",
              email: "test@example.com",
              company_name: "Test Company",
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await openLeadDrawer(page);
    const options = await getAvailableStatusOptions(page);

    // Should include allowed transitions
    expect(options.some((o) => /proposal|proposition/i.test(o))).toBe(true);
    expect(options.some((o) => /nurturing/i.test(o))).toBe(true);
    expect(options.some((o) => /lost|perdu/i.test(o))).toBe(true);
    expect(options.some((o) => /disqualified|disqualifié/i.test(o))).toBe(true);

    // Should NOT include new or converted
    expect(options.some((o) => /^new$/i.test(o))).toBe(false);
    expect(options.some((o) => /converted|converti/i.test(o))).toBe(false);
  });

  test("nurturing status should NOT show demo in dropdown", async ({
    page,
  }) => {
    // V6.3 CRITICAL: nurturing → demo requires re-booking
    await page.route("**/api/v1/crm/leads/*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "test-lead-id",
              status: "nurturing",
              email: "test@example.com",
              company_name: "Test Company",
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await openLeadDrawer(page);
    const options = await getAvailableStatusOptions(page);

    // V6.3: nurturing → demo should NOT be available via commercial action
    // The lead must re-book a demo themselves
    expect(options.some((o) => /^demo$/i.test(o))).toBe(false);

    // But proposal_sent and lost should be available
    expect(options.some((o) => /proposal|proposition/i.test(o))).toBe(true);
    expect(options.some((o) => /lost|perdu/i.test(o))).toBe(true);
  });

  test("converted status should show no transitions (terminal)", async ({
    page,
  }) => {
    await page.route("**/api/v1/crm/leads/*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "test-lead-id",
              status: "converted",
              email: "test@example.com",
              company_name: "Test Company",
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await openLeadDrawer(page);

    // Status dropdown should be disabled or show no options
    const dropdown = page.getByTestId("status-dropdown");
    const isDisabled = await dropdown.isDisabled();

    if (!isDisabled) {
      const options = await getAvailableStatusOptions(page);
      expect(options.length).toBe(0);
    }
  });

  test("disqualified status should show no transitions (terminal)", async ({
    page,
  }) => {
    await page.route("**/api/v1/crm/leads/*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "test-lead-id",
              status: "disqualified",
              email: "test@example.com",
              company_name: "Test Company",
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await openLeadDrawer(page);

    // Status dropdown should be disabled or show no options
    const dropdown = page.getByTestId("status-dropdown");
    const isDisabled = await dropdown.isDisabled();

    if (!isDisabled) {
      const options = await getAvailableStatusOptions(page);
      expect(options.length).toBe(0);
    }
  });
});

// ============================================================================
// REASON REQUIREMENT TESTS
// ============================================================================

test.describe("V6.3 Reason Requirements", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/en/crm/leads");
  });

  test("lost transition should require reason", async ({ page }) => {
    await openLeadDrawer(page);

    await page.getByTestId("status-dropdown").click();
    await page.getByRole("option", { name: /lost|perdu/i }).click();

    // Reason modal should appear
    await expect(page.getByTestId("reason-modal")).toBeVisible();

    // Should not be able to submit without reason
    const confirmButton = page.getByRole("button", {
      name: /confirm|confirmer/i,
    });
    await expect(confirmButton).toBeDisabled();

    // Select a reason
    await page.getByTestId("reason-select").click();
    await page.getByRole("option").first().click();

    // Now should be able to submit
    await expect(confirmButton).toBeEnabled();
  });

  test("nurturing transition should require reason", async ({ page }) => {
    await openLeadDrawer(page);

    await page.getByTestId("status-dropdown").click();
    await page.getByRole("option", { name: /nurturing/i }).click();

    // Reason modal should appear
    await expect(page.getByTestId("reason-modal")).toBeVisible();
  });

  test("disqualified transition should require reason", async ({ page }) => {
    await openLeadDrawer(page);

    await page.getByTestId("status-dropdown").click();
    await page
      .getByRole("option", { name: /disqualified|disqualifié/i })
      .click();

    // Reason modal should appear
    await expect(page.getByTestId("reason-modal")).toBeVisible();
  });

  test("demo transition should NOT require reason", async ({ page }) => {
    // Mock a lead with "new" status (can transition to demo)
    await page.route("**/api/v1/crm/leads/*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "test-lead-id",
              status: "new",
              email: "test@example.com",
              company_name: "Test Company",
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await openLeadDrawer(page);

    await page.getByTestId("status-dropdown").click();
    await page.getByRole("option", { name: /demo/i }).click();

    // Reason modal should NOT appear - transition should happen directly
    await expect(page.getByTestId("reason-modal")).not.toBeVisible();
  });
});
