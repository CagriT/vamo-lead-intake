import { computed } from "vue";
import { LeadFormValues } from "@/types/leads";
import { EMAIL_REGEX } from "@/constants";

export function useLeadValidation(form: LeadFormValues) {
  const isEmailValid = computed(() => EMAIL_REGEX.test(form.email));

  const errors = computed(() => ({
    salutation: !form.salutation ? "Bitte wählen Sie eine Anrede" : "",
    firstName: !form.firstName ? "Vorname ist erforderlich" : "",
    lastName: !form.lastName ? "Nachname ist erforderlich" : "",
    postalCode: !form.postalCode ? "Postleitzahl ist erforderlich" : "",
    email: !form.email
      ? "E-Mail ist erforderlich"
      : !isEmailValid.value
      ? "Ungültige E-Mail-Adresse"
      : "",
    phone: !form.phone ? "Telefonnummer ist erforderlich" : "",
    privacyAccepted: !form.privacyAccepted
      ? "Bitte akzeptieren Sie die Datenschutzerklärung"
      : "",
  }));

  const isFormValid = computed(() =>
    Boolean(
      form.salutation &&
        form.firstName &&
        form.lastName &&
        form.postalCode &&
        isEmailValid.value &&
        form.phone &&
        form.privacyAccepted
    )
  );

  return {
    errors,
    isFormValid,
    isEmailValid,
  };
}
