// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConnectionOfflineBanner, ConnectionStatus } from "./ConnectionStatus";

let currentStatus = "connected";

vi.mock("@liveblocks/react/suspense", () => ({
  useStatus: () => currentStatus,
}));

describe("ConnectionStatus component", () => {
  it("renders connected badge when status is connected", () => {
    currentStatus = "connected";
    render(<ConnectionStatus />);

    expect(screen.getByTestId("connection-status-connected")).toBeDefined();
    expect(screen.getByText("Connected")).toBeDefined();
  });

  it("renders reconnecting badge when status is reconnecting", () => {
    currentStatus = "reconnecting";
    render(<ConnectionStatus />);

    expect(screen.getByTestId("connection-status-reconnecting")).toBeDefined();
    expect(screen.getByText("Reconnecting…")).toBeDefined();
  });

  it("renders offline badge when status is disconnected", () => {
    currentStatus = "disconnected";
    render(<ConnectionStatus />);

    expect(screen.getByTestId("connection-status-offline")).toBeDefined();
    expect(screen.getByText("Offline (Edits saved)")).toBeDefined();
  });

  it("renders banner when offline or reconnecting", () => {
    currentStatus = "disconnected";
    render(<ConnectionOfflineBanner />);

    expect(screen.getByTestId("connection-offline-banner")).toBeDefined();
    expect(screen.getByText(/You are currently offline/)).toBeDefined();
  });

  it("hides banner when connected", () => {
    currentStatus = "connected";
    const { container } = render(<ConnectionOfflineBanner />);

    expect(container.firstChild).toBeNull();
  });
});
