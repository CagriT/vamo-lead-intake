import { Injectable } from '@nestjs/common';
import type { CrmService } from './crm.service';
import { CrmLeadDto } from './dto/crm-lead.dto';

@Injectable()
export class SalesforceCrmService implements CrmService {
  async createLead(lead: CrmLeadDto): Promise<void> {
    const payload = this.mapToSalesforceLeadPayload(lead);

    try {
      // TODO: real HTTP call with axios/fetch
      console.log('🚀 [SALESFORCE CRM] Payload to be sent:', payload);

      // simulate success
      return;
    } catch (error: any) {
      this.handleSalesforceError(error);
    }
  }

  private mapToSalesforceLeadPayload(lead: CrmLeadDto) {
    return {
      FirstName: lead.firstName,
      LastName: lead.lastName,
      Email: lead.email,
      Phone: lead.phone,
      PostalCode: lead.postalCode,
      Salutation: this.mapSalutation(lead.salutation),
      Company: 'Private',
      LeadSource: 'Website',
      Status: 'New',
    };
  }

  private mapSalutation(salutation: string) {
    switch (salutation) {
      case 'MALE':
        return 'Mr.';
      case 'FEMALE':
        return 'Ms.';
      case 'DIVERS':
        return 'Mx.';
      default:
        return undefined;
    }
  }

  private handleSalesforceError(error: any) {
    if (error?.response?.status === 401) {
      // token expired → refresh token → retry once
      throw new Error('AUTH_ERROR');
    }

    if (error?.response?.status === 429) {
      // rate limit
      throw new Error('RETRYABLE_ERROR');
    }

    if (error?.response?.status >= 500) {
      throw new Error('RETRYABLE_ERROR');
    }

    // validation or other errors
    throw new Error('NON_RETRYABLE_ERROR');
  }

  async attachLeadPicture(leadId: string, pictureUrl: string): Promise<void> {
    try {
      // TODO: use Salesforce Lead Id or custom field mapping
      console.log('🖼️ [SALESFORCE CRM] Attach picture', {
        leadId,
        pictureUrl,
      });

      return;
    } catch (error: any) {
      this.handleSalesforceError(error);
    }
  }
}
