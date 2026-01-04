"use client";

import { Navigation } from "@/components/homepage/Navigation";
import { Footer } from "@/components/shared/Footer";
import {
  HeroSection,
  ValueProps,
  Features,
  SocialProof,
  FinalCTA,
} from "@/components/home-v2";
import { PlatformHub } from "@/components/solopreneur/PlatformHub";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navigation />
      <main className="pt-16">
        {/* 1. Hero - Title + Laptop Screenshot + Platform logos */}
        <HeroSection />

        {/* 2. Value Props - 3 column benefits */}
        <ValueProps />

        {/* 3. Platform Integrations */}
        <PlatformHub />

        {/* 4. Features */}
        <Features />

        {/* 5. Social Proof - Testimonials & Stats */}
        <SocialProof />

        {/* 6. Final CTA */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
