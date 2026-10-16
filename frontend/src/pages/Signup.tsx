import { Link, Navigate } from "react-router";
import { signup } from "../api/auth";
import { useAuth } from "../auth/context";
import { formValue, useAuthSubmit } from "../auth/useAuthSubmit";
import AuthLayout from "../components/AuthLayout";
import OAuthButtons from "../components/OAuthButtons";
import TextField from "../components/TextField";

export default function Signup() {
  const { status } = useAuth();
  const { submit, pending, formError, fieldErrors } = useAuthSubmit((data) =>
    signup(formValue(data, "name").trim(), formValue(data, "email").trim(), formValue(data, "password")),
  );

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout title="Create your account">
      {formError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <TextField label="Name" name="name" autoComplete="name" maxLength={100} error={fieldErrors.name} />
        <TextField label="Email" name="email" type="email" autoComplete="email" maxLength={254} error={fieldErrors.email} />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          error={fieldErrors.password}
        />
        <p className="text-xs text-gray-500">At least 8 characters.</p>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <OAuthButtons />

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
