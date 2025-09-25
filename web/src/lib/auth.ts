import { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { jwtDecode } from 'jwt-decode';

// User type is now defined in types/next-auth.d.ts

interface DecodedToken {
  sub: string;
  email: string;
  role: string;
  userNumber: string;
  exp: number;
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vssyl-server-235369681725.us-central1.run.app';
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const decoded = jwtDecode<DecodedToken>(data.token);

    return {
      ...token,
      accessToken: data.token,
      refreshToken: data.refreshToken,
      exp: decoded.exp,
      error: undefined,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vssyl-server-235369681725.us-central1.run.app';
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Invalid credentials');
          }

          const data = await response.json();
          console.log('NextAuth Authorize - Backend response:', { 
            hasData: !!data, 
            hasToken: !!data?.token, 
            userId: data?.user?.id,
            userEmail: data?.user?.email 
          });
          
          if (data && data.token) {
            const user = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              userNumber: data.user.userNumber,
              accessToken: data.token,
              refreshToken: data.refreshToken,
              emailVerified: !!data.user.emailVerified,
            } as any;
            
            console.log('NextAuth Authorize - Returning user:', { 
              id: user.id, 
              email: user.email, 
              hasAccessToken: !!user.accessToken 
            });
            
            return user;
          }
          
          console.log('NextAuth Authorize - No token in response, returning null');
          return null;
        } catch (error: unknown) {
          console.error('Auth error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
          throw new Error(errorMessage);
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('NextAuth JWT callback:', { hasUser: !!user, hasToken: !!token, tokenExp: token.exp });
      
      if (user) {
        const u = user as any;
        // Use the backend's JWT token directly without decoding
        console.log('NextAuth JWT - User login:', { userId: u.id, email: u.email, hasAccessToken: !!u.accessToken });
        return {
          ...token,
          id: u.id,
          role: u.role,
          userNumber: u.userNumber,
          accessToken: u.accessToken,
          refreshToken: u.refreshToken,
          exp: token.exp,
        };
      }

      // If the token expiration is unknown or it has expired, refresh it.
      if (typeof token.exp !== 'number' || Date.now() >= token.exp * 1000) {
        console.log('NextAuth JWT - Token expired, refreshing...');
        return refreshAccessToken(token);
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log('NextAuth Session callback:', { hasSession: !!session, hasToken: !!token, tokenId: token.id });
      
      session.user.id = token.id as string;
      session.user.role = token.role as any;
      session.user.userNumber = token.userNumber as string;
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      
      console.log('NextAuth Session - Final session:', { 
        userId: session.user.id, 
        hasToken: !!session.accessToken,
        tokenLength: session.accessToken?.length,
        userRole: session.user.role
      });
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the user is coming from a protected route, redirect them back
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // If they're coming from the root, let the home page handle the redirect
      if (url === baseUrl || url === baseUrl + '/') {
        return baseUrl;
      }
      // Default to dashboard for authenticated users
      return '/dashboard';
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}; 