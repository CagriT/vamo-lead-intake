import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Lead, LeadDocument } from './schemas/lead.schema';
import { CrmLeadDto } from '../crm/dto/crm-lead.dto';
import { CRM_SERVICE } from '../crm/crm.constants';
import type { CrmService } from '../crm/crm.service';
import { S3Service } from '../s3/s3.service';

interface CreateLeadResponse {
  success: boolean;
  message: string;
  leadId: string;
  uploadUrl: string;
  publicUrl: string;
}

interface ImageUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

interface UpdateLeadImageResponse {
  success: boolean;
  message: string;
}

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,

    @Inject(CRM_SERVICE)
    private readonly crmService: CrmService,

    private readonly s3Service: S3Service,
  ) {}

  /**
   * Creates a new lead in MongoDB and generates S3 presigned URLs for image upload.
   * @param dto - Lead data from the request
   * @returns Promise with lead ID and S3 upload URLs
   */
  async createLead(dto: CreateLeadDto): Promise<CreateLeadResponse> {
    const lead = new this.leadModel(dto);
    await lead.save();

    const crmLead: CrmLeadDto = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      postalCode: dto.postalCode,
      salutation: dto.salutation,
    };

    await this.crmService.createLead(crmLead);

    // Generate presigned URLs proactively when lead is created
    // We use a placeholder filename - frontend will use the actual filename when uploading
    // The key structure will be: leads/{leadId}/{timestamp}-{actualFileName}
    const leadId = lead._id.toString();
    const timestamp = Date.now();
    const genericFileName = `image-${timestamp}.jpg`; // Generic filename with timestamp
    const defaultContentType = 'image/jpeg';

    const { uploadUrl, publicUrl } =
      await this.s3Service.generatePresignedUploadUrl(
        leadId,
        genericFileName,
        defaultContentType,
      );

    return {
      success: true,
      message: 'Lead successfully created',
      leadId,
      uploadUrl, // Presigned URL for uploading image (expires in 1 hour)
      publicUrl, // Public URL where image will be accessible
    };
  }

  /**
   * Generates new presigned URLs for image upload with a specific filename.
   * Useful if frontend wants to regenerate URLs with the actual filename.
   * @param leadId - MongoDB ObjectId of the lead
   * @param fileName - Actual filename from the user's file
   * @param contentType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
   * @returns Promise with presigned upload URL and public URL
   */
  async generateImageUploadUrl(
    leadId: string,
    fileName: string,
    contentType: string,
  ): Promise<ImageUploadUrlResponse> {
    const { uploadUrl, publicUrl } =
      await this.s3Service.generatePresignedUploadUrl(
        leadId,
        fileName,
        contentType,
      );

    return {
      uploadUrl,
      publicUrl,
    };
  }

  /**
   * Updates a lead document with the public S3 URL of the uploaded image.
   * @param leadId - MongoDB ObjectId of the lead
   * @param imageUrl - Public S3 URL where the image is accessible
   * @returns Promise with success status
   * @throws Error if lead is not found
   */
  async updateLeadWithImage(
    leadId: string,
    imageUrl: string,
  ): Promise<UpdateLeadImageResponse> {
    const lead = await this.leadModel.findByIdAndUpdate(
      leadId,
      { imageUrl },
      { new: true },
    );

    if (!lead) {
      throw new Error('Lead not found');
    }

    return {
      success: true,
      message: 'Lead image updated successfully',
      // lead,
    };
  }
}
