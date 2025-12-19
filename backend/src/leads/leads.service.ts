import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Lead, LeadDocument } from './schemas/lead.schema';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
  ) {}

  async createLead(dto: CreateLeadDto) {
    const lead = new this.leadModel(dto);

    await lead.save(); // 🔥 THIS creates DB + collection + document

    console.log('Lead saved to MongoDB');
    console.log('Forwarded to CRM (FAKE)');

    return {
      success: true,
      message: 'Lead successfully created',
    };
  }
}
