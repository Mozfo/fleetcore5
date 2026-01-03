"use client";

import { Navigation } from "@/components/homepage";
import { Footer } from "@/components/shared";
import {
  HeroSection,
  PlatformHub,
  ValueProposition,
  FeatureSections,
  SocialProof,
  DownloadCTA,
} from "@/components/solopreneur";

export default function SolopreneurPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navigation />

      {/* Main Content */}
      <main className="pt-16">
        <HeroSection />
        <PlatformHub />
        <ValueProposition />
        <FeatureSections />
        <SocialProof />
        <DownloadCTA />
      </main>

      <Footer />
    </div>
  );
}
