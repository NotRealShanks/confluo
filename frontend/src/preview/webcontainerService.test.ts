// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { evaluateWebContainerEnvironment } from "./webcontainerService";

describe("webcontainerService", () => {
  const originalCrossOriginIsolated = window.crossOriginIsolated;

  afterEach(() => {
    Object.defineProperty(window, "crossOriginIsolated", {
      value: originalCrossOriginIsolated,
      configurable: true,
      writable: true,
    });
  });

  it("reports blocked_cross_origin_isolation when crossOriginIsolated is false", () => {
    Object.defineProperty(window, "crossOriginIsolated", {
      value: false,
      configurable: true,
      writable: true,
    });

    const capability = evaluateWebContainerEnvironment();
    expect(capability.supported).toBe(false);
    expect(capability.status).toBe("blocked_cross_origin_isolation");
    expect(capability.crossOriginIsolated).toBe(false);
    expect(capability.reason).toContain("Cross-Origin Isolation");
  });

  it("reports ready when crossOriginIsolated is true and SharedArrayBuffer is available", () => {
    Object.defineProperty(window, "crossOriginIsolated", {
      value: true,
      configurable: true,
      writable: true,
    });

    const capability = evaluateWebContainerEnvironment();
    // In jsdom environment, SharedArrayBuffer is present in Node 24
    if (typeof SharedArrayBuffer !== "undefined") {
      expect(capability.supported).toBe(true);
      expect(capability.status).toBe("ready");
      expect(capability.crossOriginIsolated).toBe(true);
    }
  });
});
