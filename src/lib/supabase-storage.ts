import { supabaseAdmin } from './supabase';

const IMAGE_FETCH_TIMEOUT_MS = 30_000; // 30s for image URLs

/**
 * Upload an image from a URL to Supabase Storage
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  options: {
    folder?: string;
    filename?: string;
  } = {}
): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate filename
    const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = options.filename || `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const folder = options.folder || 'ads/images';
    const filepath = `${folder}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('media')
      .upload(filepath, buffer, {
        contentType: blob.type || 'image/jpeg',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(filepath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
}

const VIDEO_FETCH_TIMEOUT_MS = 120_000; // 2 min for large/slow video URLs (e.g. Facebook CDN)

/**
 * Upload a video from a URL to Supabase Storage
 */
export async function uploadVideoFromUrl(
  videoUrl: string,
  options: {
    folder?: string;
    filename?: string;
  } = {}
): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VIDEO_FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(videoUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate filename
    const ext = videoUrl.split('.').pop()?.split('?')[0] || 'mp4';
    const filename = options.filename || `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const folder = options.folder || 'ads/videos';
    const filepath = `${folder}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('media')
      .upload(filepath, buffer, {
        contentType: blob.type || 'video/mp4',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(filepath);

    return publicUrl;
  } catch (error: unknown) {
    const isFetchTimeout = error instanceof Error && error.name === 'AbortError';
    const isConnectTimeout = error instanceof Error && (error as NodeJS.ErrnoException).cause?.toString?.().includes('ConnectTimeoutError');
    if (isFetchTimeout || isConnectTimeout) {
      console.error('Video fetch from source timed out (increase VIDEO_FETCH_TIMEOUT_MS if needed):', videoUrl?.slice?.(0, 80));
    } else {
      console.error('Error uploading video to Supabase:', error);
    }
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(filepath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from('media')
    .remove([filepath]);

  if (error) {
    throw error;
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(filepath: string): string {
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('media')
    .getPublicUrl(filepath);

  return publicUrl;
}
