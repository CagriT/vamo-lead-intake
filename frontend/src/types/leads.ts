export interface CreateLeadPayload {
  salutation: "MALE" | "FEMALE" | "DIVERS";
  firstName: string;
  lastName: string;
  postalCode: string;
  email: string;
  phone: string;
  newsletterSingleOptIn: boolean;
}

export interface ImageUploadResponse {
  uploadUrl: string;
  publicUrl: string;
}

export interface CreateLeadResponse {
  leadId: string;
  uploadUrl: string;
  publicUrl: string;
}
