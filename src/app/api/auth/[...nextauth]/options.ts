import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@prisma/index";
import Credentials from "next-auth/providers/credentials";

// Ensure we're using the correct URL in production
const productionUrl = 'https://ignite-zvt9.onrender.com';

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
      // Force the base URL to be the Render URL in production
      const productionBaseUrl = process.env.NODE_ENV === 'production' ? productionUrl : baseUrl;
      
      // Handle relative URLs
      if (url.startsWith("/")) {
        return `${productionBaseUrl}${url}`;
      }
      
      // Handle absolute URLs on the same origin
      const urlObject = new URL(url);
      if (urlObject.origin === productionBaseUrl) {
        return url;
      }
      
      // Default to the production URL
      return productionBaseUrl;
    }
  },
  debug: process.env.NODE_ENV === "development",
  adapter: PrismaAdapter(prisma),
});
