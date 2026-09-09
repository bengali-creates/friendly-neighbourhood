import { LandingWrapper } from "@/components/landing/LandingWrapper";
import { NavBar } from "@/components/landing/NavBar";
import { RadarCanvas } from "@/components/landing/RadarCanvas";
import { ProgressRail } from "@/components/landing/ProgressRail";
import { HeroSection } from "@/components/landing/HeroSection";
import { ThreatScanner } from "@/components/landing/ThreatScanner";
import { PipelineSection } from "@/components/landing/PipelineSection";
import { TelemetryBento } from "@/components/landing/TelemetryBento";
import { CommandDeck } from "@/components/landing/CommandDeck";

export default function MarketingLandingPage() {
  return (
    <LandingWrapper>
      {/* Fixed Ambient Background Canvas */}
      <RadarCanvas />

      {/* Navigation and Side Progress Rail */}
      <NavBar />
      <ProgressRail />

      {/* 5-Act Narrative Experience */}
      <main>
        <HeroSection />
        <ThreatScanner />
        <PipelineSection />
        <TelemetryBento />
        <CommandDeck />
      </main>
    </LandingWrapper>
  );
}
