import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Lead, LeadDocument } from './schemas/lead.schema';
import { CrmLeadDto } from '../crm/dto/crm-lead.dto';
import { CRM_SERVICE } from '../crm/crm.constants';
import type { CrmService } from '../crm/crm.service';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,

    @Inject(CRM_SERVICE)
    private readonly crmService: CrmService,
  ) {}

  async createLead(dto: CreateLeadDto) {
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

    return {
      success: true,
      message: 'Lead successfully created',
    };
  }
}
