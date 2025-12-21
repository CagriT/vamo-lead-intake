import { Injectable } from '@nestjs/common';
import { CrmService } from './crm.service';
import { AttachLeadPictureParams, CreateLeadParams } from 'src/types';

@Injectable()
export class FakeCrmService implements CrmService {
  async createLead(params: CreateLeadParams): Promise<void> {
    const { lead } = params;

    console.log('[FAKE CRM] Lead sent to CRM', {
      hasEmail: Boolean(lead.email),
      hasPhone: Boolean(lead.phone),
    });
  }

  async attachLeadPicture(params: AttachLeadPictureParams): Promise<void> {
    const { leadId } = params;
    console.log('[FAKE CRM] Picture attached', { leadId });
  }
}
