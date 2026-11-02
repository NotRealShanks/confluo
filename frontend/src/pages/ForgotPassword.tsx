import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || pending) return;
    setPending(true);

    // Operational recovery handler
    setTimeout(() => {
      setPending(false);
      setSubmitted(true);
    }, 400);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email associated with your account to receive recovery instructions."
    >
      {submitted ? (
        <div className="space-y-4">
          <div className="rounded-md border border-white/40 bg-[#1c1c20] p-4 text-xs font-mono text-[#f4f4f5]">
            <div className="flex items-center gap-2 text-white font-semibold mb-1">
              <CheckCircle2 size={15} />
              <span>Recovery Request Received</span>
            </div>
            <p className="text-[#a1a1aa] leading-relaxed mt-1">
              If an email-authenticated account exists for <span className="text-[#f4f4f5]">{email}</span>, recovery instructions will be processed.
            </p>
            <p className="text-[#71717a] text-[11px] mt-2">
              Note: Accounts created via Google or GitHub OAuth authenticate directly through their identity provider and do not require a separate password.
            </p>
          </div>

          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-[#27272a] bg-[#09090b] py-2.5 font-mono text-xs font-medium text-[#f4f4f5] hover:bg-[#18181b] transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Return to Sign In</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div onChange={(e: any) => setEmail(e.target.value)}>
            <TextField
              label="Account email address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="engineer@team.dev"
              maxLength={254}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-white bg-white text-black py-2.5 font-mono text-xs font-semibold text-[#09090b] transition-all hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(255, 255, 255, )] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{pending ? "Dispatching…" : "Send recovery link"}</span>
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

