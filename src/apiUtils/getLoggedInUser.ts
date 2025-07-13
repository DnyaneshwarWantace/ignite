import prisma from "@prisma/index";
import { auth } from "../app/api/auth/[...nextauth]/options";
import axios from "axios";

const getLoggedInUser = async (baseURL?: string, cookie?: any) => {
  let session = null;
  try {
  if (baseURL) {
      console.log("getLoggedInUser - Fetching session from:", `${baseURL}/api/auth/session`);
      console.log("getLoggedInUser - Cookie:", cookie);
      
      const response = await axios.get(`${baseURL}/api/auth/session`, {
        headers: { cookie: cookie },
      });
      session = response.data;
      console.log("getLoggedInUser - Session response:", session);
  } else {
    session = await auth();
      console.log("getLoggedInUser - Direct auth session:", session);
  }

    if (session && session.user && session.user.id) {
      console.log("getLoggedInUser - Looking for user with ID:", session.user.id);
      let loggedInUser = await prisma.user.findUnique({
      where: {
          id: session.user.id,
      },
    });
      
      // If user doesn't exist in database but exists in session, create them
      if (!loggedInUser && session.user.email) {
        console.log("getLoggedInUser - User not found in database, creating from session");
        try {
          loggedInUser = await prisma.user.create({
            data: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name || session.user.email.split('@')[0],
              image: session.user.image || null,
            },
          });
          console.log("getLoggedInUser - Created user in database:", loggedInUser.id);
        } catch (error) {
          console.error("getLoggedInUser - Error creating user:", error);
          // If creation fails (e.g., ID already exists), try to find by email
          loggedInUser = await prisma.user.findUnique({
            where: {
              email: session.user.email,
            },
          });
        }
      }
      
      console.log("getLoggedInUser - Found user:", loggedInUser ? "Yes" : "No");
    return loggedInUser;
  } else {
      console.log("getLoggedInUser - No valid session or user ID");
      return null;
    }
  } catch (error) {
    console.error("getLoggedInUser - Error:", error);
    return null;
  }
};

export default getLoggedInUser;
