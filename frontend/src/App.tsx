import { useState } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Room } from "./Room";
import Editor from "./Editor";
import Presence from "./Presence";
import { useAuth } from "./auth/context";
import { LoginPage, OAuthCallbackPage, SignupPage } from "./auth/AuthPages";

function randomColor() {
  return "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
}

function ProtectedRoute() {
  const { user, status, error, retrySession, logout } = useAuth();
  const navigate = useNavigate();
  const [myColor] = useState(randomColor);

  if (status === "loading") return <main className="auth-page"><p role="status">Restoring your session…</p></main>;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (status === "error") {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-labelledby="restore-title">
          <h1 id="restore-title">Unable to restore your session</h1>
          <p className="auth-subtitle">{error}</p>
          <button className="button button-primary" onClick={() => void retrySession()}>Try again</button>
          <button className="text-button" onClick={() => { logout(); navigate("/login", { replace: true }); }}>Sign out</button>
        </section>
      </main>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const myName = user.name;

  return (
    <>
      <header className="workspace-header">
        <Link className="brand" to="/">confluo</Link>
        <span className="workspace-user">{user.name}</span>
        <button className="text-button" onClick={() => { logout(); navigate("/login", { replace: true }); }}>Sign out</button>
      </header>
      <Room name={myName}>
        <Presence />
        <Editor name={myName} color={myColor} />
      </Room>
    </>
  );
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") return <main className="auth-page"><p role="status">Restoring your session…</p></main>;
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/" element={<ProtectedRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
