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
    const loggedInUser = await prisma.user.findUnique({
      where: {
          id: session.user.id,
      },
    });
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
