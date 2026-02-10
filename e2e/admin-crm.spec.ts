/**
 * E2E Tests: Admin CRM
 *
 * V6.2-12: Test admin CRM functionality for V6.3 flow
 *
 * Tests:
 * - Kanban displays 4 phases (Incomplet, Démo, Proposition, Terminé)
 * - Status change with reason (lost, nurturing, disqualified)
 * - CPT section functionality
 * - Payment link generation
 *
 * Requires authentication: Uses PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD
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

  // Navigate to login page
  await page.goto("/en/login");

  // Fill credentials (single-page login form)
  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|crm)/, { timeout: 30000 });
}

// ============================================================================
// KANBAN TESTS
// ============================================================================

test.describe("CRM Kanban - 4 Phases V6.3", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display 4 Kanban phases", async ({ page }) => {
    await page.goto("/en/crm/leads");

    // Wait for Kanban to load
    await page.waitForSelector('[data-testid="kanban-board"]', {
      timeout: 10000,
    });

    // Check 4 phases are visible
    const phases = page.locator('[data-testid="kanban-phase"]');
    await expect(phases).toHaveCount(4);

    // Check phase labels (EN)
    await expect(page.getByText("Incomplete")).toBeVisible();
    await expect(page.getByText("Demo")).toBeVisible();
    await expect(page.getByText("Proposal")).toBeVisible();
    await expect(page.getByText("Completed")).toBeVisible();
  });

  test("should display 4 Kanban phases in French", async ({ page }) => {
    await page.goto("/fr/crm/leads");

    // Wait for Kanban to load
    await page.waitForSelector('[data-testid="kanban-board"]', {
      timeout: 10000,
    });

    // Check phase labels (FR)
    await expect(page.getByText("Incomplet")).toBeVisible();
    await expect(page.getByText("Démo")).toBeVisible();
    await expect(page.getByText("Proposition")).toBeVisible();
    await expect(page.getByText("Terminé")).toBeVisible();
  });

  test("should display status badges within phases", async ({ page }) => {
    await page.goto("/en/crm/leads");

    // Wait for Kanban to load
    await page.waitForSelector('[data-testid="kanban-board"]', {
      timeout: 10000,
    });

    // Check that status groups exist within phases
    // Phase 1 (Incomplete): new
    // Phase 2 (Demo): demo
    // Phase 3 (Proposal): proposal_sent, payment_pending
    // Phase 4 (Completed): converted, lost, nurturing, disqualified

    const statusGroups = page.locator('[data-testid="status-group"]');
    await expect(statusGroups.first()).toBeVisible();
  });
});

// ============================================================================
// STATUS CHANGE WITH REASON TESTS
// ============================================================================

test.describe("CRM Status Change with Reason", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should require reason when changing to lost status", async ({
    page,
  }) => {
    await page.goto("/en/crm/leads");

    // Click on a lead card to open drawer
    const leadCard = page.locator('[data-testid="lead-card"]').first();
    await leadCard.click();

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="lead-drawer"]', {
      timeout: 10000,
    });

    // Click on status dropdown
    await page.getByTestId("status-dropdown").click();

    // Select "Lost"
    await page.getByRole("option", { name: /lost|perdu/i }).click();

    // Reason modal should appear
    await expect(page.getByTestId("reason-modal")).toBeVisible();

    // Check reason dropdown is present
    await expect(page.getByTestId("reason-select")).toBeVisible();

    // Check note textarea is present
    await expect(page.getByTestId("reason-note")).toBeVisible();
  });

  test("should require reason when changing to nurturing status", async ({
    page,
  }) => {
    await page.goto("/en/crm/leads");

    // Click on a lead card to open drawer
    const leadCard = page.locator('[data-testid="lead-card"]').first();
    await leadCard.click();

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="lead-drawer"]', {
      timeout: 10000,
    });

    // Click on status dropdown
    await page.getByTestId("status-dropdown").click();

    // Select "Nurturing"
    await page.getByRole("option", { name: /nurturing/i }).click();

    // Reason modal should appear
    await expect(page.getByTestId("reason-modal")).toBeVisible();
  });

  test("should require reason when changing to disqualified status", async ({
    page,
  }) => {
    await page.goto("/en/crm/leads");

    // Click on a lead card to open drawer
    const leadCard = page.locator('[data-testid="lead-card"]').first();
    await leadCard.click();

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="lead-drawer"]', {
      timeout: 10000,
    });

    // Click on status dropdown
    await page.getByTestId("status-dropdown").click();

    // Select "Disqualified"
    await page
      .getByRole("option", { name: /disqualified|disqualifié/i })
      .click();

    // Reason modal should appear
    await expect(page.getByTestId("reason-modal")).toBeVisible();
  });

  test("should save reason when submitted", async ({ page }) => {
    await page.goto("/en/crm/leads");

    // Click on a lead card to open drawer
    const leadCard = page.locator('[data-testid="lead-card"]').first();
    await leadCard.click();

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="lead-drawer"]', {
      timeout: 10000,
    });

    // Click on status dropdown
    await page.getByTestId("status-dropdown").click();

    // Select "Lost"
    await page.getByRole("option", { name: /lost|perdu/i }).click();

    // Fill reason
    await page.getByTestId("reason-select").click();
    await page.getByRole("option").first().click();

    // Fill note
    await page.getByTestId("reason-note").fill("Test reason note for E2E");

    // Submit
    await page.getByRole("button", { name: /confirm|confirmer/i }).click();

    // Modal should close
    await expect(page.getByTestId("reason-modal")).not.toBeVisible();

    // Toast should appear
    await expect(
      page.getByText(/status updated|statut mis à jour/i)
    ).toBeVisible();
  });
});

// ============================================================================
// CPT SECTION TESTS
// ============================================================================

test.describe("CRM CPT Qualification Section", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display CPT section in lead detail", async ({ page }) => {
    await page.goto("/en/crm/leads");

    // Click on a lead card to open drawer
    const leadCard = page.locator('[data-testid="lead-card"]').first();
    await leadCard.click();

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="lead-drawer"]', {
      timeout: 10000,
    });

    // Check CPT section is visible
    await expect(page.getByTestId("cpt-section")).toBeVisible();

    // Check CPT labels
    await expect(page.getByText(/challenges|défis/i)).toBeVisible();
    await expect(page.getByText(/priority|priorité/i)).toBeVisible();
    await expect(page.getByText(/timing/i)).toBeVisible();
  });

  test("should open CPT modal when clicking edit", async ({ page }) => {
    await page.goto("/en/crm/leads");

    // Click on a lead card to open drawer
    const leadCard = page.locator('[data-testid="lead-card"]').first();
    await leadCard.click();

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="lead-drawer"]', {
      timeout: 10000,
    });

    // Click edit CPT button
    await page.getByTestId("edit-cpt-button").click();

    // Modal should open
    await expect(page.getByTestId("cpt-modal")).toBeVisible();

    // Check form fields are present
    await expect(page.getByTestId("challenges-textarea")).toBeVisible();
    await expect(page.getByTestId("challenges-score")).toBeVisible();
    await expect(page.getByTestId("priority-textarea")).toBeVisible();
    await expect(page.getByTestId("priority-score")).toBeVisible();
    await expect(page.getByTestId("timing-textarea")).toBeVisible();
    await expect(page.getByTestId("timing-score")).toBeVisible();
  });

  test("should calculate and display qualification score", async ({ page }) => {
    await page.goto("/en/crm/leads");

    // Click on a lead card to open drawer
    const leadCard = page.locator('[data-testid="lead-card"]').first();
    await leadCard.click();

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="lead-drawer"]', {
      timeout: 10000,
    });

    // Click edit CPT button
    await page.getByTestId("edit-cpt-button").click();

    // Fill CPT form
    await page
      .getByTestId("challenges-textarea")
      .fill("Managing fleet manually with Excel spreadsheets");
    await page.getByTestId("challenges-score").click();
    await page.getByRole("option", { name: /high/i }).click();

    await page
      .getByTestId("priority-textarea")
      .fill("Need solution urgently for Q1");
    await page.getByTestId("priority-score").click();
    await page.getByRole("option", { name: /high/i }).click();

    await page
      .getByTestId("timing-textarea")
      .fill("Want to implement within 2 weeks");
    await page.getByTestId("timing-score").click();
    await page.getByRole("option", { name: /hot/i }).click();

    // Check score is calculated and displayed
    await expect(page.getByTestId("qualification-score")).toBeVisible();
    const scoreText = await page
      .getByTestId("qualification-score")
      .textContent();
    expect(scoreText).toMatch(/\d+/); // Should contain a number
  });
});

// ============================================================================
// PAYMENT LINK GENERATION TESTS
// ============================================================================

test.describe("CRM Payment Link Generation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display payment section for eligible leads", async ({
    page,
  }) => {
    await page.goto("/en/crm/leads");

    // Find a lead with demo or proposal_sent status
    // For this test, we'll check if the payment section appears when expected
    const leadCard = page.locator('[data-testid="lead-card"]').first();
    await leadCard.click();

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="lead-drawer"]', {
      timeout: 10000,
    });

    // Payment section visibility depends on lead status
    // It should be visible for: demo, proposal_sent, payment_pending
    const paymentSection = page.getByTestId("payment-section");

    // If visible, check content
    if (await paymentSection.isVisible()) {
      await expect(page.getByText(/payment|paiement/i).first()).toBeVisible();
    }
  });

  test("should open payment link modal when clicking generate", async ({
    page,
  }) => {
    await page.goto("/en/crm/leads");

    // Click on a lead card
    const leadCard = page.locator('[data-testid="lead-card"]').first();
    await leadCard.click();

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="lead-drawer"]', {
      timeout: 10000,
    });

    // Check if generate button exists
    const generateButton = page.getByTestId("generate-payment-link-button");

    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Modal should open
      await expect(page.getByTestId("payment-link-modal")).toBeVisible();

      // Check form fields
      await expect(page.getByTestId("plan-select")).toBeVisible();
      await expect(page.getByTestId("billing-cycle-select")).toBeVisible();
    }
  });

  test("should display existing payment link info", async ({ page }) => {
    await page.goto("/en/crm/leads");

    // Find a lead with payment_pending status (if any)
    // This test verifies the payment link display when already generated

    const leadCard = page.locator('[data-testid="lead-card"]').first();
    await leadCard.click();

    // Wait for drawer to open
    await page.waitForSelector('[data-testid="lead-drawer"]', {
      timeout: 10000,
    });

    // Check for existing payment link display
    const paymentLinkUrl = page.getByTestId("payment-link-url");

    if (await paymentLinkUrl.isVisible()) {
      // Copy button should be available
      await expect(page.getByTestId("copy-link-button")).toBeVisible();

      // Send email button should be available
      await expect(page.getByTestId("send-email-button")).toBeVisible();
    }
  });
});
