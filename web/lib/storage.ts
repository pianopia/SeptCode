import { Storage } from "@google-cloud/storage";
import { env } from "@/lib/env";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

function toPublicGcsUrl(bucketName: string, filePath: string) {
  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

export async function uploadAvatarImage(userId: number, file: File) {
  if (!env.gcsBucketName) {
    throw new Error("gcs_bucket_not_configured");
  }
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("invalid_avatar_type");
  }
  if (file.size <= 0 || file.size > MAX_AVATAR_BYTES) {
    throw new Error("invalid_avatar_size");
  }

  const extension = EXT_BY_TYPE[file.type];
  const filename = `${crypto.randomUUID()}.${extension ?? "bin"}`;
  const filePath = `avatars/${userId}/${filename}`;

  const storage = new Storage();
  const buffer = Buffer.from(await file.arrayBuffer());
  const target = storage.bucket(env.gcsBucketName).file(filePath);

  await target.save(buffer, {
    resumable: false,
    contentType: file.type,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable"
    }
  });

  return toPublicGcsUrl(env.gcsBucketName, filePath);
}
