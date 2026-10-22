// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fileIcon } from "./fileIcon";

describe("fileIcon", () => {
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
});
