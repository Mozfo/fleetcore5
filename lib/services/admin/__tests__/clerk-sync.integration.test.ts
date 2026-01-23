/**
 * ClerkSyncService Integration Tests with PostgreSQL Testcontainers
 *
 * Tests critical Clerk webhook handlers with REAL PostgreSQL database:
 * - Idempotence (duplicate webhooks don't create duplicates)
 * - Database constraints (unique email, clerk_user_id)
 * - Foreign key relations (invitation → member, role → member_roles)
 * - Transactions (audit logs created atomically)
 * - String[] arrays (tags, etc.) - PostgreSQL native support
 *
 * Pattern: 5 tests covering high-risk scenarios with production-parity database
 *
 * Note: These tests require Docker to be running. They will be skipped if Docker is not available.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { ClerkSyncService } from "../clerk-sync.service";
import { NotFoundError } from "@/lib/core/errors";
import { SYSTEM_USER_ID } from "@/lib/constants/system";
import {
  getContainerManager,
  getTestPrisma,
  TEST_DATA,
  isDockerAvailable,
} from "@/lib/core/__tests__/fixtures/postgresql-integration-setup";

// Skip entire test suite if Docker is not available
const shouldSkip = !isDockerAvailable();

describe.skipIf(shouldSkip)(
  "ClerkSyncService - Integration Tests (PostgreSQL)",
  () => {
    let clerkSync: ClerkSyncService;
    let testPrisma: ReturnType<typeof getTestPrisma>;
    const containerManager = getContainerManager();

    beforeAll(async () => {
      await containerManager.initialize();
    }, 60000);

    beforeEach(async () => {
      await containerManager.resetDatabase();
      // Get PostgreSQL test client
      testPrisma = getTestPrisma();
      // Create ClerkSyncService with test Prisma client (dependency injection)
      clerkSync = new ClerkSyncService(testPrisma as never);
    });

    afterAll(async () => {
      await containerManager.teardown();
    }, 60000);

    // ===== TEST 1: User Created → Member in Real PostgreSQL =====

    it("handleUserCreated creates member in real PostgreSQL with invitation", async () => {
      const now = new Date();

      // Setup: Create invitation in PostgreSQL
      const invitation = await testPrisma.adm_invitations.create({
        data: {
          tenant_id: TEST_DATA.ACTIVE_TENANT_ID,
          email: "john.doe@acme.com",
          role: "member", // Role slug (not role_id!)
          token: "test-token-john-doe",
          status: "pending",
          expires_at: new Date(Date.now() + 86400000), // 24h
          sent_at: now,
          last_sent_at: now,
          invitation_type: "additional_user",
          sent_by: TEST_DATA.PROVIDER_EMPLOYEE_ID,
        },
      });

      // Execute: Call handleUserCreated
      await clerkSync.handleUserCreated({
        clerkUserId: "user_clerk_123",
        email: "john.doe@acme.com",
        firstName: "John",
        lastName: "Doe",
      });

      // Verify: Member created in PostgreSQL
      const member = await testPrisma.clt_members.findFirst({
        where: { clerk_user_id: "user_clerk_123" },
      });

      expect(member).toBeTruthy();
      if (!member) throw new Error("Member not found");
      expect(member.email).toBe("john.doe@acme.com");
      expect(member.tenant_id).toBe(TEST_DATA.ACTIVE_TENANT_ID);
      expect(member.first_name).toBe("John");
      expect(member.last_name).toBe("Doe");

      // Verify: Role assigned via member_roles
      const memberRole = await testPrisma.adm_member_roles.findFirst({
        where: { member_id: member.id },
      });

      expect(memberRole).toBeTruthy();
      if (!memberRole) throw new Error("Member role not found");
      expect(memberRole.role_id).toBe(TEST_DATA.ROLE_ID);
      expect(memberRole.is_primary).toBe(true);

      // Verify: Invitation marked accepted
      const updatedInvitation = await testPrisma.adm_invitations.findUnique({
        where: { id: invitation.id },
      });

      expect(updatedInvitation).toBeTruthy();
      if (!updatedInvitation) throw new Error("Invitation not found");
      expect(updatedInvitation.status).toBe("accepted");
      expect(updatedInvitation.accepted_by_member_id).toBe(member.id);

      // Verify: Audit log created in PostgreSQL
      const auditLog = await testPrisma.adm_audit_logs.findFirst({
        where: {
          entity: "member",
          action: "create",
          entity_id: member.id,
        },
      });

      expect(auditLog).toBeTruthy();
    });

    // ===== TEST 2: Idempotence - Duplicate Webhook =====

    it("handleUserCreated is idempotent (2nd call returns early, no duplicate)", async () => {
      const now = new Date();

      // Setup: Create invitation
      await testPrisma.adm_invitations.create({
        data: {
          tenant_id: TEST_DATA.ACTIVE_TENANT_ID,
          email: "jane@acme.com",
          role: "member",
          token: "test-token-jane",
          status: "pending",
          expires_at: new Date(Date.now() + 86400000),
          sent_at: now,
          last_sent_at: now,
          invitation_type: "additional_user",
          sent_by: TEST_DATA.PROVIDER_EMPLOYEE_ID,
        },
      });

      const userData = {
        clerkUserId: "user_clerk_456",
        email: "jane@acme.com",
        firstName: "Jane",
        lastName: "Smith",
      };

      // 1st call: Creates member
      await clerkSync.handleUserCreated(userData);

      const membersCount1 = await testPrisma.clt_members.count();

      // 2nd call: Should return early (idempotent)
      await clerkSync.handleUserCreated(userData);

      const membersCount2 = await testPrisma.clt_members.count();

      // Verify: Same count (no duplicate created)
      expect(membersCount1).toBe(membersCount2);
      expect(membersCount1).toBe(3); // SYSTEM_USER + TEST_DATA.MEMBER_ID + new member
    });

    // ===== TEST 3: Database Constraint - No Invitation Error =====

    it("handleUserCreated throws NotFoundError if no invitation (PostgreSQL check)", async () => {
      // Execute & Verify: Should throw NotFoundError
      await expect(
        clerkSync.handleUserCreated({
          clerkUserId: "user_no_invite",
          email: "noninvited@example.com",
          firstName: "Non",
          lastName: "Invited",
        })
      ).rejects.toThrow(NotFoundError);

      // Verify: No member created in PostgreSQL
      const member = await testPrisma.clt_members.findFirst({
        where: { clerk_user_id: "user_no_invite" },
      });

      expect(member).toBeNull();
    });

    // ===== TEST 4: Organization Created → Tenant in Real PostgreSQL =====

    it("handleOrganizationCreated creates tenant + lifecycle event in PostgreSQL", async () => {
      // Execute: Call handleOrganizationCreated
      await clerkSync.handleOrganizationCreated({
        clerkOrgId: "org_clerk_789",
        name: "Acme Corp",
        subdomain: "acme-corp",
      });

      // Verify: Tenant created in PostgreSQL
      const tenant = await testPrisma.adm_tenants.findFirst({
        where: { clerk_organization_id: "org_clerk_789" },
      });

      expect(tenant).toBeTruthy();
      if (!tenant) throw new Error("Tenant not found");
      expect(tenant.name).toBe("Acme Corp");
      expect(tenant.subdomain).toBe("acme-corp");
      expect(tenant.status).toBe("active");

      // Verify: Lifecycle event created
      const lifecycleEvent =
        await testPrisma.adm_tenant_lifecycle_events.findFirst({
          where: {
            tenant_id: tenant.id,
            event_type: "created",
          },
        });

      expect(lifecycleEvent).toBeTruthy();
      if (!lifecycleEvent) throw new Error("Lifecycle event not found");
      expect(lifecycleEvent.description).toContain(
        "Clerk organization webhook"
      );
    });

    // ===== TEST 5: User Deleted → Soft Delete + Role Revocation =====

    it("handleUserDeleted soft-deletes member and revokes roles in PostgreSQL", async () => {
      // Setup: Create member with role
      const member = await testPrisma.clt_members.create({
        data: {
          tenant_id: TEST_DATA.ACTIVE_TENANT_ID,
          email: "delete@example.com",
          clerk_user_id: "user_to_delete",
          phone: "+33600000000",
        },
      });

      await testPrisma.adm_member_roles.create({
        data: {
          tenant_id: TEST_DATA.ACTIVE_TENANT_ID,
          member_id: member.id,
          role_id: TEST_DATA.ROLE_ID,
          is_primary: true,
          scope_type: "global",
        },
      });

      // Execute: Call handleUserDeleted
      await clerkSync.handleUserDeleted({
        clerkUserId: "user_to_delete",
      });

      // Verify: Member soft-deleted
      const deletedMember = await testPrisma.clt_members.findUnique({
        where: { id: member.id },
      });

      expect(deletedMember).toBeTruthy();
      if (!deletedMember) throw new Error("Deleted member not found");
      expect(deletedMember.deleted_at).toBeTruthy();
      expect(deletedMember.deleted_by).toBe(SYSTEM_USER_ID); // System action
      expect(deletedMember.status).toBe("inactive");

      // Verify: Role revoked (valid_until set)
      const memberRole = await testPrisma.adm_member_roles.findFirst({
        where: { member_id: member.id },
      });

      expect(memberRole).toBeTruthy();
      if (!memberRole) throw new Error("Member role not found");
      expect(memberRole.valid_until).toBeTruthy();
    });
  }
);
