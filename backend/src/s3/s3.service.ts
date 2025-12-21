import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import {
  GeneratePresignedUploadUrlParams,
  PresignPictureResponse,
  VerifyUploadedObjectParams,
} from '../types';
import {
  ALLOWED_IMAGE_TYPES,
  EXT_TO_MIME,
  MAX_FILE_NAME_LENGTH,
  MAX_IMAGE_BYTES,
  PRESIGNED_URL_TTL_SECONDS,
  S3_META_LEAD_ID_KEY,
  S3_SERVER_SIDE_ENCRYPTION,
} from '../constants';

function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() || '';
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return safe.length > MAX_FILE_NAME_LENGTH
    ? safe.slice(-MAX_FILE_NAME_LENGTH)
    : safe;
}

function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const bucket = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    if (!region) throw new Error('AWS_REGION is not set');
    if (!bucket) throw new Error('AWS_S3_BUCKET_NAME is not set');

    this.region = region;
    this.bucketName = bucket;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async generatePresignedUploadUrl(
    params: GeneratePresignedUploadUrlParams,
  ): Promise<PresignPictureResponse> {
    const { leadId, fileName, contentType } = params;

    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      throw new BadRequestException(`Unsupported image type: ${contentType}`);
    }

    const safeFileName = sanitizeFileName(fileName);
    const ext = getExtension(safeFileName);
    const expectedMime = EXT_TO_MIME[ext];
    if (!expectedMime || expectedMime !== contentType) {
      throw new BadRequestException(
        `File extension does not match content type: ${safeFileName}`,
      );
    }

    const key = `leads/${leadId}/${Date.now()}-${randomUUID()}-${safeFileName}`;

    const metaHeader = `x-amz-meta-${S3_META_LEAD_ID_KEY}`;

    const { url, fields } = await createPresignedPost(this.s3Client, {
      Bucket: this.bucketName,
      Key: key,
      Conditions: [
        ['content-length-range', 1, MAX_IMAGE_BYTES],
        ['eq', '$Content-Type', contentType],
        ['eq', '$x-amz-server-side-encryption', S3_SERVER_SIDE_ENCRYPTION],
        ['eq', `$${metaHeader}`, leadId],
      ],
      Fields: {
        'Content-Type': contentType,
        'x-amz-server-side-encryption': S3_SERVER_SIDE_ENCRYPTION,
        [metaHeader]: leadId,
      },
      Expires: PRESIGNED_URL_TTL_SECONDS,
    });

    const getCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const accessUrl = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
    });

    return { url, fields, accessUrl, key };
  }

  // Verify the uploaded object exists and matches our security constraints
  async verifyUploadedObject(
    params: VerifyUploadedObjectParams,
  ): Promise<void> {
    const { key, expectedContentType, leadId } = params;

    const head = await this.s3Client.send(
      new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    // Enforce size limit at the server side
    if (head.ContentLength && head.ContentLength > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Uploaded file exceeds size limit');
    }

    // Ensure MIME type matches what was approved at presign
    if (head.ContentType !== expectedContentType) {
      throw new BadRequestException('Uploaded file type mismatch');
    }

    // Enforce encryption-at-rest
    if (head.ServerSideEncryption !== S3_SERVER_SIDE_ENCRYPTION) {
      throw new BadRequestException('Uploaded file is not encrypted');
    }

    // S3 metadata keys are lowercased
    const metaLeadId = head.Metadata?.[S3_META_LEAD_ID_KEY];
    if (metaLeadId !== leadId) {
      throw new BadRequestException('Uploaded file does not belong to lead');
    }
  }

  // to generate a presigned GET URL to transmit it to CRM
  async generatePresignedGetUrl(key: string): Promise<string> {
    const getCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, getCommand, {
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
    });
  }
}
