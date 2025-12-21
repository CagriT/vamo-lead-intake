import { Injectable } from '@nestjs/common';
import type { CrmService } from './crm.service';
import { CrmLeadDto } from './dto/crm-lead.dto';
import { AttachLeadPictureParams, CreateLeadParams } from 'src/types';

@Injectable()
export class SalesforceCrmService implements CrmService {
  async createLead(params: CreateLeadParams): Promise<void> {
    const { lead } = params;
    const payload = this.mapToSalesforceLeadPayload(lead);

    try {
      // TODO: real HTTP call with axios/fetch
      console.log('[SALESFORCE CRM] Lead payload prepared');

      return;
    } catch (error: unknown) {
      this.handleSalesforceError(error);
    }
  }

  async attachLeadPicture(params: AttachLeadPictureParams): Promise<void> {
    const { leadId } = params;

    try {
      // TODO: use Salesforce Lead Id or custom field mapping
      console.log('[SALESFORCE CRM] Attach picture', { leadId });

      return;
    } catch (error: unknown) {
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

  private handleSalesforceError(error: unknown) {
    const status = this.extractStatus(error);

    if (status === 401) {
      throw new Error('AUTH_ERROR');
    }

    if (status === 429) {
      throw new Error('RETRYABLE_ERROR');
    }

    if (status && status >= 500) {
      throw new Error('RETRYABLE_ERROR');
    }

    throw new Error('NON_RETRYABLE_ERROR');
  }

  private extractStatus(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') return undefined;
    const response = (error as { response?: { status?: number } }).response;
    return typeof response?.status === 'number' ? response.status : undefined;
  }
}
