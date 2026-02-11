import getLoggedInUser from "@apiUtils/getLoggedInUser";
import messages from "@apiUtils/messages";
import { createError } from "@apiUtils/responseutils";
import statuscodes from "@apiUtils/statuscodes";
import { NextRequest, NextResponse } from "next/server";

export const authMiddleware =
  (handler: any) => async (request: NextRequest, context: any) => {
    let loggedInUser = null;

    // Check user is logged in (call with no args so getLoggedInUser uses auth() — no slow HTTP fetch)
    if (request.url.includes("/api/v1/")) {
      try {
        loggedInUser = await getLoggedInUser();

        if (!loggedInUser && process.env.NODE_ENV === "development") {
          loggedInUser = {
            id: "dev-user-id",
            email: "dev@example.com",
            name: "Development User",
            createdAt: new Date(),
            updatedAt: new Date(),
            emailVerified: null,
            image: null,
          };
        }
        
        // In production, require real authentication
        if (!loggedInUser && process.env.NODE_ENV !== "development") {
          return createError({
            message: messages.UNAUTHORIZED,
            status: statuscodes.UNAUTHORIZED,
          });
        }
      } catch (err) {
        console.error("Auth middleware error:", err);
        // In development, fall back to mock user on error
        if (process.env.NODE_ENV === "development") {
          loggedInUser = {
            id: "dev-user-id",
            email: "dev@example.com",
            name: "Development User",
            createdAt: new Date(),
            updatedAt: new Date(),
            emailVerified: null,
            image: null,
          };
        } else {
          return createError({
            message: messages.UNAUTHORIZED,
            status: statuscodes.UNAUTHORIZED,
          });
        }
      }
    }

    // Call the original API route handler
    return handler(request, context, loggedInUser);
  };
