/**
 * Book Demo Layout - Split Screen Design
 *
 * Modern SaaS layout with form on left, product showcase on right.
 * Research shows 88% of prospects won't book a demo without seeing the product.
 *
 * @module app/[locale]/(public)/book-demo/layout
 */

import { BookDemoLayoutClient } from "@/components/booking/BookDemoLayoutClient";

export default function BookDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BookDemoLayoutClient>{children}</BookDemoLayoutClient>;
}
