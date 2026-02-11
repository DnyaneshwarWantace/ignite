import { auth } from "@/app/api/auth/[...nextauth]/options";
import { createError } from "@apiUtils/responseutils";
import statuscodes from "@apiUtils/statuscodes";
import { Response } from "next/server";

/**
 * Use in admin API routes. Returns session if user is admin; otherwise returns 403 response.
 */
export async function requireAdmin(): Promise<
  { session: Awaited<ReturnType<typeof auth>>; ok: true } | { ok: false; response: Response }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, response: createError({ message: "Unauthorized", status: statuscodes.UNAUTHORIZED }) };
  }
  if (!(session.user as { isAdmin?: boolean }).isAdmin) {
    return { ok: false, response: createError({ message: "Forbidden: admin only", status: 403 }) };
  }
  return { session, ok: true };
}
