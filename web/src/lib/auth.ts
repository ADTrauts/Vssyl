import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        try {
          // Call server login endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Authentication failed');
          }

          const data = await response.json();
          
          // Return user data with server token
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            avatarUrl: data.user.avatarUrl,
            role: data.user.role,
            isAdmin: data.user.isAdmin,
            serverToken: data.token, // Store server token
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
    signOut: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign in
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatarUrl = user.avatarUrl;
        token.role = user.role;
        token.isAdmin = user.isAdmin;
        token.serverToken = user.serverToken; // Store server token in JWT
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          avatarUrl: token.avatarUrl,
          role: token.role as Role,
          isAdmin: token.isAdmin,
        };
        // Add server token to session
        session.serverToken = token.serverToken;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      avatarUrl: string | null;
      isAdmin: boolean;
    };
    serverToken?: string; // Add server token to session type
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatarUrl: string | null;
    isAdmin: boolean;
    serverToken?: string; // Add server token to user type
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: Role;
    isAdmin: boolean;
    serverToken?: string; // Add server token to JWT type
  }
} 