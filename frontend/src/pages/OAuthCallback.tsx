import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/context";
import { Terminal } from "lucide-react";

export default function OAuthCallback() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in dev; the ref keeps this one-shot
    if (handled.current) return;
    handled.current = true;

    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    // Remove the token from the address bar and history right away
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      navigate("/login?error=missing_token", { replace: true });
      return;
    }
    void signIn(token).then(() => navigate("/", { replace: true }));
  }, [signIn, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] p-4 font-mono text-xs text-[#a1a1aa]">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-[#27272a] bg-[#121214] p-8 shadow-2xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#27272a] bg-[#09090b] text-white">
          <Terminal size={18} />
        </div>
        <div className="flex items-center gap-2 text-[#f4f4f5]">
          <span className="h-2 w-2 rounded-full bg-white animate-ping" />
          <span className="font-semibold">AUTHENTICATING OAUTH2 SESSION…</span>
        </div>
        <p className="text-[11px] text-[#71717a]">Verifying authorization grant and establishing secure JWT session.</p>
      </div>
    </div>
  );
}
