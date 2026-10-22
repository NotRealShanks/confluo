// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccountMenu from "./AccountMenu";
import { AuthContext } from "../auth/context";

const user = { id: "user", name: "Ada Lovelace", email: "ada@example.com", avatarUrl: null, provider: "github" };
const signOut = vi.fn();
function renderMenu() { return render(<MemoryRouter><AuthContext value={{ status: "authenticated", user, signIn: vi.fn(), signOut, updateUser: vi.fn() }}><AccountMenu /></AuthContext></MemoryRouter>); }
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("AccountMenu", () => {
  it("opens without signing out and closes on Escape or outside click", () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(signOut).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("shows initials when an avatar is absent and signs out only from the menu action", () => {
    renderMenu();
    expect(screen.getByText("AL")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
