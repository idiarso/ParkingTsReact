import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * A route component that handles authentication and role-based access control
 * Can be used either with children or as a wrapper for routes with an Outlet
 * @param children Optional children to render if authenticated and authorized
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Check if user exists and has required role
  if (!user || !user.role) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}; 