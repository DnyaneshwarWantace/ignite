import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase-storage";

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
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

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
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (!existingUser) {
            // Create new user
            const { data: newUser, error: createError } = await supabaseAdmin
              .from('users')
              .insert({
                email: user.email,
                name: user.name,
                image: user.image || null,
              })
              .select()
              .single();

            if (createError) {
              console.error("Error creating user:", createError);
              return false;
            }

            user.id = newUser.id;
          } else {
            // Update existing user
            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({
                name: user.name,
                image: user.image || null,
                updated_at: new Date().toISOString(),
              })
              .eq('email', user.email);

            if (updateError) {
              console.error("Error updating user:", updateError);
              return false;
            }

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
