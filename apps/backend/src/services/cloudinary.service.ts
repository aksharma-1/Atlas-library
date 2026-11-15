import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

const isCloudinaryConfigured =
  Boolean(cloudName && apiKey && apiSecret) &&
  cloudName !== 'your_cloud_name_here' &&
  apiKey !== 'your_api_key_here' &&
  apiSecret !== 'your_api_secret_here';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * Upload an image (base64 string or remote URL) to Cloudinary.
 * If Cloudinary is not configured or dummy values are present,
 * gracefully return the provided base64/URL as a fallback so the app works seamlessly in dev mode.
 */
export async function uploadLogoToCloudinary(
  fileDataUri: string,
  folder = 'library_logos'
): Promise<string> {
  if (!isCloudinaryConfigured) {
    // Graceful fallback for local development or until real credentials are provided
    return fileDataUri;
  }

  try {
    const uploadRes = await cloudinary.uploader.upload(fileDataUri, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return uploadRes.secure_url || uploadRes.url;
  } catch (error) {
    console.error('[Cloudinary] Upload failed, falling back to data URI:', error);
    // If upload fails (e.g. invalid credentials or network issue), fallback to data uri so user experience isn't blocked
    return fileDataUri;
  }
}
