import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dwzdr8ei9',
  api_key: process.env.CLOUDINARY_API_KEY || '741397439758848',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'kOPze_jNVA8xgTAA5GsjSTMLLig',
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  duration?: number;
}

export async function uploadImageToCloudinary(
  imageUrl: string,
  adId: string
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'ads/images',
      public_id: `ad_${adId}_${Date.now()}`,
      resource_type: 'image',
      timeout: 60000, // 60 seconds timeout
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error(`Failed to upload image: ${error}`);
  }
}

export async function uploadVideoToCloudinary(
  videoUrl: string,
  adId: string
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(videoUrl, {
      folder: 'ads/videos',
      public_id: `ad_${adId}_${Date.now()}`,
      resource_type: 'video',
      timeout: 300000, // 5 minutes timeout for videos
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      duration: result.duration,
    };
  } catch (error) {
    console.error('Error uploading video to Cloudinary:', error);
    throw new Error(`Failed to upload video: ${error}`);
  }
}

// Helper function to check if URL is accessible
export async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Helper function to extract media URLs from ad content
export function extractMediaUrls(content: string): {
  imageUrls: string[];
  videoUrls: string[];
} {
  const imageUrls: string[] = [];
  const videoUrls: string[] = [];

  try {
    const parsed = JSON.parse(content);

    // Extract image URLs
    if (parsed.images && Array.isArray(parsed.images)) {
      parsed.images.forEach((img: any) => {
        if (img.original_image_url) imageUrls.push(img.original_image_url);
        if (img.resized_image_url) imageUrls.push(img.resized_image_url);
      });
    }

    // Extract video URLs
    if (parsed.videos && Array.isArray(parsed.videos)) {
      parsed.videos.forEach((video: any) => {
        if (video.video_hd_url) videoUrls.push(video.video_hd_url);
        if (video.video_sd_url && !videoUrls.includes(video.video_sd_url)) {
          videoUrls.push(video.video_sd_url);
        }
      });
    }

    // Handle carousel ads
    if (parsed.cards && Array.isArray(parsed.cards)) {
      parsed.cards.forEach((card: any) => {
        if (card.original_image_url) imageUrls.push(card.original_image_url);
        if (card.resized_image_url && !imageUrls.includes(card.resized_image_url)) {
          imageUrls.push(card.resized_image_url);
        }
        if (card.video_hd_url) videoUrls.push(card.video_hd_url);
        if (card.video_sd_url && !videoUrls.includes(card.video_sd_url)) {
          videoUrls.push(card.video_sd_url);
        }
      });
    }

    // Handle snapshot format
    if (parsed.snapshot) {
      if (parsed.snapshot.images && Array.isArray(parsed.snapshot.images)) {
        parsed.snapshot.images.forEach((img: any) => {
          if (img.original_image_url) imageUrls.push(img.original_image_url);
          if (img.resized_image_url && !imageUrls.includes(img.resized_image_url)) {
            imageUrls.push(img.resized_image_url);
          }
        });
      }

      if (parsed.snapshot.videos && Array.isArray(parsed.snapshot.videos)) {
        parsed.snapshot.videos.forEach((video: any) => {
          if (video.video_hd_url) videoUrls.push(video.video_hd_url);
          if (video.video_sd_url && !videoUrls.includes(video.video_sd_url)) {
            videoUrls.push(video.video_sd_url);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error parsing ad content for media URLs:', error);
  }

  return {
    imageUrls: Array.from(new Set(imageUrls)), // Remove duplicates
    videoUrls: Array.from(new Set(videoUrls)), // Remove duplicates
  };
}

export default cloudinary; 