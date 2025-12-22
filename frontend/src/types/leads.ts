export interface CreateLeadPayload {
  salutation: "MALE" | "FEMALE" | "DIVERS";
  firstName: string;
  lastName: string;
  postalCode: string;
  email: string;
  phone: string;
  newsletterSingleOptIn: boolean;
}

export interface CreateLeadResponse {
  leadId: string;
  pictureToken: string;
}

export interface PresignPictureRequest {
  fileName: string;
  contentType: string;
}

export interface PresignPictureResponse {
  url: string;
  fields: Record<string, string>;
  accessUrl: string;
  key: string;
}

export interface AttachPictureRequest {
  key: string;
  mimeType: string;
  originalName: string;
}

export interface CreateLeadParams {
  payload: CreateLeadPayload;
}

export interface PresignPictureParams {
  leadId: string;
  payload: PresignPictureRequest;
  pictureToken: string;
}

export interface UploadImageParams {
  url: string;
  fields: Record<string, string>;
  file: File;
}

export interface AttachPictureParams {
  leadId: string;
  payload: AttachPictureRequest;
  pictureToken: string;
}

export interface LeadFormValues {
  salutation: string;
  firstName: string;
  lastName: string;
  postalCode: string;
  email: string;
  phone: string;
  privacyAccepted: boolean;
  newsletterSingleOptIn?: boolean;
}

export type OfflineSyncStatus = "pending" | "uploading" | "synced" | "failed";

export interface OfflineImageRecord {
  id: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
}

export interface OfflineLeadRecord {
  id: string;
  formData: CreateLeadPayload;
  images: OfflineImageRecord[];
  status: OfflineSyncStatus;
  createdAt: number;
  lastError?: string;
}

export interface SavePendingLeadParams {
  formData: CreateLeadPayload;
  images: File[];
}

export interface AppendImagesToPendingLeadParams {
  id: string;
  images: File[];
}

export interface UpdateLeadStatusParams {
  id: string;
  status: OfflineSyncStatus;
  lastError?: string;
}

export interface DeletePendingLeadParams {
  id: string;
}
