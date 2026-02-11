import { NextRequest } from "next/server";
import { createResponse, createError } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import {
  listUserApiKeys,
  upsertUserApiKey,
  deleteUserApiKey,
} from "@/lib/user-api-keys";

export const dynamic = "force-dynamic";

interface User {
  id: string;
  email: string;
  name?: string;
}

// GET - list all keys for the logged-in user (masked)
export const GET = authMiddleware(
  async (_request: NextRequest, _context: any, user: User) => {
    try {
      const keys = await listUserApiKeys(user.id);
      return createResponse({ payload: keys, message: "Keys fetched" });
    } catch (error: any) {
      return createError({ message: error.message || "Failed to fetch keys" });
    }
  }
);

// POST - save/update a key { provider, key }
export const POST = authMiddleware(
  async (request: NextRequest, _context: any, user: User) => {
    try {
      const body = await request.json();
      const { provider, key, metadata } = body;

      if (!provider || !key) {
        return createError({ message: "provider and key are required", status: 400 });
      }

      if (typeof key !== "string" || key.trim().length === 0) {
        return createError({ message: "key must be a non-empty string", status: 400 });
      }

      await upsertUserApiKey(user.id, provider, key.trim(), metadata);
      return createResponse({ payload: { provider }, message: "Key saved" });
    } catch (error: any) {
      return createError({ message: error.message || "Failed to save key" });
    }
  }
);

// DELETE - remove a key { provider }
export const DELETE = authMiddleware(
  async (request: NextRequest, _context: any, user: User) => {
    try {
      const body = await request.json();
      const { provider } = body;

      if (!provider) {
        return createError({ message: "provider is required", status: 400 });
      }

      await deleteUserApiKey(user.id, provider);
      return createResponse({ payload: { provider }, message: "Key deleted" });
    } catch (error: any) {
      return createError({ message: error.message || "Failed to delete key" });
    }
  }
);
