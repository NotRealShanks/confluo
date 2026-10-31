/**
 * WebContainers Evaluation & Capability Service
 *
 * WebContainers (@webcontainer/api) execute Node.js inside the browser using WebAssembly.
 * This service assesses the current runtime environment for WebContainer prerequisites:
 * 1. Cross-Origin Isolation (`window.crossOriginIsolated === true`)
 * 2. `SharedArrayBuffer` availability
 * 3. Browser engine compatibility
 *
 * Architectural Evaluation:
 * - Prerequisite: The host page must be served with:
 *     Cross-Origin-Opener-Policy: same-origin
 *     Cross-Origin-Embedder-Policy: require-corp (or credentialless)
 * - Blockers in Confluo's current architecture:
 *   1. Google OAuth Popup Flow: `COOP: same-origin` severs `window.opener`, breaking
 *      OAuth popups and redirect return messaging.
 *   2. External Assets: `COEP: require-corp` blocks all external images, fonts, and CDNs
 *      that do not return a Cross-Origin-Resource-Policy header.
 *   3. Startup Latency & Resource Footprint: WebContainers require downloading a large
 *      WebAssembly Node.js binary (~25-40MB) and spinning up a virtual file system.
 *      For HTML/CSS/JS frontend preview, sandboxed iframe execution provides instant,
 *      zero-latency rendering with 100% browser compatibility (including Safari & mobile)
 *      without imposing restrictive COOP/COEP constraints on the rest of the application.
 */

export interface WebContainerCapability {
  supported: boolean;
  crossOriginIsolated: boolean;
  hasSharedArrayBuffer: boolean;
  status: "ready" | "blocked_cross_origin_isolation" | "unsupported_environment";
  reason: string;
  guidance: string;
}

export function evaluateWebContainerEnvironment(): WebContainerCapability {
  if (typeof window === "undefined") {
    return {
      supported: false,
      crossOriginIsolated: false,
      hasSharedArrayBuffer: false,
      status: "unsupported_environment",
      reason: "Window environment is undefined (SSR or headless Node.js context).",
      guidance: "WebContainers require a modern browser client environment.",
    };
  }

  const crossOriginIsolated = Boolean(window.crossOriginIsolated);
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";

  if (!crossOriginIsolated || !hasSharedArrayBuffer) {
    return {
      supported: false,
      crossOriginIsolated,
      hasSharedArrayBuffer,
      status: "blocked_cross_origin_isolation",
      reason: "Missing Cross-Origin Isolation headers (COOP/COEP) or SharedArrayBuffer is disabled.",
      guidance:
        "WebContainers require 'Cross-Origin-Opener-Policy: same-origin' and 'Cross-Origin-Embedder-Policy: require-corp'. Note that enabling these headers blocks OAuth popup windows and external CDN assets. Confluo's sandboxed HTML preview engine operates without these restrictions.",
    };
  }

  return {
    supported: true,
    crossOriginIsolated: true,
    hasSharedArrayBuffer: true,
    status: "ready",
    reason: "Environment satisfies all WebContainer prerequisites.",
    guidance: "WebContainers can run WebAssembly Node.js processes in this session.",
  };
}

