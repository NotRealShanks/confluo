import { describe, expect, it } from "vitest";
import { getFileCapability, isExecutableFile, isPreviewableFile } from "./fileCapabilities";

describe("fileCapabilities - Multi-Language Support (Programiz Parity)", () => {
  describe("Executable files", () => {
    it("recognizes Java files (.java)", () => {
      const cap = getFileCapability("Main.java");
      expect(cap.isExecutable).toBe(true);
      expect(cap.action).toBe("run");
      expect(cap.executionLanguage).toBe("java");
      expect(isExecutableFile("Calculator.java")).toBe(true);
    });

    it("recognizes JavaScript files (.js, .mjs, .cjs)", () => {
      const cap = getFileCapability("index.js");
      expect(cap.isExecutable).toBe(true);
      expect(cap.action).toBe("run");
      expect(cap.executionLanguage).toBe("javascript");
      expect(isExecutableFile("server.mjs")).toBe(true);
      expect(isExecutableFile("bundle.cjs")).toBe(true);
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

    it("recognizes C# files (.cs, .csx)", () => {
      expect(getFileCapability("Program.cs").isExecutable).toBe(true);
      expect(getFileCapability("Program.cs").executionLanguage).toBe("csharp");
      expect(getFileCapability("script.csx").isExecutable).toBe(true);
    });

    it("recognizes Rust files (.rs)", () => {
      expect(getFileCapability("main.rs").isExecutable).toBe(true);
      expect(getFileCapability("main.rs").executionLanguage).toBe("rust");
    });

    it("recognizes Go files (.go)", () => {
      expect(getFileCapability("main.go").isExecutable).toBe(true);
      expect(getFileCapability("main.go").executionLanguage).toBe("go");
    });

    it("recognizes PHP files (.php)", () => {
      expect(getFileCapability("index.php").isExecutable).toBe(true);
      expect(getFileCapability("index.php").executionLanguage).toBe("php");
    });

    it("recognizes Ruby files (.rb)", () => {
      expect(getFileCapability("app.rb").isExecutable).toBe(true);
      expect(getFileCapability("app.rb").executionLanguage).toBe("ruby");
    });

    it("recognizes Kotlin files (.kt, .kts)", () => {
      expect(getFileCapability("Main.kt").isExecutable).toBe(true);
      expect(getFileCapability("Main.kt").executionLanguage).toBe("kotlin");
    });

    it("recognizes Swift files (.swift)", () => {
      expect(getFileCapability("main.swift").isExecutable).toBe(true);
      expect(getFileCapability("main.swift").executionLanguage).toBe("swift");
    });

    it("recognizes Dart files (.dart)", () => {
      expect(getFileCapability("main.dart").isExecutable).toBe(true);
      expect(getFileCapability("main.dart").executionLanguage).toBe("dart");
    });

    it("recognizes Scala files (.scala)", () => {
      expect(getFileCapability("Main.scala").isExecutable).toBe(true);
      expect(getFileCapability("Main.scala").executionLanguage).toBe("scala");
    });

    it("recognizes R files (.r, .R)", () => {
      expect(getFileCapability("script.r").isExecutable).toBe(true);
      expect(getFileCapability("script.r").executionLanguage).toBe("r");
      expect(getFileCapability("analysis.R").isExecutable).toBe(true);
    });

    it("recognizes SQL files (.sql)", () => {
      expect(getFileCapability("queries.sql").isExecutable).toBe(true);
      expect(getFileCapability("queries.sql").executionLanguage).toBe("sql");
    });

    it("recognizes Shell script files (.sh, .bash)", () => {
      expect(getFileCapability("build.sh").isExecutable).toBe(true);
      expect(getFileCapability("build.sh").executionLanguage).toBe("shell");
      expect(getFileCapability("deploy.bash").isExecutable).toBe(true);
    });

    it("handles uppercase extensions gracefully", () => {
      expect(getFileCapability("PROGRAM.JAVA").isExecutable).toBe(true);
      expect(getFileCapability("INDEX.JS").isExecutable).toBe(true);
      expect(getFileCapability("APP.TS").isExecutable).toBe(true);
      expect(getFileCapability("SCRIPT.PY").isExecutable).toBe(true);
      expect(getFileCapability("MAIN.C").isExecutable).toBe(true);
      expect(getFileCapability("APP.CPP").isExecutable).toBe(true);
      expect(getFileCapability("MAIN.RS").isExecutable).toBe(true);
      expect(getFileCapability("MAIN.GO").isExecutable).toBe(true);
    });

    it("handles multiple dots for executable files", () => {
      expect(getFileCapability("app.spec.js").isExecutable).toBe(true);
      expect(getFileCapability("my.script.py").isExecutable).toBe(true);
      expect(getFileCapability("algo.v2.cpp").isExecutable).toBe(true);
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
      expect(getFileCapability("avatar.jpg").isExecutable).toBe(false);
      expect(getFileCapability("logo.svg").isExecutable).toBe(false);
      expect(getFileCapability("document.pdf").isExecutable).toBe(false);
    });
  });

  describe("Previewable files", () => {
    it("marks HTML files as previewable (.html, .htm)", () => {
      const cap = getFileCapability("index.html");
      expect(cap.isPreviewable).toBe(true);
      expect(cap.isExecutable).toBe(false);
      expect(cap.action).toBe("preview");
      expect(isPreviewableFile("about.htm")).toBe(true);
    });

    it("does not mark non-HTML files as previewable", () => {
      expect(isPreviewableFile("style.css")).toBe(false);
      expect(isPreviewableFile("main.js")).toBe(false);
      expect(isPreviewableFile("app.py")).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("handles null, undefined, and empty string safely", () => {
      expect(getFileCapability(null).isExecutable).toBe(false);
      expect(getFileCapability(undefined).isExecutable).toBe(false);
      expect(getFileCapability("").isExecutable).toBe(false);
      expect(getFileCapability("   ").isExecutable).toBe(false);
    });

    it("handles files with no extension", () => {
      expect(getFileCapability("Dockerfile").isExecutable).toBe(false);
      expect(getFileCapability("Makefile").isExecutable).toBe(false);
      expect(getFileCapability("LICENSE").isExecutable).toBe(false);
    });
  });
});
