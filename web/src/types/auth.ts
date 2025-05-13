import { Role } from "@prisma/client"

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  isAdmin: boolean;
}

export interface AuthSession {
  user: AuthUser;
} 