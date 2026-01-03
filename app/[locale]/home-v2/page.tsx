"use client";

import { Navigation } from "@/components/homepage/Navigation";
import { Footer } from "@/components/shared/Footer";
import {
  HeroSection,
  AnimatedStory,
  WebAppFeatures,
  LiveDashboardPreview,
  MobileAppTeaser,
  IntegrationsSection,
  SocialProof,
  FinalCTA,
} from "@/components/home-v2";

export default function HomeV2Page() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navigation />
      <main className="pt-16">
        <HeroSection />
        <AnimatedStory />
        <WebAppFeatures />
        <LiveDashboardPreview />
        <MobileAppTeaser />
        <IntegrationsSection />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
