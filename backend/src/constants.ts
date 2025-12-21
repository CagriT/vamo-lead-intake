export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const PRESIGNED_URL_TTL_SECONDS = 3600;
export const MAX_FILE_NAME_LENGTH = 100;

export const S3_SERVER_SIDE_ENCRYPTION = 'AES256';
export const S3_META_LEAD_ID_KEY = 'lead-id';

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};
