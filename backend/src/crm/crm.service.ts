import { AttachLeadPictureParams, CreateLeadParams } from 'src/types';

export interface CrmService {
  createLead(params: CreateLeadParams): Promise<void>;
  attachLeadPicture(params: AttachLeadPictureParams): Promise<void>;
}
