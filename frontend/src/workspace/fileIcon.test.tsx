// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  FileIcon,
  FolderIcon,
  fileIcon,
  getFileIconInfo,
  getFolderIconInfo,
} from "./fileIcon";

afterEach(() => {
  cleanup();
});

describe("VS Code File and Folder Icons", () => {
  describe("fileIcon() helper and components", () => {
    it("renders distinct accessible SVG icons for folders and common file types", () => {
      const { container, rerender } = render(<>{fileIcon("src", "folder")}</>);
      const folderIcon = container.querySelector("svg");
      rerender(<>{fileIcon("app.ts", "file")}</>);
      const codeIcon = container.querySelector("svg");
      rerender(<>{fileIcon("photo.png", "file")}</>);
      const imageIcon = container.querySelector("svg");

      expect(folderIcon).not.toBeNull();
      expect(codeIcon).not.toBeNull();
      expect(imageIcon).not.toBeNull();
      expect(folderIcon?.outerHTML).not.toBe(codeIcon?.outerHTML);
      expect(codeIcon?.outerHTML).not.toBe(imageIcon?.outerHTML);
    });

    it("renders <FileIcon /> component with correct data attribute and SVG", () => {
      render(<FileIcon filename="Main.java" size={16} />);
      const iconWrapper = screen.getByTestId("file-icon-java");
      expect(iconWrapper).toBeDefined();
      expect(iconWrapper.getAttribute("data-icon-type")).toBe("java");
      expect(iconWrapper.querySelector("svg")).not.toBeNull();
    });

    it("renders <FolderIcon /> component for open and closed states", () => {
      const { rerender } = render(<FolderIcon name="src" expanded={false} />);
      const closed = screen.getByTestId("folder-icon-src");
      expect(closed.classList.contains("is-expanded")).toBe(false);
      expect(closed.getAttribute("data-folder-type")).toBe("src");

      rerender(<FolderIcon name="src" expanded={true} />);
      const opened = screen.getByTestId("folder-icon-src");
      expect(opened.classList.contains("is-expanded")).toBe(true);
    });
  });

  describe("Programming language file extensions", () => {
    it("recognizes Java files (.java, .jar)", () => {
      expect(getFileIconInfo("App.java").label).toBe("java");
      expect(getFileIconInfo("library.jar").label).toBe("java");
    });

    it("recognizes JavaScript files (.js, .jsx, .mjs, .cjs)", () => {
      expect(getFileIconInfo("index.js").label).toBe("javascript");
      expect(getFileIconInfo("module.mjs").label).toBe("javascript");
      expect(getFileIconInfo("server.cjs").label).toBe("javascript");
      expect(getFileIconInfo("Component.jsx").label).toBe("react-js");
    });

    it("recognizes TypeScript and React TypeScript files (.ts, .tsx, .mts, .cts, .d.ts)", () => {
      expect(getFileIconInfo("index.ts").label).toBe("typescript");
      expect(getFileIconInfo("module.mts").label).toBe("typescript");
      expect(getFileIconInfo("global.d.ts").label).toBe("typescript");
      expect(getFileIconInfo("App.tsx").label).toBe("react-ts");
    });

    it("recognizes Python files (.py, .pyw, .ipynb)", () => {
      expect(getFileIconInfo("script.py").label).toBe("python");
      expect(getFileIconInfo("gui.pyw").label).toBe("python");
      expect(getFileIconInfo("notebook.ipynb").label).toBe("jupyter");
    });

    it("recognizes C and C++ files (.c, .h, .cpp, .hpp, .cc, .cxx)", () => {
      expect(getFileIconInfo("main.c").label).toBe("c");
      expect(getFileIconInfo("header.h").label).toBe("c-header");
      expect(getFileIconInfo("main.cpp").label).toBe("cpp");
      expect(getFileIconInfo("class.hpp").label).toBe("cpp-header");
      expect(getFileIconInfo("vector.cc").label).toBe("cpp");
      expect(getFileIconInfo("matrix.cxx").label).toBe("cpp");
    });

    it("recognizes C# files (.cs, .csx)", () => {
      expect(getFileIconInfo("Program.cs").label).toBe("csharp");
      expect(getFileIconInfo("script.csx").label).toBe("csharp");
    });

    it("recognizes Web markup and styles (.html, .htm, .css, .scss, .sass, .less)", () => {
      expect(getFileIconInfo("index.html").label).toBe("html");
      expect(getFileIconInfo("about.htm").label).toBe("html");
      expect(getFileIconInfo("style.css").label).toBe("css");
      expect(getFileIconInfo("theme.scss").label).toBe("scss");
      expect(getFileIconInfo("main.sass").label).toBe("sass");
      expect(getFileIconInfo("styles.less").label).toBe("less");
    });

    it("recognizes data and markup formats (.json, .jsonc, .xml, .vue)", () => {
      expect(getFileIconInfo("data.json").label).toBe("json");
      expect(getFileIconInfo("settings.jsonc").label).toBe("jsonc");
      expect(getFileIconInfo("feed.xml").label).toBe("xml");
      expect(getFileIconInfo("App.vue").label).toBe("vue");
    });
  });

  describe("Other files and media", () => {
    it("recognizes Markdown, YAML, SQL and Shell files", () => {
      expect(getFileIconInfo("notes.md").label).toBe("markdown");
      expect(getFileIconInfo("doc.markdown").label).toBe("markdown");
      expect(getFileIconInfo("article.mdx").label).toBe("mdx");
      expect(getFileIconInfo("config.yaml").label).toBe("yaml");
      expect(getFileIconInfo("pipeline.yml").label).toBe("yaml");
      expect(getFileIconInfo("query.sql").label).toBe("sql");
      expect(getFileIconInfo("setup.sh").label).toBe("shell");
      expect(getFileIconInfo("script.bash").label).toBe("bash");
      expect(getFileIconInfo("env.zsh").label).toBe("zsh");
    });

    it("recognizes image files (.png, .jpg, .jpeg, .svg, .webp, .gif, .ico)", () => {
      expect(getFileIconInfo("photo.png").label).toBe("image");
      expect(getFileIconInfo("banner.jpg").label).toBe("image");
      expect(getFileIconInfo("avatar.jpeg").label).toBe("image");
      expect(getFileIconInfo("logo.svg").label).toBe("svg");
      expect(getFileIconInfo("thumbnail.webp").label).toBe("image");
      expect(getFileIconInfo("anim.gif").label).toBe("image");
      expect(getFileIconInfo("favicon.ico").label).toBe("image");
    });

    it("recognizes PDF and Text files", () => {
      expect(getFileIconInfo("document.pdf").label).toBe("pdf");
      expect(getFileIconInfo("notes.txt").label).toBe("text");
      expect(getFileIconInfo("output.log").label).toBe("log");
    });

    it("recognizes configuration and dotfiles (.env, .gitignore, .dockerignore)", () => {
      expect(getFileIconInfo(".env").label).toBe("env");
      expect(getFileIconInfo(".env.local").label).toBe("env");
      expect(getFileIconInfo(".env.development").label).toBe("env");
      expect(getFileIconInfo(".env.production").label).toBe("env");
      expect(getFileIconInfo(".gitignore").label).toBe("gitignore");
      expect(getFileIconInfo(".dockerignore").label).toBe("dockerignore");
    });
  });

  describe("Special filenames", () => {
    it("recognizes package.json", () => {
      const info = getFileIconInfo("package.json");
      expect(info.label).toBe("package.json");
      expect(info.color).toBe("#cb3837");
    });

    it("recognizes tsconfig.json", () => {
      const info = getFileIconInfo("tsconfig.json");
      expect(info.label).toBe("tsconfig");
      expect(info.color).toBe("#3178c6");
    });

    it("recognizes vite.config.ts / vite.config.js", () => {
      expect(getFileIconInfo("vite.config.ts").label).toBe("vite");
      expect(getFileIconInfo("vite.config.js").label).toBe("vite");
      expect(getFileIconInfo("vite.config.mjs").label).toBe("vite");
    });

    it("recognizes Dockerfile and docker-compose", () => {
      expect(getFileIconInfo("Dockerfile").label).toBe("docker");
      expect(getFileIconInfo("dockerfile").label).toBe("docker");
      expect(getFileIconInfo("Dockerfile.prod").label).toBe("docker");
      expect(getFileIconInfo("docker-compose.yml").label).toBe("docker");
      expect(getFileIconInfo("docker-compose.yaml").label).toBe("docker");
    });

    it("recognizes README.md and README", () => {
      expect(getFileIconInfo("README.md").label).toBe("readme");
      expect(getFileIconInfo("readme.md").label).toBe("readme");
      expect(getFileIconInfo("README").label).toBe("readme");
    });

    it("recognizes LICENSE", () => {
      expect(getFileIconInfo("LICENSE").label).toBe("license");
      expect(getFileIconInfo("license").label).toBe("license");
      expect(getFileIconInfo("LICENSE.md").label).toBe("license");
      expect(getFileIconInfo("LICENSE.txt").label).toBe("license");
    });

    it("recognizes Makefile and GNUMakefile", () => {
      expect(getFileIconInfo("Makefile").label).toBe("makefile");
      expect(getFileIconInfo("makefile").label).toBe("makefile");
      expect(getFileIconInfo("GNUMakefile").label).toBe("makefile");
    });
  });

  describe("Folder icons", () => {
    it("recognizes special folder names and assigns distinct types and colors", () => {
      expect(getFolderIconInfo("src").type).toBe("src");
      expect(getFolderIconInfo("source").type).toBe("src");
      expect(getFolderIconInfo("public").type).toBe("public");
      expect(getFolderIconInfo("components").type).toBe("components");
      expect(getFolderIconInfo("assets").type).toBe("assets");
      expect(getFolderIconInfo("images").type).toBe("assets");
      expect(getFolderIconInfo("hooks").type).toBe("hooks");
      expect(getFolderIconInfo("pages").type).toBe("pages");
      expect(getFolderIconInfo("views").type).toBe("pages");
      expect(getFolderIconInfo("services").type).toBe("services");
      expect(getFolderIconInfo("utils").type).toBe("utils");
      expect(getFolderIconInfo("lib").type).toBe("utils");
      expect(getFolderIconInfo("tests").type).toBe("tests");
      expect(getFolderIconInfo("test").type).toBe("tests");
      expect(getFolderIconInfo("__tests__").type).toBe("tests");
      expect(getFolderIconInfo("node_modules").type).toBe("node_modules");
    });

    it("falls back to generic gold folder for unrecognized folder names", () => {
      const info = getFolderIconInfo("custom-folder");
      expect(info.type).toBe("default");
      expect(info.color).toBe("#dcb67a");
      expect(info.badge).toBeUndefined();
    });

    it("handles trailing slashes and uppercase folder names", () => {
      expect(getFolderIconInfo("SRC/").type).toBe("src");
      expect(getFolderIconInfo("Components///").type).toBe("components");
      expect(getFolderIconInfo("TESTS").type).toBe("tests");
    });
  });

  describe("Edge cases and robust fallback", () => {
    it("handles uppercase extensions gracefully", () => {
      expect(getFileIconInfo("MAIN.JAVA").label).toBe("java");
      expect(getFileIconInfo("APP.TSX").label).toBe("react-ts");
      expect(getFileIconInfo("STYLE.CSS").label).toBe("css");
      expect(getFileIconInfo("PHOTO.PNG").label).toBe("image");
      expect(getFileIconInfo("DOC.PDF").label).toBe("pdf");
      expect(getFileIconInfo("DATA.JSON").label).toBe("json");
    });

    it("handles filenames with multiple dots correctly", () => {
      expect(getFileIconInfo("App.test.tsx").label).toBe("react-ts");
      expect(getFileIconInfo("jquery.min.js").label).toBe("javascript");
      expect(getFileIconInfo("bundle.min.css").label).toBe("css");
      expect(getFileIconInfo("archive.tar.gz").label).toBe("file");
    });

    it("handles extensionless files gracefully", () => {
      expect(getFileIconInfo("Dockerfile").label).toBe("docker");
      expect(getFileIconInfo("LICENSE").label).toBe("license");
      expect(getFileIconInfo("Makefile").label).toBe("makefile");
      expect(getFileIconInfo("notes").label).toBe("file");
      expect(getFileIconInfo("CHANGELOG").label).toBe("file");
    });

    it("falls back to generic file icon for unknown extensions", () => {
      const info = getFileIconInfo("file.unknownext");
      expect(info.label).toBe("file");
      expect(info.color).toBe("#8e8e8e");
    });

    it("handles empty or blank filenames gracefully", () => {
      expect(getFileIconInfo("").label).toBe("file");
      expect(getFileIconInfo("   ").label).toBe("file");
      expect(getFolderIconInfo("").type).toBe("default");
    });
  });
});
