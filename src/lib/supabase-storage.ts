import { supabaseAdmin } from './supabase';

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
    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

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
    // Fetch the video
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

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
  } catch (error) {
    console.error('Error uploading video to Supabase:', error);
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
