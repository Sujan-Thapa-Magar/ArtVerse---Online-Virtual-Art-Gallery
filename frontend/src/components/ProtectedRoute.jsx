import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function getCurrentUserRole() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])).role || null;
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const role = getCurrentUserRole();
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/home" replace />;
    }
  }

  return children;
}