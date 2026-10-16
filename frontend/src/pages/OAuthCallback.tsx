import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/context";

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

  return <p className="p-8 text-gray-600">Signing you in…</p>;
}
