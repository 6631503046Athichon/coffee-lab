import { UserRole } from './types';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'user-farmer1',
    name: 'Maria Rodriguez',
    email: 'farmer@coffee.com',
    password: 'farmer123',
    role: UserRole.Farmer,
  },
  {
    id: 'user-processor1',
    name: 'Alarak',
    email: 'processor@coffee.com',
    password: 'processor123',
    role: UserRole.Processor,
  },
  {
    id: 'user-roaster1',
    name: 'Jim Raynor',
    email: 'roaster@coffee.com',
    password: 'roaster123',
    role: UserRole.Roaster,
  },
  {
    id: 'user-headjudge',
    name: 'Artanis',
    email: 'headjudge@coffee.com',
    password: 'headjudge123',
    role: UserRole.HeadJudge,
  },
  {
    id: 'user-cupper1',
    name: 'Tassadar',
    email: 'cupper@coffee.com',
    password: 'cupper123',
    role: UserRole.Cupper,
  },
  {
    id: 'user-admin',
    name: 'Admin User',
    email: 'admin@coffee.com',
    password: 'admin123',
    role: UserRole.Admin,
  },
];
