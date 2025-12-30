import { auth } from "@/app/api/auth/[...nextauth]/options";

// User session management using main Ignite NextAuth
// This connects to the main app's authentication system

export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

export async function getUserSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}
