export type UserRole = 'superadmin' | 'admin' | 'manager' | 'operator' | 'viewer';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface UserPermissions {
  [resource: string]: {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  superadmin: [
    {
      resource: '*',
      actions: ['create', 'read', 'update', 'delete']
    }
  ],
  admin: [
    {
      resource: 'users',
      actions: ['create', 'read', 'update', 'delete']
    },
    {
      resource: 'settings',
      actions: ['read', 'update']
    },
    {
      resource: 'reports',
      actions: ['create', 'read']
    },
    {
      resource: 'vehicles',
      actions: ['create', 'read', 'update', 'delete']
    },
    {
      resource: 'parking-sessions',
      actions: ['create', 'read', 'update', 'delete']
    }
  ],
  manager: [
    {
      resource: 'reports',
      actions: ['read']
    },
    {
      resource: 'vehicles',
      actions: ['read', 'update']
    },
    {
      resource: 'parking-sessions',
      actions: ['read', 'update']
    },
    {
      resource: 'settings',
      actions: ['read']
    }
  ],
  operator: [
    {
      resource: 'vehicles',
      actions: ['read']
    },
    {
      resource: 'parking-sessions',
      actions: ['create', 'read', 'update']
    }
  ],
  viewer: [
    {
      resource: 'vehicles',
      actions: ['read']
    },
    {
      resource: 'parking-sessions',
      actions: ['read']
    }
  ]
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface PasswordReset {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorAuth {
  email: string;
  code: string;
} 