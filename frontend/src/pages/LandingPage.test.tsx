// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MemoryRouter } from "react-router";
import LandingPage from "./LandingPage";
import { AuthContext } from "../auth/context";
import type { User } from "../api/types";

const mockUser: User = {
  id: "user-1",
  email: "elena@confluo.dev",
  name: "Elena Rostova",
  avatarUrl: null,
  provider: "email",
};

describe("Public LandingPage Component & Interactive Experience", () => {
  afterEach(cleanup);

  it("renders hero headline, accessible screen reader text, and core product CTAs", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            status: "anonymous",
            user: null,
            signIn: vi.fn(),
            signOut: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <LandingPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Hero Section
    expect(screen.getAllByText(/One workspace\./i).length).toBeGreaterThan(0);
    expect(screen.getByText(/One workspace\. Multiple minds\. Build software, together in real time\./i)).toBeDefined();
    expect(screen.getAllByText(/Start building/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Explore the workspace/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Interactive Walkthrough/i)).toBeDefined();
  });

  it("renders scroll progress bar and responds to mobile navigation drawer toggle", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            status: "anonymous",
            user: null,
            signIn: vi.fn(),
            signOut: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <LandingPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Document Scroll Progress Bar
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeDefined();

    // Mobile Navigation Toggle
    const mobileMenuBtn = screen.getByLabelText(/Toggle navigation menu/i);
    expect(mobileMenuBtn).toBeDefined();

    // Toggle Mobile Drawer Open
    fireEvent.click(mobileMenuBtn);
    expect(screen.getByText(/→ Interactive Walkthrough/i)).toBeDefined();
    expect(screen.getByText(/→ Multiplayer CRDT/i)).toBeDefined();
  });

  it("renders the 5-step interactive walkthrough with step controls", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            status: "anonymous",
            user: null,
            signIn: vi.fn(),
            signOut: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <LandingPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // 5-Step Journey Header
    expect(screen.getByText(/The 5-Step Collaborative Journey/i)).toBeDefined();
    expect(screen.getByText(/Experience the unified developer workflow\./i)).toBeDefined();

    // Step 1 active by default
    expect(screen.getAllByText(/Write code with zero setup/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Monaco Syntax Engine \(Python\)/i)).toBeDefined();

    // Pause / Play button toggle
    const pauseBtn = screen.getByLabelText(/Pause walkthrough/i);
    expect(pauseBtn).toBeDefined();
    fireEvent.click(pauseBtn);
    expect(screen.getByLabelText(/Auto-play walkthrough/i)).toBeDefined();

    // Click Step 2: Real-time Collaboration
    const step2Btn = screen.getByLabelText(/Go to step 2/i);
    fireEvent.click(step2Btn);
    expect(screen.getAllByText(/Collaborate simultaneously/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Liveblocks WebSocket Mesh/i)).toBeDefined();

    // Click Step 4: E2B Sandbox Execution
    const step4Btn = screen.getByLabelText(/Go to step 4/i);
    fireEvent.click(step4Btn);
    expect(screen.getAllByText(/Execute in isolated cloud micro-VMs/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/E2B Micro-VM Runtime/i)).toBeDefined();

    // Click Step 5: Terminal Results
    const step5Btn = screen.getByLabelText(/Go to step 5/i);
    fireEvent.click(step5Btn);
    expect(screen.getAllByText(/Stream output & manage terminals/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Integrated Terminal Panel/i)).toBeDefined();
  });

  it("renders all remaining product sections and final CTA", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            status: "anonymous",
            user: null,
            signIn: vi.fn(),
            signOut: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <LandingPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Problem Section
    expect(
      screen.getAllByText(/Developers lose momentum juggling disconnected tools\./i).length
    ).toBeGreaterThan(0);

    // Collaboration Section
    expect(
      screen.getAllByText(/Edit together with zero merge conflicts\./i).length
    ).toBeGreaterThan(0);

    // Discussions Section
    expect(
      screen.getAllByText(/Conversations anchored directly to code\./i).length
    ).toBeGreaterThan(0);

    // Execution Section
    expect(
      screen.getAllByText(/Run code in micro-VM sandboxes in milliseconds\./i).length
    ).toBeGreaterThan(0);

    // Projects Section
    expect(
      screen.getAllByText(/Granular access controls, instant workspace invitations\./i).length
    ).toBeGreaterThan(0);

    // Architecture Section
    expect(
      screen.getAllByText(/Built with modern, production-grade systems\./i).length
    ).toBeGreaterThan(0);

    // Final CTA
    expect(
      screen.getAllByText(/Your next project deserves a shared workspace\./i).length
    ).toBeGreaterThan(0);
  });

  it("surfaces dashboard link in header when user is authenticated", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            status: "authenticated",
            user: mockUser,
            signIn: vi.fn(),
            signOut: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <LandingPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Dashboard \(Elena Rostova\)/i).length).toBeGreaterThan(0);
  });
});
