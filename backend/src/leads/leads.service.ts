import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Lead, LeadDocument } from './schemas/lead.schema';
import { CrmLeadDto } from '../crm/dto/crm-lead.dto';
import { CRM_SERVICE } from '../crm/crm.constants';
import type { CrmService } from '../crm/crm.service';
import { S3Service } from '../s3/s3.service';
import { PresignPictureDto } from './dto/presign-picture.dto';
import { AttachPictureDto } from './dto/attach-picture.dto';
import { LeadPictureTokenService } from './lead-picture-token.service';

interface CreateLeadResponse {
  success: boolean;
  message: string;
  leadId: string;
  pictureToken: string;
}

interface PresignPictureResponse {
  url: string;
  fields: Record<string, string>;
  accessUrl: string;
  key: string;
}

interface AttachPictureResponse {
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
    private readonly leadPictureTokenService: LeadPictureTokenService,
  ) {}

  // Creates the lead and returns a short-lived token for picture upload
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

    const leadId = lead._id.toString();
    const pictureToken = this.leadPictureTokenService.signForLead(leadId);

    return {
      success: true,
      message: 'Lead successfully created',
      leadId,
      pictureToken,
    };
  }

  // Generates presigned POST + GET URLs for a specific image
  async presignPicture(
    leadId: string,
    body: PresignPictureDto,
  ): Promise<PresignPictureResponse> {
    return this.s3Service.generatePresignedUploadUrl(
      leadId,
      body.fileName,
      body.contentType,
    );
  }

  // Stores picture metadata and forwards a fresh access URL to CRM
  async attachPicture(
    leadId: string,
    body: AttachPictureDto,
  ): Promise<AttachPictureResponse> {
    const lead = await this.leadModel.findByIdAndUpdate(
      leadId,
      { $push: { pictures: body } },
      { new: true },
    );

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Ensure the S3 object exists and matches our size/type/encryption rules
    await this.s3Service.verifyUploadedObject(body.key, body.mimeType, leadId);

    const accessUrl = await this.s3Service.generatePresignedGetUrl(body.key);
    // In production, map to the Salesforce Lead Id stored on the lead
    await this.crmService.attachLeadPicture(leadId, accessUrl);

    return {
      success: true,
      message: 'Picture attached',
    };
  }
}
