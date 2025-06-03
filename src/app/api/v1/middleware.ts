import getLoggedInUser from "@apiUtils/getLoggedInUser";
import messages from "@apiUtils/messages";
import { createError } from "@apiUtils/responseutils";
import statuscodes from "@apiUtils/statuscodes";
import { NextRequest, NextResponse } from "next/server";

export const authMiddleware =
  (handler: any) => async (request: NextRequest, context: any) => {
    let loggedInUser = null;

    // Check user is logged in
    if (request.url.includes("/api/v1/")) {
      try {
        // In development mode, create a mock user if no session exists
        if (process.env.NODE_ENV === "development") {
          // Try to get real user first
          const protocol = request.headers.get("x-forwarded-proto") || "http";
          const host = request.headers.get("x-forwarded-host") || 
                      request.headers.get("host") || 
                      "localhost:3000";
          const baseUrl = `${protocol}://${host}`;
          
          console.log("Auth middleware - Base URL:", baseUrl);
          console.log("Auth middleware - Cookie:", request.headers.get("cookie"));
          
          loggedInUser = await getLoggedInUser(baseUrl, request.headers.get("cookie"));

          // If no real user in development, create a mock user
          if (!loggedInUser) {
            console.log("Auth middleware - No session found, creating mock user for development");
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
        } else {
          // Production mode - require real authentication
          const protocol = request.headers.get("x-forwarded-proto") || "https";
          const host = request.headers.get("x-forwarded-host") || 
                      request.headers.get("host");
          const baseUrl = `${protocol}://${host}`;
          
          loggedInUser = await getLoggedInUser(baseUrl, request.headers.get("cookie"));

        if (!loggedInUser) {
          return createError({
            message: messages.UNAUTHORIZED,
            status: statuscodes.UNAUTHORIZED,
          });
          }
        }
      } catch (err) {
        console.error("Auth middleware error:", err);
        if (process.env.NODE_ENV === "development") {
          // In development, fall back to mock user on error
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
