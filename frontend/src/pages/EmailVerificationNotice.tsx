import { Link, useSearchParams } from "react-router";
import AuthLayout from "../components/AuthLayout";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";

export default function EmailVerificationNotice() {
  const [params] = useSearchParams();
  const email = params.get("email") || "your registered email";

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Complete your developer profile setup to ensure secure project access."
    >
      <div className="space-y-5">
        <div className="flex items-center justify-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-[#1c1c20] text-white shadow-[0_0_20px_rgba(255, 255, 255, )]">
            <Mail size={32} />
          </div>
        </div>

        <div className="rounded-md border border-[#27272a] bg-[#09090b] p-4 font-mono text-xs text-[#f4f4f5] space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold">
            <CheckCircle2 size={14} />
            <span>Verification Link Dispatched</span>
          </div>
          <p className="text-[#a1a1aa] leading-relaxed">
            We have sent an authentication verification message to <span className="text-[#f4f4f5]">{email}</span>. Click the link in the message to activate your workspace credentials.
          </p>
        </div>

        <div className="rounded-md border border-[#27272a] bg-[#09090b] p-3 text-[11px] font-mono text-[#71717a]">
          💡 <span className="text-[#a1a1aa]">Using Google or GitHub?</span> Third-party OAuth logins are pre-verified automatically by their respective providers.
        </div>

        <Link
          to="/login"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-white bg-white text-black py-2.5 font-mono text-xs font-semibold text-[#09090b] hover:bg-zinc-200 transition-all"
        >
          <span>Return to Sign In</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </AuthLayout>
  );
}

