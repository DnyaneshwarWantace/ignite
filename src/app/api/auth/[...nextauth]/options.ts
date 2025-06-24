import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";

// Conditionally import Prisma to avoid build issues
let prisma: any = null;
let adapter: any = null;

if (process.env.DATABASE_URL) {
  try {
    prisma = require("@prisma/index").default;
    adapter = PrismaAdapter(prisma);
  } catch (error) {
    console.warn("Failed to initialize Prisma adapter:", error);
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
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

          // Skip database queries during build
          if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
            return null;
          }

          // In production, implement proper user validation
          const user = prisma ? await prisma.user.findFirst({
            where: {
              email: email,
            },
          }) : null;

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
    async signIn({ user, account, profile }) {
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

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || "";
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
  ...(adapter ? { adapter } : {}),
});
