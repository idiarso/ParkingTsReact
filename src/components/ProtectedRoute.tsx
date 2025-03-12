import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

/**
 * A route component that handles authentication and role-based access control
 * Can be used either with children or as a wrapper for routes with an Outlet
 * @param allowedRoles Optional array of allowed roles for this route
 * @param children Optional children to render if authenticated and authorized
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  
  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    // Save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If roles are specified and user doesn't have required role, redirect to forbidden
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasRequiredRole = allowedRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return <Navigate to="/forbidden" replace />;
    }
  }
  
  // User is authenticated and has required role (if specified)
  // Return children if provided, otherwise return the Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
}; 