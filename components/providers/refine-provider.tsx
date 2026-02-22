"use client";

import { Refine } from "@refinedev/core";
import { useUser, useAuth, useActiveOrganization } from "@/lib/auth/client";
import { fleetcoreDataProvider } from "@/lib/providers/refine-data-provider";
import { createAuthProvider } from "@/lib/providers/refine-auth-provider";
import { createAccessControlProvider } from "@/lib/providers/refine-access-control-provider";
import { fleetcoreI18nProvider } from "@/lib/providers/refine-i18n-provider";
import { fleetcoreNotificationProvider } from "@/lib/providers/refine-notification-provider";
import { fleetcoreAuditLogProvider } from "@/lib/providers/refine-audit-log-provider";
import { fleetcoreResources } from "@/lib/providers/refine-resources";
import type { OrgRole } from "@/lib/config/permissions";

export function RefineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { userId, orgId, orgRole, signOut } = useAuth();
  const { organization } = useActiveOrganization();

  const authProvider = createAuthProvider({
    userId,
    orgId: orgId ?? organization?.id ?? null,
    orgRole: orgRole ?? null,
    user: user
      ? {
          fullName: user.fullName,
          primaryEmailAddress: user.primaryEmailAddress?.emailAddress ?? null,
          imageUrl: user.imageUrl,
        }
      : null,
    signOut: async () => {
      await signOut();
    },
  });

  const accessControlProvider = createAccessControlProvider(
    () => (orgRole as OrgRole) ?? null
  );

  return (
    <Refine
      dataProvider={fleetcoreDataProvider}
      authProvider={authProvider}
      accessControlProvider={accessControlProvider}
      i18nProvider={fleetcoreI18nProvider}
      notificationProvider={fleetcoreNotificationProvider}
      auditLogProvider={fleetcoreAuditLogProvider}
      resources={fleetcoreResources}
      options={{
        disableTelemetry: true,
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        projectId: "fleetcore",
      }}
    >
      {children}
    </Refine>
  );
}
