import { describe, expect, it } from "vitest";
import { getFileCapability, isExecutableFile } from "./fileCapabilities";

describe("fileCapabilities", () => {
  describe("Executable files", () => {
    it("recognizes Java files (.java)", () => {
      const cap = getFileCapability("Main.java");
      expect(cap.isExecutable).toBe(true);
      expect(cap.action).toBe("run");
      expect(cap.executionLanguage).toBe("java");
      expect(isExecutableFile("Calculator.java")).toBe(true);
    });

    it("recognizes JavaScript files (.js, .mjs)", () => {
      const cap = getFileCapability("index.js");
      expect(cap.isExecutable).toBe(true);
      expect(cap.action).toBe("run");
      expect(cap.executionLanguage).toBe("javascript");
      expect(isExecutableFile("server.mjs")).toBe(true);
    });

    it("recognizes TypeScript files (.ts)", () => {
      const cap = getFileCapability("app.ts");
      expect(cap.isExecutable).toBe(true);
      expect(cap.action).toBe("run");
      expect(cap.executionLanguage).toBe("typescript");
    });

    it("recognizes Python files (.py)", () => {
      const cap = getFileCapability("script.py");
      expect(cap.isExecutable).toBe(true);
      expect(cap.action).toBe("run");
      expect(cap.executionLanguage).toBe("python");
    });

    it("recognizes C files (.c)", () => {
      const cap = getFileCapability("main.c");
      expect(cap.isExecutable).toBe(true);
      expect(cap.action).toBe("run");
      expect(cap.executionLanguage).toBe("c");
    });

    it("recognizes C++ files (.cpp, .cc, .cxx)", () => {
      expect(getFileCapability("main.cpp").isExecutable).toBe(true);
      expect(getFileCapability("main.cpp").executionLanguage).toBe("cpp");
      expect(getFileCapability("algo.cc").isExecutable).toBe(true);
      expect(getFileCapability("matrix.cxx").isExecutable).toBe(true);
    });

    it("handles uppercase extensions gracefully", () => {
      expect(getFileCapability("PROGRAM.JAVA").isExecutable).toBe(true);
      expect(getFileCapability("INDEX.JS").isExecutable).toBe(true);
      expect(getFileCapability("APP.TS").isExecutable).toBe(true);
      expect(getFileCapability("SCRIPT.PY").isExecutable).toBe(true);
      expect(getFileCapability("MAIN.C").isExecutable).toBe(true);
      expect(getFileCapability("APP.CPP").isExecutable).toBe(true);
    });

    it("handles multiple dots for executable files", () => {
      expect(getFileCapability("app.spec.js").isExecutable).toBe(true);
      expect(getFileCapability("my.script.py").isExecutable).toBe(true);
    });
  });

  describe("Non-executable files", () => {
    it("excludes header files (.h, .hpp)", () => {
      expect(getFileCapability("header.h").isExecutable).toBe(false);
      expect(getFileCapability("types.hpp").isExecutable).toBe(false);
    });

    it("excludes TypeScript declaration files (.d.ts)", () => {
      expect(getFileCapability("index.d.ts").isExecutable).toBe(false);
    });

    it("excludes React UI component files (.jsx, .tsx)", () => {
      expect(getFileCapability("Component.jsx").isExecutable).toBe(false);
      expect(getFileCapability("App.tsx").isExecutable).toBe(false);
    });

    it("excludes styling files (.css, .scss, .sass, .less)", () => {
      expect(getFileCapability("style.css").isExecutable).toBe(false);
      expect(getFileCapability("theme.scss").isExecutable).toBe(false);
    });

    it("excludes documentation and text files (.md, .txt, .log)", () => {
      expect(getFileCapability("README.md").isExecutable).toBe(false);
      expect(getFileCapability("notes.txt").isExecutable).toBe(false);
      expect(getFileCapability("server.log").isExecutable).toBe(false);
    });

    it("excludes configuration files (.json, .yaml, .xml, .env, .gitignore)", () => {
      expect(getFileCapability("package.json").isExecutable).toBe(false);
      expect(getFileCapability("tsconfig.json").isExecutable).toBe(false);
      expect(getFileCapability("config.yaml").isExecutable).toBe(false);
      expect(getFileCapability("feed.xml").isExecutable).toBe(false);
      expect(getFileCapability(".env").isExecutable).toBe(false);
      expect(getFileCapability(".gitignore").isExecutable).toBe(false);
    });

    it("excludes media and PDFs (.png, .jpg, .svg, .pdf)", () => {
      expect(getFileCapability("photo.png").isExecutable).toBe(false);
      expect(getFileCapability("icon.svg").isExecutable).toBe(false);
      expect(getFileCapability("doc.pdf").isExecutable).toBe(false);
    });

    it("excludes HTML files from Run (and no preview since preview is not implemented)", () => {
      const cap = getFileCapability("index.html");
      expect(cap.isExecutable).toBe(false);
      expect(cap.action).toBe("none");
      expect(cap.isPreviewable).toBe(false);
    });

    it("handles extensionless files", () => {
      expect(getFileCapability("Dockerfile").isExecutable).toBe(false);
      expect(getFileCapability("LICENSE").isExecutable).toBe(false);
      expect(getFileCapability("Makefile").isExecutable).toBe(false);
      expect(getFileCapability("notes").isExecutable).toBe(false);
    });

    it("handles empty or null input", () => {
      expect(getFileCapability("").isExecutable).toBe(false);
      expect(getFileCapability(null).isExecutable).toBe(false);
      expect(getFileCapability(undefined).isExecutable).toBe(false);
    });
  });
});

