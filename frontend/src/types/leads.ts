export interface CreateLeadPayload {
  salutation: "MALE" | "FEMALE" | "DIVERS";
  firstName: string;
  lastName: string;
  postalCode: string;
  email: string;
  phone: string;
  newsletterSingleOptIn: boolean;
}
