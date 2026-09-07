import sharp from "sharp";

const MAX_DIMENSION = 2000;
const THUMBNAIL_DIMENSION = 400;
const JPEG_QUALITY = 82;

export interface ProcessedImage {
  original: Buffer;
  thumbnail: Buffer;
  contentType: string;
}

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const image = sharp(input).rotate();

  const original = await image
    .clone()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  const thumbnail = await image
    .clone()
    .resize({ width: THUMBNAIL_DIMENSION, height: THUMBNAIL_DIMENSION, fit: "cover" })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  return { original, thumbnail, contentType: "image/jpeg" };
}
