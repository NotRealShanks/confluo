import { Link, Navigate, useSearchParams } from "react-router";
import { login } from "../api/auth";
import { useAuth } from "../auth/context";
import { formValue, useAuthSubmit } from "../auth/useAuthSubmit";
import AuthLayout from "../components/AuthLayout";
import OAuthButtons from "../components/OAuthButtons";
import TextField from "../components/TextField";

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
    <AuthLayout title="Sign in to Confluo">
      {alertMessage && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {alertMessage}
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <TextField label="Email" name="email" type="email" autoComplete="email" maxLength={254} error={fieldErrors.email} />
        <TextField label="Password" name="password" type="password" autoComplete="current-password" maxLength={72} error={fieldErrors.password} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <OAuthButtons />

      <p className="mt-6 text-center text-sm text-gray-600">
        No account?{" "}
        <Link to="/signup" className="text-blue-600 underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
