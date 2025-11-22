import { Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";

const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  // Chưa đăng nhập → chặn
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Không phải Admin → chặn
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
