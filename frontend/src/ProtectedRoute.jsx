import { Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();

  // ⭐ Không render gì khi đang load dữ liệu
  if (loading) return null;

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
