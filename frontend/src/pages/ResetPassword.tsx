import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [completed, setCompleted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    setTimeout(() => {
      setPending(false);
      setCompleted(true);
    }, 400);
  };

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Enter and confirm your new account security credentials."
    >
      {error && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-md border border-[#FF6B6B]/40 bg-[#2A1515] p-3 font-mono text-xs text-[#FF6B6B]">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {completed ? (
        <div className="space-y-4">
          <div className="rounded-md border border-white/40 bg-[#1c1c20] p-4 text-xs font-mono text-[#f4f4f5]">
            <div className="flex items-center gap-2 text-white font-semibold mb-1">
              <CheckCircle2 size={15} />
              <span>Password Updated Successfully</span>
            </div>
            <p className="text-[#a1a1aa] leading-relaxed mt-1">
              Your security credentials have been updated. You can now authenticate into your Confluo workspace.
            </p>
          </div>

          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-white bg-white text-black py-2.5 font-mono text-xs font-semibold text-[#09090b] hover:bg-zinc-200 transition-all"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div onChange={(e: any) => setPassword(e.target.value)}>
            <TextField
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              maxLength={72}
            />
          </div>

          <div onChange={(e: any) => setConfirmPassword(e.target.value)}>
            <TextField
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              maxLength={72}
            />
          </div>

          <p className="font-mono text-[11px] text-[#71717a]">
            {token ? `Reset token verified: ${token.slice(0, 8)}…` : "Recovery session active"}
          </p>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-white bg-white text-black py-2.5 font-mono text-xs font-semibold text-[#09090b] transition-all hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(255, 255, 255, )] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{pending ? "Updating credentials…" : "Confirm new password"}</span>
            <ArrowRight size={13} />
          </button>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-mono text-xs text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors"
            >
              <ArrowLeft size={12} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

