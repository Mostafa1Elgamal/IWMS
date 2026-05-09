import type { ReactElement } from "react";
import { Navigate } from "react-router";
import { useAuth } from "./authContext";
import { getRoleDashboardPath, type UserRole } from "./authService";

interface ProtectedRouteProps {
  children: ReactElement;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getRoleDashboardPath(role)} replace />;
  }

  return children;
}
