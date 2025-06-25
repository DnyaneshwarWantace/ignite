import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@prisma/index";
import Credentials from "next-auth/providers/credentials";
import { NextAuthConfig } from "next-auth";
import { Account, Profile, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import { AdapterUser } from "@auth/core/adapters";

// Skip actual auth during build
const buildTimeConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

// Runtime configuration
const runtimeConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const email = credentials?.email as string;
          
          // For development, allow any user (remove this in production)
          if (process.env.NODE_ENV === "development") {
            return {
              id: "dev-user",
              email: email || "dev@example.com",
              name: "Development User",
            };
          }

          // In production, implement proper user validation
          const user = await prisma.user.findFirst({
            where: {
              email: email,
            },
          });

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }: { 
      user: User | AdapterUser; 
      account: Account | null; 
      profile?: Profile;
    }) {
      try {
        if (!user.name || user.name === "") {
          user.name = user.email?.split("@")[0] || "User";
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },

    async session({ session, token }: { 
      session: Session; 
      token: JWT;
    }) {
      if (token && session.user) {
        session.user.id = token.sub || "";
      }
      return session;
    },

    async jwt({ token, user }: { 
      token: JWT; 
      user?: User | AdapterUser;
    }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
  adapter: PrismaAdapter(prisma),
};

// Use build time config during build, runtime config otherwise
const config = process.env.NEXT_PHASE === 'build' ? buildTimeConfig : runtimeConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(config);
