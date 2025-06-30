import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@prisma/index";
import Credentials from "next-auth/providers/credentials";

// Ensure we're using the correct URL in production
const productionUrl = 'https://ignite-zvt9.onrender.com';
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || productionUrl;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
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

    async redirect({ url, baseUrl }) {
      // Always use NEXTAUTH_URL in production
      const effectiveBaseUrl = process.env.NODE_ENV === 'production' ? NEXTAUTH_URL : baseUrl;
      
      // Handle relative URLs
      if (url.startsWith("/")) {
        return `${effectiveBaseUrl}${url}`;
      }
      
      // Handle absolute URLs
      try {
        const urlObject = new URL(url);
        // If the URL is for our site, allow it
        if (urlObject.origin === effectiveBaseUrl) {
          return url;
        }
      } catch (e) {
        console.error('Invalid URL:', url);
      }
      
      // Default to the base URL
      return effectiveBaseUrl;
    }
  },
  debug: process.env.NODE_ENV === "development",
  adapter: PrismaAdapter(prisma),
});
