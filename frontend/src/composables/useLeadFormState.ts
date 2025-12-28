import { computed, ComputedRef, reactive, Ref, ref, watch } from "vue";
import { CreateLeadPayload } from "@/types/leads";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const postalCodeRegex = /^\d{5}$/;
const germanPhoneRegex = /^(\+49|0)[0-9\s\-()]{6,}$/;

export type LeadFormInputs = {
  salutation: string;
  firstName: string;
  lastName: string;
  postalCode: string;
  email: string;
  phone: string;
  privacyAccepted: boolean;
  newsletterSingleOptIn: boolean;
};

export type LeadFormErrors = {
  salutation: string;
  firstName: string;
  lastName: string;
  postalCode: string;
  email: string;
  phone: string;
  privacyAccepted: string;
};

type LeadFormState = {
  form: LeadFormInputs;
  errors: ComputedRef<LeadFormErrors>;
  isFormValid: ComputedRef<boolean>;
  isSubmitEnabled: ComputedRef<boolean>;
  showValidationError: Ref<boolean, boolean>;
  buildPayload: () => CreateLeadPayload;
  resetForm: () => void;
};

export function useLeadFormState(): LeadFormState {
  const form = reactive<LeadFormInputs>({
    salutation: "",
    firstName: "",
    lastName: "",
    postalCode: "",
    email: "",
    phone: "",
    privacyAccepted: false,
    newsletterSingleOptIn: false,
  });

  const showValidationError = ref(false);

  const errors = computed<LeadFormErrors>(() => ({
    salutation: !form.salutation ? "Bitte wählen Sie eine Anrede." : "",
    firstName: !form.firstName.trim() ? "Vorname ist erforderlich." : "",
    lastName: !form.lastName.trim() ? "Nachname ist erforderlich." : "",
    postalCode: !form.postalCode.trim()
      ? "Postleitzahl ist erforderlich."
      : !postalCodeRegex.test(form.postalCode.trim())
      ? "Bitte eine gültige PLZ (5 Ziffern) eingeben."
      : "",
    email: !form.email.trim()
      ? "E-Mail ist erforderlich."
      : !EMAIL_REGEX.test(form.email.trim())
      ? "Bitte gültige E-Mail eingeben."
      : "",
    phone: !form.phone.trim()
      ? "Telefonnummer ist erforderlich."
      : !germanPhoneRegex.test(form.phone.trim())
      ? "Bitte gültige deutsche Telefonnummer eingeben."
      : "",
    privacyAccepted: !form.privacyAccepted
      ? "Bitte Datenschutzerklärung akzeptieren."
      : "",
  }));

  const isFormValid = computed(() =>
    Object.values(errors.value).every((v) => !v)
  );

  const isSubmitEnabled = computed(() => {
    const allFilled =
      Boolean(form.salutation) &&
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      form.postalCode.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.phone.trim().length > 0;
    return allFilled && form.privacyAccepted;
  });

  function buildPayload(): CreateLeadPayload {
    return {
      salutation: form.salutation as "MALE" | "FEMALE" | "DIVERS",
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      postalCode: form.postalCode.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      newsletterSingleOptIn: form.newsletterSingleOptIn,
    };
  }

  function resetForm(): void {
    form.salutation = "";
    form.firstName = "";
    form.lastName = "";
    form.postalCode = "";
    form.email = "";
    form.phone = "";
    form.privacyAccepted = false;
    form.newsletterSingleOptIn = false;
    showValidationError.value = false;
  }

  // Whenever any form field changes, hide the validation banner until next submit
  watch(
    () => form,
    () => {
      showValidationError.value = false;
    },
    { deep: true }
  );

  return {
    form,
    errors,
    isFormValid,
    isSubmitEnabled,
    showValidationError,
    buildPayload,
    resetForm,
  };
}
