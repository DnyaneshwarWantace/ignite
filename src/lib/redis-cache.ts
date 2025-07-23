import { Redis } from 'ioredis';

// Redis client configuration
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Cache configuration
const CACHE_TTL = 300; // 5 minutes
const BATCH_CACHE_PREFIX = 'discover:batch:';
const FILTER_CACHE_PREFIX = 'discover:filter:';

export interface CachedBatch {
  ads: any[];
  nextCursor: any;
  hasMore: boolean;
  batchNumber: number;
  timestamp: number;
}

export interface FilterCache {
  ads: any[];
  totalCount: number;
  hasMore: boolean;
  nextCursor: any;
  timestamp: number;
}

export class DiscoverCache {
  // Generate cache key for a batch
  private static getBatchKey(cursor: any, filters: any): string {
    const filterHash = JSON.stringify(filters);
    const cursorHash = cursor ? `${cursor.createdAt}:${cursor.id}` : 'initial';
    return `${BATCH_CACHE_PREFIX}${btoa(filterHash)}:${cursorHash}`;
  }

  // Generate cache key for filtered results
  private static getFilterKey(filters: any): string {
    const filterHash = JSON.stringify(filters);
    return `${FILTER_CACHE_PREFIX}${btoa(filterHash)}`;
  }

  // Cache a batch of ads
  static async cacheBatch(cursor: any, filters: any, batch: CachedBatch): Promise<void> {
    try {
      // Skip caching if Redis is not available
      if (!(await isRedisAvailable())) {
        return;
      }
      const key = this.getBatchKey(cursor, filters);
      await redis.setex(key, CACHE_TTL, JSON.stringify(batch));
      console.log(`Cached batch: ${key}`);
    } catch (error) {
      console.error('Error caching batch:', error);
    }
  }

  // Get cached batch
  static async getCachedBatch(cursor: any, filters: any): Promise<CachedBatch | null> {
    try {
      // Skip caching if Redis is not available
      if (!(await isRedisAvailable())) {
        return null;
      }
      const key = this.getBatchKey(cursor, filters);
      const cached = await redis.get(key);
      
      if (cached) {
        const batch = JSON.parse(cached) as CachedBatch;
        console.log(`Retrieved cached batch: ${key}`);
        return batch;
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving cached batch:', error);
      return null;
    }
  }

  // Cache filtered results
  static async cacheFilteredResults(filters: any, results: FilterCache): Promise<void> {
    try {
      const key = this.getFilterKey(filters);
      await redis.setex(key, CACHE_TTL, JSON.stringify(results));
      console.log(`Cached filtered results: ${key}`);
    } catch (error) {
      console.error('Error caching filtered results:', error);
    }
  }

  // Get cached filtered results
  static async getCachedFilteredResults(filters: any): Promise<FilterCache | null> {
    try {
      const key = this.getFilterKey(filters);
      const cached = await redis.get(key);
      
      if (cached) {
        const results = JSON.parse(cached) as FilterCache;
        console.log(`Retrieved cached filtered results: ${key}`);
        return results;
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving cached filtered results:', error);
      return null;
    }
  }

  // Preload multiple batches
  static async preloadBatches(
    startCursor: any, 
    filters: any, 
    batchCount: number = 3
  ): Promise<CachedBatch[]> {
    const batches: CachedBatch[] = [];
    let currentCursor = startCursor;

    for (let i = 0; i < batchCount; i++) {
      // Check if batch is already cached
      const cachedBatch = await this.getCachedBatch(currentCursor, filters);
      
      if (cachedBatch) {
        batches.push(cachedBatch);
        currentCursor = cachedBatch.nextCursor;
        
        if (!cachedBatch.hasMore) break;
      } else {
        // If not cached, we'll need to fetch it from the API
        break;
      }
    }

    return batches;
  }

  // Invalidate cache for specific filters
  static async invalidateFilterCache(filters: any): Promise<void> {
    try {
      const key = this.getFilterKey(filters);
      await redis.del(key);
      console.log(`Invalidated filter cache: ${key}`);
    } catch (error) {
      console.error('Error invalidating filter cache:', error);
    }
  }

  // Clear all discover cache
  static async clearAllCache(): Promise<void> {
    try {
      const batchKeys = await redis.keys(`${BATCH_CACHE_PREFIX}*`);
      const filterKeys = await redis.keys(`${FILTER_CACHE_PREFIX}*`);
      
      if (batchKeys.length > 0) {
        await redis.del(...batchKeys);
      }
      if (filterKeys.length > 0) {
        await redis.del(...filterKeys);
      }
      
      console.log(`Cleared ${batchKeys.length} batch keys and ${filterKeys.length} filter keys`);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get cache statistics
  static async getCacheStats(): Promise<{
    batchKeys: number;
    filterKeys: number;
    totalMemory: string;
  }> {
    try {
      const batchKeys = await redis.keys(`${BATCH_CACHE_PREFIX}*`);
      const filterKeys = await redis.keys(`${FILTER_CACHE_PREFIX}*`);
      const info = await redis.info('memory');
      
      // Extract memory usage from info
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const totalMemory = memoryMatch ? memoryMatch[1] : 'unknown';
      
      return {
        batchKeys: batchKeys.length,
        filterKeys: filterKeys.length,
        totalMemory
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        batchKeys: 0,
        filterKeys: 0,
        totalMemory: 'unknown'
      };
    }
  }
}

// Utility function to check if Redis is available
export const isRedisAvailable = async (): Promise<boolean> => {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.warn('Redis not available:', error);
    return false;
  }
};

export default redis; 