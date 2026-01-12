import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase";

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
        // Allow sign in even if database operations fail (to prevent redirect loops)
        if (!user.email) {
          console.warn("SignIn: No email provided");
          return true; // Allow sign in to proceed
        }

        if (!user.name || user.name === "") {
          user.name = user.email?.split("@")[0] || "User";
        }

        // Save or update user in database (non-blocking)
        try {
          const { data: existingUser, error: queryError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

          if (queryError && queryError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error("Error querying user:", queryError);
            // Don't block sign in on query errors
          }

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
              // Still allow sign in even if user creation fails
              // User can be created later
            } else if (newUser) {
              user.id = newUser.id;
            }
          } else {
            // Update existing user (non-blocking)
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
              // Don't block sign in on update errors
            }

            user.id = existingUser.id;
          }
        } catch (dbError) {
          console.error("Database error in signIn callback:", dbError);
          // Allow sign in to proceed even if database operations fail
        }

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        // Return true to prevent redirect loops
        // Better to allow sign in with potential data sync issues than block entirely
        return true;
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
      // Handle redirects properly
      // If url is relative, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If url is on the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to home page
      return baseUrl;
    },
  },
  debug: process.env.NODE_ENV === "development",
  // Remove adapter for now to use JWT strategy only
  // adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
});
