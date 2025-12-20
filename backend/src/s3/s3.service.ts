import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION') || 'eu-central-1';
    this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME') || '';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  /**
   * Generates a presigned URL for uploading an image to S3.
   * The uploaded image will be publicly accessible (no auth headers needed).
   * Presigned URL expires in 1 hour (as per API docs requirement).
   * @param leadId - MongoDB ObjectId of the lead
   * @param fileName - Name of the file to upload
   * @param contentType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
   * @returns Promise with presigned upload URL and public URL
   */
  async generatePresignedUploadUrl(
    leadId: string,
    fileName: string,
    contentType: string,
  ): Promise<PresignedUrlResponse> {
    // S3 key: leads/{leadId}/{timestamp}-{filename}
    // This organizes files by lead and prevents collisions
    const key = `leads/${leadId}/${Date.now()}-${fileName}`;

    // Public URL that will be accessible without auth headers
    // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
    const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

    // Create PUT command for uploading
    const command: PutObjectCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read', // Makes file publicly accessible (no auth needed)
    });

    // Generate presigned URL that expires in 1 hour (3600 seconds)
    // This URL is used ONLY for uploading (PUT request)
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour expiration (as per API docs)
    });

    return { uploadUrl, publicUrl };
  }
}
