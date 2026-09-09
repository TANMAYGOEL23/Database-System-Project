import { apiClient, simulateLatency } from './api';
import { User, LoginRequest, LoginResponse } from '../types/auth';
import { mockDb } from './mockStorage';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // If Spring Boot backend is active, try calling it
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    } catch {
      // Fallback to local mock authentication
      await simulateLatency(400);
      const users = mockDb.getUsers();
      const user = users.find(
        (u) => u.username.toLowerCase() === credentials.username.toLowerCase()
      );

      if (!user) {
        throw new Error('Invalid username or password.');
      }

      if (user.status !== 'ACTIVE') {
        throw new Error('Account is suspended or inactive. Please contact administrator.');
      }

      // Generate a mock JWT token
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
        JSON.stringify({ sub: user.userId, role: user.role, name: user.fullName })
      )}.mock_signature_${Date.now()}`;

      return {
        token: mockToken,
        user,
        expiresIn: 86400,
      };
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch {
      await simulateLatency(200);
      const stored = localStorage.getItem('smart_erp_user');
      if (stored) {
        return JSON.parse(stored);
      }
      throw new Error('Not authenticated');
    }
  },

  logout(): void {
    localStorage.removeItem('smart_erp_jwt_token');
    localStorage.removeItem('smart_erp_user');
  },
};
