import { Link, Navigate } from "react-router";
import { signup } from "../api/auth";
import { useAuth } from "../auth/context";
import { formValue, useAuthSubmit } from "../auth/useAuthSubmit";
import AuthLayout from "../components/AuthLayout";
import OAuthButtons from "../components/OAuthButtons";
import TextField from "../components/TextField";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function Signup() {
  const { status } = useAuth();
  const { submit, pending, formError, fieldErrors } = useAuthSubmit((data) =>
    signup(formValue(data, "name").trim(), formValue(data, "email").trim(), formValue(data, "password")),
  );

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start collaborating on code and running sandboxes instantly."
    >
      {formError && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-md border border-[#FF6B6B]/40 bg-[#2A1515] p-3 font-mono text-xs text-[#FF6B6B]">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <TextField
          label="Display Name"
          name="name"
          autoComplete="name"
          placeholder="Elena Rostova"
          maxLength={100}
          error={fieldErrors.name}
        />
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
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            maxLength={72}
            error={fieldErrors.password}
          />
          <p className="mt-1.5 font-mono text-[11px] text-[#71717a]">
            Must be at least 8 characters.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-white bg-white text-black py-2.5 font-mono text-xs font-semibold text-[#09090b] transition-all hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(255, 255, 255, )] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{pending ? "Creating account…" : "Create Confluo Account"}</span>
          <ArrowRight size={13} />
        </button>
      </form>

      <OAuthButtons />

      <p className="mt-6 text-center font-mono text-xs text-[#a1a1aa]">
        Already have an account?{" "}
        <Link to="/login" className="text-white underline font-medium hover:text-[#a5e656]">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
