import "server-only";
import { env } from "@/lib/env";

let cloudinaryConfigured = false;

async function getCloudinary() {
  const { v2 } = await import("cloudinary");
  if (!cloudinaryConfigured) {
    v2.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
    });
    cloudinaryConfigured = true;
  }
  return v2;
}

/**
 * Persist a base64 data URL and return a URL to store in the DB.
 * - Cloudinary if configured (production).
 * - Otherwise returns the data URL unchanged (dev fallback — stored inline).
 * Already-http(s) URLs pass through untouched.
 */
export async function persistImage(dataUrl: string, folder = "svpc"): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;

  if (env.cloudinary.configured) {
    const cloudinary = await getCloudinary();
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder,
      resource_type: "image",
    });
    return result.secure_url;
  }

  return dataUrl;
}
