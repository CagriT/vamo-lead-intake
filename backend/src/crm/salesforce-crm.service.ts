import { Injectable } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CrmLeadDto } from './dto/crm-lead.dto';

@Injectable()
export class SalesforceCrmService implements CrmService {
  async createLead(lead: CrmLeadDto): Promise<void> {
    // TODO: Implement Salesforce API integration
    console.log('🚀 [SALESFORCE CRM] Lead would be sent:', lead);
  }
}
