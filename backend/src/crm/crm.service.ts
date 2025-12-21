import { CrmLeadDto } from './dto/crm-lead.dto';

export interface CrmService {
  createLead(lead: CrmLeadDto): Promise<void>;
  attachLeadPicture(leadId: string, pictureUrl: string): Promise<void>;
}
