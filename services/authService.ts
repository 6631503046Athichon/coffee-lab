// Authentication service functions
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../mockUsers';

interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

const STORAGE_KEY = 'coffee_lab_user';

export const authService = {
  // Mock login function
  login: async (credentials: LoginCredentials): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find user by email and password
    const mockUser = MOCK_USERS.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (!mockUser) {
      throw new Error('Invalid email or password');
    }

    // Convert MockUser to User (remove password)
    const user: User = {
      id: mockUser.id,
      name: mockUser.name,
      role: mockUser.role,
    };

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

    return user;
  },

  // Register function (not implemented as per user request)
  register: async (data: RegisterData): Promise<User> => {
    throw new Error('Registration not implemented yet');
  },

  // Logout function
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const user = localStorage.getItem(STORAGE_KEY);
    return !!user;
  },

  // Get current user
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(STORAGE_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  }
};