"use client";

import type { NotificationProvider } from "@refinedev/core";
import { toast } from "sonner";

/**
 * Refine NotificationProvider that delegates to Sonner (already used
 * throughout FleetCore). Maps Refine's notification types to Sonner toasts.
 */
export const fleetcoreNotificationProvider: NotificationProvider = {
  open: ({ key, message, type, description }) => {
    const options = { id: key, description };

    switch (type) {
      case "success":
        toast.success(message, options);
        break;
      case "error":
        toast.error(message, options);
        break;
      default:
        // "progress" and any future types → info toast
        toast.info(message, options);
        break;
    }
  },
  close: (key) => {
    toast.dismiss(key);
  },
};
