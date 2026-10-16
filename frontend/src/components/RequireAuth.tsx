import { Navigate, Outlet } from "react-router";
import { useAuth } from "../auth/context";

export default function RequireAuth() {
  const { status } = useAuth();

  if (status === "loading") {
    return <p className="p-8 text-gray-600">Loading…</p>;
  }
  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
