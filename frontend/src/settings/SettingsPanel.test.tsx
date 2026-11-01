// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SettingsProvider } from "./SettingsContext";
import { useSettings } from "./useSettings";
import { SettingsPanel } from "./SettingsPanel";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "./types";

function TestHarness() {
  const { openSettings, isSettingsOpen } = useSettings();
  return (
    <div>
      <button type="button" onClick={openSettings} data-testid="open-settings-btn">
        Open Settings
      </button>
      <span data-testid="open-status">{isSettingsOpen ? "open" : "closed"}</span>
      <SettingsPanel />
    </div>
  );
}

describe("SettingsPanel component", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-reduced-motion");
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render when closed, and renders when opened", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    expect(screen.getByTestId("open-status").textContent).toBe("closed");
    expect(screen.queryByRole("dialog", { name: "IDE Settings" })).toBeNull();

    fireEvent.click(screen.getByTestId("open-settings-btn"));

    expect(screen.getByTestId("open-status").textContent).toBe("open");
    expect(screen.getByRole("dialog", { name: "IDE Settings" })).toBeDefined();
  });

  it("closes when the close button is clicked", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByTestId("open-settings-btn"));
    expect(screen.getByRole("dialog", { name: "IDE Settings" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Close settings" }));
    expect(screen.queryByRole("dialog", { name: "IDE Settings" })).toBeNull();
  });

  it("closes when the Escape key is pressed", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByTestId("open-settings-btn"));
    expect(screen.getByRole("dialog", { name: "IDE Settings" })).toBeDefined();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "IDE Settings" })).toBeNull();
  });

  it("switches theme and immediately applies data-theme attribute", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByTestId("open-settings-btn"));

    const darkRadio = screen.getByRole("radio", { name: /^dark$/i });
    fireEvent.click(darkRadio);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    expect(saved.theme).toBe("dark");

    const lightRadio = screen.getByRole("radio", { name: /^light$/i });
    fireEvent.click(lightRadio);

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    const savedLight = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    expect(savedLight.theme).toBe("light");
  });

  it("switches editor themes and immediately applies data-editor-theme attribute", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByTestId("open-settings-btn"));

    const draculaBtn = screen.getByRole("radio", { name: /dracula/i });
    fireEvent.click(draculaBtn);

    expect(document.documentElement.getAttribute("data-editor-theme")).toBe("dracula");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    expect(saved.editorTheme).toBe("dracula");
  });

  it("allows navigating categories and displays editor settings", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByTestId("open-settings-btn"));

    const editorNavBtn = screen.getByRole("button", { name: "Editor" });
    fireEvent.click(editorNavBtn);

    expect(screen.getByLabelText("Font size in pixels")).toBeDefined();
    expect(screen.getByLabelText("Editor font family preset")).toBeDefined();
    expect(screen.getByRole("switch", { name: "Toggle word wrap" })).toBeDefined();
    expect(screen.getByRole("switch", { name: "Toggle minimap" })).toBeDefined();
    expect(screen.getByRole("switch", { name: "Toggle line numbers" })).toBeDefined();
    expect(screen.getByRole("switch", { name: "Insert spaces instead of tabs" })).toBeDefined();
    expect(screen.getByLabelText("Cursor blinking style")).toBeDefined();
    expect(screen.getByRole("switch", { name: "Toggle bracket pair colorization" })).toBeDefined();
    expect(screen.getByLabelText("Render whitespace option")).toBeDefined();
  });

  it("modifies editor options and persists them to localStorage", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByTestId("open-settings-btn"));
    fireEvent.click(screen.getByRole("button", { name: "Editor" }));

    // Update Font Size
    const fontSizeSlider = screen.getByLabelText("Font size in pixels");
    fireEvent.change(fontSizeSlider, { target: { value: "18" } });

    // Toggle Word Wrap
    const wordWrapSwitch = screen.getByRole("switch", { name: "Toggle word wrap" });
    fireEvent.click(wordWrapSwitch);

    // Toggle Minimap
    const minimapSwitch = screen.getByRole("switch", { name: "Toggle minimap" });
    fireEvent.click(minimapSwitch);

    // Change Tab Size
    const tabSize4 = screen.getByRole("button", { name: "4 spaces" });
    fireEvent.click(tabSize4);

    // Change Cursor Blinking
    const cursorSelect = screen.getByLabelText("Cursor blinking style");
    fireEvent.change(cursorSelect, { target: { value: "smooth" } });

    // Verify localStorage
    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    expect(saved.fontSize).toBe(18);
    expect(saved.wordWrap).toBe("on");
    expect(saved.minimap).toBe(false);
    expect(saved.tabSize).toBe(4);
    expect(saved.cursorBlinking).toBe("smooth");
  });

  it("filters settings through the search field", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByTestId("open-settings-btn"));

    const searchInput = screen.getByLabelText("Search settings");
    fireEvent.change(searchInput, { target: { value: "font" } });

    expect(screen.getByLabelText("Font size in pixels")).toBeDefined();
    expect(screen.queryByRole("radio", { name: /dark/i })).toBeNull();

    // Clear search
    const clearBtn = screen.getByLabelText("Clear search");
    fireEvent.click(clearBtn);

    expect(searchInput).toHaveProperty("value", "");
  });

  it("displays no settings message when search has no matches", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByTestId("open-settings-btn"));

    const searchInput = screen.getByLabelText("Search settings");
    fireEvent.change(searchInput, { target: { value: "xyz123nonexistent" } });

    expect(screen.getByText('No settings matching "xyz123nonexistent"')).toBeDefined();
  });

  it("displays Files information explaining real-time sync", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByTestId("open-settings-btn"));
    fireEvent.click(screen.getByRole("button", { name: "Files" }));

    expect(screen.getByText("Real-time CRDT Synchronization")).toBeDefined();
    expect(screen.getByText(/Note on traditional autosave:/i)).toBeDefined();
  });

  it("displays Accessibility options and supports reduced motion", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByTestId("open-settings-btn"));
    fireEvent.click(screen.getByRole("button", { name: "Accessibility" }));

    const motionSelect = screen.getByLabelText("Reduced motion preference");
    fireEvent.change(motionSelect, { target: { value: "reduce" } });

    expect(document.documentElement.getAttribute("data-reduced-motion")).toBe("true");

    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    expect(saved.reducedMotion).toBe("reduce");
  });

  it("resets all settings to defaults when Reset button is clicked", () => {
    render(
      <SettingsProvider>
        <TestHarness />
      </SettingsProvider>,
    );

    fireEvent.click(screen.getByTestId("open-settings-btn"));

    // Modify a setting
    const darkRadio = screen.getByRole("radio", { name: /^dark$/i });
    fireEvent.click(darkRadio);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Click Reset
    const resetBtn = screen.getByRole("button", { name: "Reset to default settings" });
    fireEvent.click(resetBtn);

    expect(screen.getByText("Defaults restored!")).toBeDefined();

    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    expect(saved.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
    expect(saved.theme).toBe(DEFAULT_SETTINGS.theme);
  });

  it("restores preferences saved in localStorage upon reload", async () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      theme: "dark" as const,
      fontSize: 20,
      tabSize: 8 as const,
      wordWrap: "on" as const,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(customSettings));

    function Reader() {
      const { settings } = useSettings();
      return (
        <div>
          <span data-testid="read-theme">{settings.theme}</span>
          <span data-testid="read-size">{settings.fontSize}</span>
          <span data-testid="read-tab">{settings.tabSize}</span>
          <span data-testid="read-wrap">{settings.wordWrap}</span>
        </div>
      );
    }

    render(
      <SettingsProvider>
        <Reader />
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("read-theme").textContent).toBe("dark");
      expect(screen.getByTestId("read-size").textContent).toBe("20");
      expect(screen.getByTestId("read-tab").textContent).toBe("8");
      expect(screen.getByTestId("read-wrap").textContent).toBe("on");
    });
  });
});
