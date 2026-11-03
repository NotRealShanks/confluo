import { Route, Routes } from "react-router";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EmailVerificationNotice from "./pages/EmailVerificationNotice";
import OAuthCallback from "./pages/OAuthCallback";
import ProjectPage from "./pages/ProjectPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import GuestProjectPage from "./pages/GuestProjectPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import LandingPage from "./pages/LandingPage";
import { useAuth } from "./auth/context";

import NotFoundPage from "./pages/NotFoundPage";

function RootEntry() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-mono text-xs text-[#a1a1aa]">
        <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping mr-2.5" />
        INITIALIZING CONFLUO…
      </div>
    );
  }

  if (status === "authenticated") {
    return <Home />;
  }

  return <LandingPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootEntry />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<EmailVerificationNotice />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/share/:token" element={<GuestProjectPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Home />} />
        <Route path="projects/new" element={<CreateProjectPage />} />
        <Route path="projects/:id" element={<ProjectPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings/profile" element={<ProfileSettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
