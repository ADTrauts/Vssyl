import { Role } from "@prisma/client"
import 'next-auth';

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    serverToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: Role;
    isAdmin: boolean;
    serverToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: Role;
    isAdmin: boolean;
    serverToken?: string;
  }
} 