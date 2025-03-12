import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Permission, UserRole } from '../../types/auth';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions,
  requiredRoles
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirement
  if (requiredRoles) {
    const roleHierarchy: Record<UserRole, number> = {
      superadmin: 4,
      admin: 3,
      manager: 2,
      operator: 1,
      viewer: 0
    };

    const userRoleHierarchy = roleHierarchy[user.role];
    const hasRequiredRoles = requiredRoles.every(required => {
      return roleHierarchy[required] <= userRoleHierarchy;
    });

    if (!hasRequiredRoles) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permissions requirement
  if (requiredPermissions) {
    const hasRequiredPermissions = requiredPermissions.every(required => {
      return user.permissions.some(permission => {
        // Superadmin has all permissions
        if (user.role === 'superadmin') return true;

        // Check if user has the required resource and actions
        if (permission.resource === '*') return true;
        if (permission.resource !== required.resource) return false;

        return required.actions.every(action =>
          permission.actions.includes(action)
        );
      });
    });

    if (!hasRequiredPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 