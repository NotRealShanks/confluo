// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MemoryRouter } from "react-router";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import EmailVerificationNotice from "./EmailVerificationNotice";
import { AuthContext } from "../auth/context";

const anonymousContext = {
  status: "anonymous" as const,
  user: null,
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
};

describe("Authentication Pages UI Overhaul", () => {
  afterEach(cleanup);

  it("renders Login page with dark-first technical layout and OAuth providers", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={anonymousContext}>
          <Login />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText("Sign in to Confluo")).toBeDefined();
    expect(screen.getByLabelText(/Email address/i)).toBeDefined();
    expect(screen.getByText("Forgot password?")).toBeDefined();
    expect(screen.getByText("Continue with Google")).toBeDefined();
    expect(screen.getByText("Continue with GitHub")).toBeDefined();
    expect(screen.getByRole("button", { name: /Sign in to workspace/i })).toBeDefined();
  });

  it("renders Signup page with name, email, password fields and 8-char constraint", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={anonymousContext}>
          <Signup />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText("Create your account")).toBeDefined();
    expect(screen.getByLabelText(/Display Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Email address/i)).toBeDefined();
    expect(screen.getByText(/Must be at least 8 characters\./i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Create Confluo Account/i })).toBeDefined();
  });

  it("renders ForgotPassword and handles recovery email dispatch state", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider value={anonymousContext}>
          <ForgotPassword />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText("Reset your password")).toBeDefined();
    const emailInput = screen.getByLabelText(/Account email address/i);
    fireEvent.change(emailInput, { target: { value: "developer@test.io" } });

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await new Promise((r) => setTimeout(r, 450));
    expect(screen.getByText(/Recovery Request Received/i)).toBeDefined();
  });

  it("renders ResetPassword and validates password match", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/reset-password?token=sec-token-123"]}>
        <AuthContext.Provider value={anonymousContext}>
          <ResetPassword />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText("Create new password")).toBeDefined();
    const pwInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(pwInputs[0], { target: { value: "securepassword123" } });
    fireEvent.change(pwInputs[1], { target: { value: "securepassword123" } });

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await new Promise((r) => setTimeout(r, 450));
    expect(screen.getByText(/Password Updated Successfully/i)).toBeDefined();
  });

  it("renders EmailVerificationNotice with status guidance", () => {
    render(
      <MemoryRouter initialEntries={["/verify-email?email=test@confluo.dev"]}>
        <AuthContext.Provider value={anonymousContext}>
          <EmailVerificationNotice />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText("Verify your email")).toBeDefined();
    expect(screen.getByText(/Verification Link Dispatched/i)).toBeDefined();
    expect(screen.getByText(/Third-party OAuth logins are pre-verified/i)).toBeDefined();
  });
});
