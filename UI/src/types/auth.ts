export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  userId: string;
  employeeId: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  fullName: string;
  email: string;
  departmentName?: string;
  position?: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  username: string;
  passwordHash?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isEmployee: boolean;
}
