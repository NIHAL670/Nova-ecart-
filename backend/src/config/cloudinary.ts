/**
 * Cloudinary configuration for product image uploads.
 * Exposes an `isConfigured` flag so the app can degrade gracefully when
 * credentials are absent in local/dev environments (fallback to local disk).
 */
import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

const configured =
  Boolean(env.CLOUDINARY_CLOUD_NAME) && Boolean(env.CLOUDINARY_API_KEY) && Boolean(env.CLOUDINARY_API_SECRET);

if (configured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary, configured as isCloudinaryConfigured };
