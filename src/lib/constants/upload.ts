export const MAX_ICON_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateImageFile(file: File) {
  if (file.size > MAX_ICON_SIZE) {
    throw new Error("画像サイズは5MB以内にしてください");
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("JPEG、PNG、WebP、GIF形式の画像のみアップロードできます");
  }
}
