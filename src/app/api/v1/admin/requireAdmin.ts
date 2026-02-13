import { auth } from "@/app/api/auth/[...nextauth]/options";
import type { Session } from "next-auth";
import { createError } from "@apiUtils/responseutils";
import statuscodes from "@apiUtils/statuscodes";

export async function requireAdmin(): Promise<
  { session: Session; ok: true } | { ok: false; response: Response }
> {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return { ok: false, response: createError({ message: "Unauthorized", status: statuscodes.UNAUTHORIZED }) };
  }
  if (!(authSession.user as { isAdmin?: boolean }).isAdmin) {
    return { ok: false, response: createError({ message: "Forbidden: admin only", status: 403 }) };
  }
  return { session: authSession as Session, ok: true as const };
}
