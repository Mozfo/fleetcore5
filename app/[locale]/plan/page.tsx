"use client";

import { Navigation } from "@/components/homepage";
import { Footer } from "@/components/shared";
import { Segmentation } from "@/components/homepage/Segmentation";

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />

      {/* Add padding for fixed navigation */}
      <div className="pt-20">
        <Segmentation />
      </div>

      <Footer />
    </div>
  );
}
