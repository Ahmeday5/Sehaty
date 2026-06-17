export type UserRole = 'Admin' | 'Editor' | 'Sales' | 'Marketing';

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  picture: string;
  nationalID: string;
  roles: UserRole[];
  token: string;
  rememberMe?: boolean;
  role?: UserRole;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
