import NextAuth from "next-auth"
import { Role } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string | null
      email: string
      role: Role
      userNumber: string | null
      image?: string | null
    }
    accessToken: string
    error?: string
  }

  interface User {
    id: string
    name: string | null
    email: string
    role: Role
    userNumber: string | null
    image?: string | null
    accessToken?: string
  }

  interface JWT {
    id: string
    role: Role
    userNumber: string | null
    accessToken: string
    error?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    userNumber: string | null
    accessToken: string
    error?: string
  }
}
