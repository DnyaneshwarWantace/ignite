import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Next.js strips basePath before the handler, so the request path is /api/auth/* not /ignite/api/auth/*
  basePath: "/api/auth",
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
          const email = (credentials?.email as string)?.trim();
          const password = credentials?.password as string;
          if (!email || !password) return null;

          const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("id, email, name, password_hash, is_admin")
            .eq("email", email)
            .maybeSingle();

          if (error || !user) return null;
          const hash = (user as { password_hash?: string }).password_hash;
          if (!hash) return null;

          const ok = await compare(password, hash);
          if (!ok) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name || email.split("@")[0],
            isAdmin: (user as { is_admin?: boolean }).is_admin === true,
          };
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
    signIn: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/login`,
    error: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/login`,
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
              (user as { isAdmin?: boolean }).isAdmin = (newUser as { is_admin?: boolean }).is_admin === true;
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
            (user as { isAdmin?: boolean }).isAdmin = (existingUser as { is_admin?: boolean }).is_admin === true;
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
        (session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin === true;
      }
      return session;
    },

    async jwt({ token, user }) {
      // Always fetch the correct database user ID based on email
      if (token.email) {
        try {
          let { data: dbUser } = await supabaseAdmin
            .from("users")
            .select("id, is_admin")
            .eq("email", token.email)
            .maybeSingle();

          // If user doesn't exist in DB, create them NOW
          if (!dbUser && token.email) {
            const { data: newUser } = await supabaseAdmin
              .from("users")
              .insert({
                email: token.email,
                name: token.name || token.email.split("@")[0],
                image: token.picture || null,
              })
              .select("id, is_admin")
              .single();

            if (newUser) {
              dbUser = newUser;
            }
          }

          if (dbUser) {
            // Use database ID, not NextAuth auto-generated ID
            token.sub = dbUser.id;
            token.isAdmin = Boolean(dbUser.is_admin);
          } else if (user) {
            // Final fallback
            token.sub = user.id;
            token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
          }
        } catch (error) {
          console.error("JWT callback error:", error);
          if (user) {
            token.sub = user.id;
            token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
          }
        }
      }
      return token;
    },

    async redirect({ url, baseUrl }) {
      // baseUrl may be .../ignite/api/auth; app base for redirects is .../ignite
      const appBase = baseUrl.replace(/\/api\/auth\/?$/, "") || baseUrl;
      const wantAdmin = url.startsWith("/admin") || url.includes("/admin");
      if (wantAdmin) {
        const adminUrl = url.startsWith("/") ? `${appBase}${url}` : url;
        if (adminUrl.startsWith(appBase)) return adminUrl;
      }
      if (url.startsWith("/")) {
        return `${appBase}${url}`;
      }
      try {
        if (new URL(url).origin === new URL(appBase).origin) return url;
      } catch (_) {}
      return appBase;
    },
  },
  debug: process.env.NODE_ENV === "development",
  // Remove adapter for now to use JWT strategy only
  // adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
});
