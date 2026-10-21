import { Navigate, Route, Routes } from "react-router";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OAuthCallback from "./pages/OAuthCallback";
import ProjectPage from "./pages/ProjectPage";
import Signup from "./pages/Signup";
import GuestProjectPage from "./pages/GuestProjectPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/share/:token" element={<GuestProjectPage />} />
      <Route element={<RequireAuth />}>
        <Route index element={<Home />} />
        <Route path="projects/:id" element={<ProjectPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
