import { v2 as cloudinary } from "cloudinary";
import { logger } from "./logger.js";

const cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
const apiKey = process.env["CLOUDINARY_API_KEY"];
const apiSecret = process.env["CLOUDINARY_API_SECRET"];

if (!cloudName || !apiKey || !apiSecret) {
  logger.warn(
    "Cloudinary env vars missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). " +
    "Photo uploads will be unavailable until these are configured.",
  );
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export { cloudinary };
export const cloudinaryEnabled = !!(cloudName && apiKey && apiSecret);
