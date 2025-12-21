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
