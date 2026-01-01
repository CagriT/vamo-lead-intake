import { PresignPictureDto } from './leads/dto/presign-picture.dto';
import { AttachPictureDto } from './leads/dto/attach-picture.dto';
import { CrmLeadDto } from './crm/dto/crm-lead.dto';

export enum Salutation {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  DIVERS = 'DIVERS',
}

export type CreateLeadInput = {
  salutation: Salutation;
  firstName: string;
  lastName: string;
  postalCode: string;
  email: string;
  phone: string;
  newsletterSingleOptIn?: boolean;
};

export interface CreateLeadResponse {
  success: boolean;
  message: string;
  leadId: string;
  pictureToken: string;
}

export interface PresignPictureResponse {
  url: string;
  fields: Record<string, string>;
  accessUrl: string;
  key: string;
}

export interface AttachPictureResponse {
  success: boolean;
  message: string;
}

export interface PresignPictureParams {
  leadId: string;
  body: PresignPictureDto;
}

export interface AttachPictureParams {
  leadId: string;
  body: AttachPictureDto;
}

export interface PresignedPostResponse {
  url: string;
  fields: Record<string, string>;
  accessUrl: string;
  key: string;
}

export interface GeneratePresignedUploadUrlParams {
  leadId: string;
  fileName: string;
  contentType: string;
}

export interface VerifyUploadedObjectParams {
  key: string;
  expectedContentType: string;
  leadId: string;
}

export interface CreateLeadParams {
  lead: CrmLeadDto;
}

export interface AttachLeadPictureParams {
  leadId: string;
  pictureUrl: string;
}

export interface SalesforceTokenResponse {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
}
