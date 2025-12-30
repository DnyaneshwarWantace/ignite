import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@middleware";
// Type definition for User (matching Supabase schema)
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}
import { createResponse, createError } from "@apiUtils/responseutils";
import messages from "@apiUtils/messages";
import { DiscoverCache, isRedisAvailable } from "@/lib/redis-cache";

export const dynamic = "force-dynamic";

// GET - Get cache statistics
export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const redisAvailable = await isRedisAvailable();
      
      if (!redisAvailable) {
        return createResponse({
          message: "Redis not available",
          payload: {
            redisAvailable: false,
            stats: null
          }
        });
      }

      const stats = await DiscoverCache.getCacheStats();
      
      return createResponse({
        message: messages.SUCCESS,
        payload: {
          redisAvailable: true,
          stats
        }
      });

    } catch (error) {
      console.error('Error getting cache stats:', error);
      return createError({
        message: "Failed to get cache statistics",
        payload: { error: (error as Error).message }
      });
    }
  }
);

// DELETE - Clear all cache
export const DELETE = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const redisAvailable = await isRedisAvailable();
      
      if (!redisAvailable) {
        return createError({
          message: "Redis not available"
        });
      }

      await DiscoverCache.clearAllCache();
      
      return createResponse({
        message: "Cache cleared successfully"
      });

    } catch (error) {
      console.error('Error clearing cache:', error);
      return createError({
        message: "Failed to clear cache",
        payload: { error: (error as Error).message }
      });
    }
  }
); 