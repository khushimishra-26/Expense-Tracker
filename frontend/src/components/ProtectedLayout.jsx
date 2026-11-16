import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Sidebar from "./Sidebar";

export default function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}