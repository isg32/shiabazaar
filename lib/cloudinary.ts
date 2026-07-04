import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function signUploadParams(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder,
  };
}

export async function listAssets(folder = "shiabazaar", maxResults = 100) {
  const res = await cloudinary.api.resources({
    type: "upload",
    prefix: folder,
    max_results: maxResults,
    resource_type: "image",
  });
  return res.resources as CloudinaryAsset[];
}

export async function deleteAsset(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

export interface CloudinaryAsset {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
  bytes: number;
}
