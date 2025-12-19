import { Injectable } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CrmLeadDto } from './dto/crm-lead.dto';

@Injectable()
export class FakeCrmService implements CrmService {
  async createLead(lead: CrmLeadDto): Promise<void> {
    console.log('📨 [FAKE CRM] Lead sent to CRM:');
    console.log(JSON.stringify(lead, null, 2));
  }
}
