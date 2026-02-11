import prisma from "@prisma/index";
import { auth } from "../app/api/auth/[...nextauth]/options";

/**
 * Get the logged-in user from the current request (session) and ensure they exist in DB.
 * Call with no args from API route handlers so auth() uses the current request (fast).
 * Avoid passing baseURL/cookie — that triggers a slow internal HTTP fetch to /api/auth/session.
 */
const getLoggedInUser = async (_baseURL?: string, _cookie?: string) => {
  let session = null;
  try {
    // Always use auth() — it uses the current request context in API routes (no HTTP round-trip).
    session = await auth();

    if (session?.user?.id) {
      let loggedInUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!loggedInUser && session.user.email) {
        try {
          loggedInUser = await prisma.user.create({
            data: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name || session.user.email.split("@")[0],
              image: session.user.image || null,
            },
          });
        } catch (error) {
          loggedInUser = await prisma.user.findUnique({
            where: { email: session.user.email },
          });
        }
      }

      return loggedInUser;
    }
    return null;
  } catch (error) {
    console.error("getLoggedInUser error:", error);
    return null;
  }
};

export default getLoggedInUser;
