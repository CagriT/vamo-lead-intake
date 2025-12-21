import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Lead, LeadDocument } from './schemas/lead.schema';
import { CrmLeadDto } from '../crm/dto/crm-lead.dto';
import { CRM_SERVICE } from '../crm/crm.constants';
import type { CrmService } from '../crm/crm.service';
import { S3Service } from '../s3/s3.service';
import {
  AttachPictureParams,
  AttachPictureResponse,
  CreateLeadResponse,
  PresignPictureParams,
  PresignPictureResponse,
} from '../types';
import { LeadPictureTokenService } from './lead-picture-token.service';

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

    await this.crmService.createLead({ lead: crmLead });

    const leadId = lead._id.toString();
    const pictureToken = this.leadPictureTokenService.signForLead({ leadId });

    return {
      success: true,
      message: 'Lead successfully created',
      leadId,
      pictureToken,
    };
  }

  async presignPicture(
    params: PresignPictureParams,
  ): Promise<PresignPictureResponse> {
    const { leadId, body } = params;

    return this.s3Service.generatePresignedUploadUrl({
      leadId,
      fileName: body.fileName,
      contentType: body.contentType,
    });
  }

  async attachPicture(
    params: AttachPictureParams,
  ): Promise<AttachPictureResponse> {
    const { leadId, body } = params;

    const lead = await this.leadModel.findByIdAndUpdate(
      leadId,
      { $push: { pictures: body } },
      { new: true },
    );

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Ensure the S3 object exists and matches our size/type/encryption rules
    await this.s3Service.verifyUploadedObject({
      key: body.key,
      expectedContentType: body.mimeType,
      leadId,
    });

    const accessUrl = await this.s3Service.generatePresignedGetUrl(body.key);
    // In production, map to the Salesforce Lead Id stored on the lead
    await this.crmService.attachLeadPicture({
      leadId,
      pictureUrl: accessUrl,
    });

    return {
      success: true,
      message: 'Picture attached',
    };
  }
}
