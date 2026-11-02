import { ScrollProgressBar } from "../landing/ScrollProgressBar";
import { LandingHeader } from "../landing/LandingHeader";
import { HeroSection } from "../landing/HeroSection";
import { ProblemSection } from "../landing/ProblemSection";
import { StickyWalkthroughSection } from "../landing/StickyWalkthroughSection";
import { CollaborationSection } from "../landing/CollaborationSection";
import { DiscussionSection } from "../landing/DiscussionSection";
import { ExecutionSection } from "../landing/ExecutionSection";
import { ProjectsSection } from "../landing/ProjectsSection";
import { ArchitectureSection } from "../landing/ArchitectureSection";
import { CtaFooterSection } from "../landing/CtaFooterSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-white selection:text-black overflow-x-clip">
      {/* 0. Slim Document Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* 1. Sticky Navigation Header */}
      <LandingHeader />

      <main>
        {/* 2. Hero Section with Typewriter Headline */}
        <HeroSection />

        {/* 3. The Problem */}
        <ProblemSection />

        {/* 4. Interactive 5-Step Collaborative Walkthrough */}
        <StickyWalkthroughSection />

        {/* 5. Real-time Collaboration (CRDT Engine) */}
        <CollaborationSection />

        {/* 6. Code Discussions (Inline Gutter Threads) */}
        <DiscussionSection />

        {/* 7. Code Execution (E2B Sandboxes) */}
        <ExecutionSection />

        {/* 8. Shared Projects & Access Roles */}
        <ProjectsSection />

        {/* 9. Technical Architecture */}
        <ArchitectureSection />

        {/* 10. Final CTA & Footer */}
        <CtaFooterSection />
      </main>
    </div>
  );
}
