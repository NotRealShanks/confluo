import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError, oauthStartUrl, tokenFromOAuthFragment } from "./api";
import { useAuth } from "./context";

function AuthFrame({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="brand" to="/">confluo</Link>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}

function OAuthButtons() {
  return (
    <div className="oauth-buttons">
      <a className="button button-secondary" href={oauthStartUrl("google")}>Continue with Google</a>
      <a className="button button-secondary" href={oauthStartUrl("github")}>Continue with GitHub</a>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <p className="form-error" role="alert">{message}</p>;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const oauthError = new URLSearchParams(location.search).get("error");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to continue to your workspace.">
      {oauthError && <ErrorMessage message="Your provider sign-in could not be completed. Please try again." />}
      {error && <ErrorMessage message={error} />}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="login-password">Password</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} />
        <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
      <div className="auth-divider"><span>or</span></div>
      <OAuthButtons />
      <p className="auth-footer">New here? <Link to="/signup">Create an account</Link></p>
    </AuthFrame>
  );
}

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await signup(name.trim(), email.trim(), password);
      navigate("/", { replace: true });
    } catch (cause) {
      const message = cause instanceof ApiError && cause.fieldErrors.password
        ? cause.fieldErrors.password
        : cause instanceof Error ? cause.message : "Unable to create your account.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame title="Create your account" subtitle="Set up an account to start collaborating.">
      {error && <ErrorMessage message={error} />}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="signup-name">Name</label>
        <input id="signup-name" name="name" autoComplete="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
        <label htmlFor="signup-email">Email</label>
        <input id="signup-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="signup-password">Password</label>
        <input id="signup-password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} />
        <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Creating account…" : "Create account"}</button>
      </form>
      <div className="auth-divider"><span>or</span></div>
      <OAuthButtons />
      <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthFrame>
  );
}

export function OAuthCallbackPage() {
  const { acceptOAuthToken } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const token = tokenFromOAuthFragment(window.location.hash);
    // Remove the bearer token from the address bar before making any further requests.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

    if (!token) {
      navigate("/login?error=oauth_failed", { replace: true });
      return;
    }

    void acceptOAuthToken(token)
      .then(() => navigate("/", { replace: true }))
      .catch(() => navigate("/login?error=oauth_failed", { replace: true }));
  }, [acceptOAuthToken, navigate]);

  return <main className="auth-page"><p role="status">Completing sign-in…</p></main>;
}

