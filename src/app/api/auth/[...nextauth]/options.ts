import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@prisma/index";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
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
    async signIn({ user, account, profile }) {
      try {
        if (!user.name || user.name === "") {
          user.name = user.email?.split("@")[0] || "User";
        }

        // Save or update user in database
        if (user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (!existingUser) {
            // Create new user
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image || null,
              }
            });
            user.id = newUser.id;
          } else {
            // Update existing user
            await prisma.user.update({
              where: { email: user.email },
              data: {
                name: user.name,
                image: user.image || null,
              }
            });
            user.id = existingUser.id;
          }
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
  // Remove adapter for now to use JWT strategy only
  // adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
});
