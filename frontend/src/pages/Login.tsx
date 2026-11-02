import { Link, Navigate, useSearchParams } from "react-router";
import { login } from "../api/auth";
import { useAuth } from "../auth/context";
import { formValue, useAuthSubmit } from "../auth/useAuthSubmit";
import AuthLayout from "../components/AuthLayout";
import OAuthButtons from "../components/OAuthButtons";
import TextField from "../components/TextField";
import { AlertCircle, ArrowRight } from "lucide-react";

// Codes come from OAuth2LoginHandler on the backend
const ERROR_MESSAGES: Record<string, string> = {
  email_conflict:
    "This email is already registered with a different sign-in method. Use the method you signed up with.",
  email_unverified: "The provider did not return a verified email address.",
  oauth_failed: "Sign-in was cancelled or failed. Please try again.",
  invalid_profile: "The provider returned an incomplete profile.",
  unsupported_provider: "That sign-in provider is not supported.",
  missing_token: "Sign-in did not complete. Please try again.",
};

export default function Login() {
  const { status } = useAuth();
  const [params] = useSearchParams();
  const { submit, pending, formError, fieldErrors } = useAuthSubmit((data) =>
    login(formValue(data, "email").trim(), formValue(data, "password")),
  );

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  const code = params.get("error");
  const oauthError = code ? (ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.") : null;
  const alertMessage = formError ?? oauthError;

  return (
    <AuthLayout
      title="Sign in to Confluo"
      subtitle="Access your collaborative workspaces and cloud sandboxes."
    >
      {alertMessage && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-md border border-[#FF6B6B]/40 bg-[#2A1515] p-3 font-mono text-xs text-[#FF6B6B]">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{alertMessage}</span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="engineer@team.dev"
          maxLength={254}
          error={fieldErrors.email}
        />
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-medium text-[#f4f4f5]">Password</span>
            <Link
              to="/forgot-password"
              className="font-mono text-[11px] text-[#d4d4d8] hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <TextField
            label=""
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            maxLength={72}
            error={fieldErrors.password}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-white bg-white text-black py-2.5 font-mono text-xs font-semibold text-[#09090b] transition-all hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(255, 255, 255, )] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{pending ? "Authenticating…" : "Sign in to workspace"}</span>
          <ArrowRight size={13} />
        </button>
      </form>

      <OAuthButtons />

      <p className="mt-6 text-center font-mono text-xs text-[#a1a1aa]">
        Don't have an account?{" "}
        <Link to="/signup" className="text-white underline font-medium hover:text-[#a5e656]">
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}
