"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { useBreadcrumbOverrides } from "@/lib/contexts/BreadcrumbContext";
import { MODULES, type SubNavItem } from "@/lib/config/modules";

export interface BreadcrumbSegment {
  label: string;
  href: string | null; // null = current page (no link)
}

/** Known static path segments with i18n keys */
const SEGMENT_KEYS: Record<string, string> = {
  new: "breadcrumbs.new",
  edit: "breadcrumbs.edit",
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function useBreadcrumbs(): BreadcrumbSegment[] {
  const pathname = usePathname();
  const { t } = useTranslation("common");
  const { localizedPath } = useLocalizedPath();
  const { overrides } = useBreadcrumbOverrides();

  return useMemo(() => {
    const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "");

    // Find matching module (longest href match across modules + subNav)
    let bestModule: (typeof MODULES)[number] | undefined;
    let bestModuleLength = 0;

    for (const mod of MODULES) {
      if (
        pathWithoutLocale.startsWith(mod.href) &&
        mod.href.length > bestModuleLength
      ) {
        bestModule = mod;
        bestModuleLength = mod.href.length;
      }
      if (mod.subNav) {
        for (const sub of mod.subNav) {
          if (
            pathWithoutLocale.startsWith(sub.href) &&
            sub.href.length > bestModuleLength
          ) {
            bestModule = mod;
            bestModuleLength = sub.href.length;
          }
        }
      }
    }

    if (!bestModule) return [];

    const segments: BreadcrumbSegment[] = [];

    // Find best subNav match within the module
    let bestSub: SubNavItem | undefined;
    let bestSubLength = 0;
    if (bestModule.subNav) {
      for (const sub of bestModule.subNav) {
        if (
          pathWithoutLocale.startsWith(sub.href) &&
          sub.href.length > bestSubLength
        ) {
          bestSub = sub;
          bestSubLength = sub.href.length;
        }
      }
    }

    // Deepest matched href (subNav or module)
    const matchedHref = bestSub ? bestSub.href : bestModule.href;

    // Segment 1: Module label
    segments.push({
      label: t(bestModule.labelKey),
      href: localizedPath(bestModule.href.slice(1)),
    });

    // Segment 2: SubNav label (if matched)
    if (bestSub) {
      segments.push({
        label: t(bestSub.labelKey),
        href: localizedPath(bestSub.href.slice(1)),
      });
    }

    // Remaining segments after the matched href
    const remaining = pathWithoutLocale.slice(matchedHref.length);
    if (remaining) {
      const parts = remaining.split("/").filter(Boolean);
      let currentPath = matchedHref;

      for (const part of parts) {
        currentPath += `/${part}`;

        // Priority: context override → known i18n key → capitalize
        let label: string;
        if (overrides[part]) {
          label = overrides[part];
        } else if (SEGMENT_KEYS[part]) {
          label = t(SEGMENT_KEYS[part]);
        } else {
          label = capitalize(part);
        }

        segments.push({
          label,
          href: localizedPath(currentPath.slice(1)),
        });
      }
    }

    // Last segment = current page (no link)
    if (segments.length > 0) {
      segments[segments.length - 1].href = null;
    }

    return segments;
  }, [pathname, t, localizedPath, overrides]);
}
