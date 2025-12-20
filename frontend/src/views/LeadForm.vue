<template>
  <div class="page">
    <p v-if="submitSuccess && !showImageUpload" class="success">
      Vielen Dank! Wir melden uns bei Ihnen.
    </p>

    <p v-if="submitError" class="error">
      {{ submitError }}
    </p>

    <!-- Main form - shown initially and hidden after successful submission -->
    <form v-if="!showImageUpload" class="form-card" @submit.prevent="submit">
      <h1>Ihre Anfrage</h1>

      <div class="field">
        <label>Anrede</label>
        <select v-model="form.salutation">
          <option value="" disabled>Bitte wählen</option>
          <option
            v-for="option in salutationOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <span v-if="errors.salutation" class="error">
          {{ errors.salutation }}
        </span>
      </div>

      <div class="field">
        <label>Vorname</label>
        <input v-model="form.firstName" type="text" />
        <span v-if="errors.firstName" class="error">
          {{ errors.firstName }}
        </span>
      </div>

      <div class="field">
        <label>Nachname</label>
        <input v-model="form.lastName" type="text" />
        <span v-if="errors.lastName" class="error">
          {{ errors.lastName }}
        </span>
      </div>

      <div class="field">
        <label>Postleitzahl</label>
        <input v-model="form.postalCode" type="text" />
        <span v-if="errors.postalCode" class="error">
          {{ errors.postalCode }}
        </span>
      </div>

      <div class="field">
        <label>E-Mail</label>
        <input v-model="form.email" type="email" />
        <span v-if="errors.email" class="error">
          {{ errors.email }}
        </span>
      </div>

      <div class="field">
        <label>Telefon</label>
        <input v-model="form.phone" type="tel" />
        <span v-if="errors.phone" class="error">
          {{ errors.phone }}
        </span>
      </div>

      <div class="checkbox-field">
        <label>
          <input type="checkbox" v-model="form.privacyAccepted" />
          Ich habe die
          <a href="/datenschutz" target="_blank">Datenschutzerklärung</a>
          zur Kenntnis genommen.
        </label>
        <span v-if="errors.privacyAccepted" class="error">
          {{ errors.privacyAccepted }}
        </span>
      </div>

      <div class="checkbox-field">
        <label>
          <input type="checkbox" v-model="form.newsletterSingleOptIn" />
          Ja, ich möchte den Newsletter von Vamo erhalten.
        </label>
      </div>

      <button type="submit" :disabled="!isFormValid || isSubmitting">
        {{ isSubmitting ? "Wird gesendet..." : "Anfrage senden" }}
      </button>
    </form>

    <!-- Image upload section - shown AFTER form submission succeeds -->
    <div v-if="showImageUpload" class="form-card">
      <h2>Bild hochladen (optional)</h2>
      <p class="info-text">
        Sie können optional ein Bild hochladen. Dies ist nicht erforderlich.
      </p>

      <div class="field">
        <label>Bild auswählen</label>
        <input
          type="file"
          accept="image/*"
          @change="handleImageSelect"
          :disabled="isUploadingImage"
        />
        <span v-if="selectedImage" class="image-preview">
          Ausgewählt: {{ selectedImage.name }}
        </span>
        <span v-if="imageUploadError" class="error">
          {{ imageUploadError }}
        </span>
      </div>

      <button
        type="button"
        @click="uploadImage"
        :disabled="!selectedImage || isUploadingImage"
        class="upload-button"
      >
        {{ isUploadingImage ? "Wird hochgeladen..." : "Bild hochladen" }}
      </button>

      <button
        type="button"
        @click="skipImageUpload"
        :disabled="isUploadingImage"
        class="skip-button"
      >
        Überspringen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useLeadValidation } from "@/composables/useLeadValidation";
import { createLead, uploadImageToS3, updateLeadWithImage } from "@/api/leads";
import { CreateLeadPayload } from "@/types/leads";

const isSubmitting = ref<boolean>(false);
const submitSuccess = ref<boolean>(false);
const submitError = ref<string>("");
const showImageUpload = ref<boolean>(false);
const selectedImage = ref<File | null>(null);
const isUploadingImage = ref<boolean>(false);
const imageUploadError = ref<string>("");
const currentLeadId = ref<string>("");
const currentUploadUrl = ref<string>("");
const currentPublicUrl = ref<string>("");

const form = reactive({
  salutation: "",
  firstName: "",
  lastName: "",
  postalCode: "",
  email: "",
  phone: "",
  privacyAccepted: false,
  newsletterSingleOptIn: false,
});
const { errors, isFormValid } = useLeadValidation(form);

const salutationOptions = [
  { label: "Herr", value: "MALE" },
  { label: "Frau", value: "FEMALE" },
  { label: "Divers", value: "DIVERS" },
];

function handleImageSelect(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedImage.value = target.files[0];
    imageUploadError.value = "";
  }
}

async function submit(): Promise<void> {
  if (!isFormValid.value) return;

  isSubmitting.value = true;
  submitError.value = "";

  const payload: CreateLeadPayload = {
    salutation: form.salutation as "MALE" | "FEMALE" | "DIVERS",
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    postalCode: form.postalCode.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    newsletterSingleOptIn: form.newsletterSingleOptIn,
  };

  try {
    const { leadId, uploadUrl, publicUrl } = await createLead(payload);

    currentLeadId.value = leadId;
    currentUploadUrl.value = uploadUrl;
    currentPublicUrl.value = publicUrl;

    submitSuccess.value = true;
    showImageUpload.value = true;
  } catch (err) {
    submitError.value = "Übermittlung fehlgeschlagen. Bitte erneut versuchen.";
  } finally {
    isSubmitting.value = false;
  }
}

async function uploadImage(): Promise<void> {
  if (!selectedImage.value || !currentUploadUrl.value) return;

  isUploadingImage.value = true;
  imageUploadError.value = "";

  try {
    await uploadImageToS3(currentUploadUrl.value, selectedImage.value);
    await updateLeadWithImage(currentLeadId.value, currentPublicUrl.value);

    showImageUpload.value = false;
    submitSuccess.value = true;
  } catch (err) {
    imageUploadError.value =
      "Bild-Upload fehlgeschlagen. Bitte erneut versuchen.";
  } finally {
    isUploadingImage.value = false;
  }
}

function skipImageUpload(): void {
  showImageUpload.value = false;
  submitSuccess.value = true;
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 16px;
}

.form-card {
  width: 100%;
  max-width: 420px;
  background: var(--off-white);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .form-card {
    padding: 32px;
  }
}

h1 {
  margin-bottom: 24px;
  font-size: 24px;
}

h2 {
  margin-bottom: 16px;
  font-size: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

label {
  font-size: 14px;
  margin-bottom: 6px;
}

input,
select {
  padding: 12px;
  font-size: 16px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--accent);
}

button {
  margin-top: 16px;
  width: 100%;
  padding: 14px;
  font-size: 16px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:disabled {
  background: #9fb89f;
  cursor: not-allowed;
}

.upload-button {
  background: var(--accent);
}

.skip-button {
  background: #666;
  margin-top: 8px;
}

.success {
  color: #2e7d32;
  margin-bottom: 16px;
  text-align: center;
}

.error {
  color: #b00020;
  font-size: 12px;
  margin-top: 4px;
}

.info-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.checkbox-field {
  margin-top: 16px;
  font-size: 14px;
}

.checkbox-field input {
  margin-right: 8px;
}

.image-preview {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}
</style>
