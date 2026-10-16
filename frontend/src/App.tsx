import { Navigate, Route, Routes } from "react-router";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OAuthCallback from "./pages/OAuthCallback";
import Sandbox from "./pages/Sandbox";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      {/* Temporary: public-key room, remove once the authorized editor exists */}
      <Route path="/sandbox" element={<Sandbox />} />
      <Route element={<RequireAuth />}>
        <Route index element={<Home />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
