<template>
  <div class="page">
    <p v-if="submitSuccess && !showImageUpload" class="success">
      Vielen Dank! Wir melden uns bei Ihnen.
    </p>

    <p v-if="submitError" class="error">
      {{ submitError }}
    </p>

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
      </div>

      <div class="field">
        <label>Vorname</label>
        <input v-model="form.firstName" type="text" />
      </div>

      <div class="field">
        <label>Nachname</label>
        <input v-model="form.lastName" type="text" />
      </div>

      <div class="field">
        <label>Postleitzahl</label>
        <input v-model="form.postalCode" type="text" />
      </div>

      <div class="field">
        <label>E-Mail</label>
        <input v-model="form.email" type="email" />
      </div>

      <div class="field">
        <label>Telefon</label>
        <input v-model="form.phone" type="tel" />
      </div>

      <div class="checkbox-field">
        <label>
          <input type="checkbox" v-model="form.privacyAccepted" />
          Ich habe die
          <a href="/datenschutz" target="_blank">Datenschutzerklärung</a>
          zur Kenntnis genommen.
        </label>
      </div>

      <div class="checkbox-field">
        <label>
          <input type="checkbox" v-model="form.newsletterSingleOptIn" />
          Ja, ich möchte den Newsletter von Vamo erhalten.
        </label>
      </div>

      <p v-if="showValidationError" class="error">
        Bitte prüfen Sie Ihre Eingaben.
      </p>

      <button type="submit" :disabled="!isFormValid || isSubmitting">
        {{ isSubmitting ? "Wird gesendet..." : "Anfrage senden" }}
      </button>
    </form>

    <div v-if="showImageUpload" class="form-card">
      <h2>Bilder hochladen (optional)</h2>
      <p class="info-text">
        Sie können optional Bilder hochladen. Dies ist nicht erforderlich.
      </p>

      <div class="field">
        <label>Bilder auswählen</label>
        <input
          type="file"
          :accept="IMAGE_ACCEPT_TYPES"
          multiple
          @change="handleImageSelect"
          :disabled="isUploadingImages"
        />
        <span v-if="selectedImages.length" class="image-preview">
          Ausgewählt: {{ selectedImages.length }} Datei(en)
        </span>
        <span v-if="imageUploadError" class="error">
          {{ imageUploadError }}
        </span>
      </div>

      <button
        type="button"
        @click="uploadImages"
        :disabled="selectedImages.length === 0 || isUploadingImages"
        class="upload-button"
      >
        {{ isUploadingImages ? "Wird hochgeladen..." : "Bilder hochladen" }}
      </button>

      <button
        type="button"
        @click="skipImageUpload"
        :disabled="isUploadingImages"
        class="skip-button"
      >
        Überspringen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useLeadValidation } from "@/composables/useLeadValidation";
import {
  attachPictureToLead,
  createLead,
  presignPicture,
  uploadImageToS3,
} from "@/api/leads";
import { CreateLeadPayload } from "@/types/leads";
import { IMAGE_ACCEPT_TYPES, MAX_FILE_SIZE_BYTES } from "@/constants";

const isSubmitting = ref<boolean>(false);
const submitSuccess = ref<boolean>(false);
const submitError = ref<string>("");
const showImageUpload = ref<boolean>(false);
const showValidationError = ref<boolean>(false);

const selectedImages = ref<File[]>([]);
const isUploadingImages = ref<boolean>(false);
const imageUploadError = ref<string>("");

const currentLeadId = ref<string>("");
const currentPictureToken = ref<string>("");

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

watch(
  () => form,
  () => {
    showValidationError.value = false;
  },
  { deep: true }
);

function handleImageSelect(event: Event): void {
  const target = event.target as HTMLInputElement;
  const files = target.files ? Array.from(target.files) : [];

  if (files.length === 0) return;

  const validFiles: File[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      imageUploadError.value = "Datei ist zu groß. Maximal 20MB pro Bild.";
    } else {
      validFiles.push(file);
    }
  }

  if (validFiles.length > 0) {
    selectedImages.value = [...selectedImages.value, ...validFiles];
    if (validFiles.length === files.length) {
      imageUploadError.value = "";
    }
  }
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

  selectedImages.value = [];
  currentLeadId.value = "";
  currentPictureToken.value = "";
  showValidationError.value = false;
}

async function submit(): Promise<void> {
  if (!isFormValid.value) {
    showValidationError.value = true;
    return;
  }

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
    const { leadId, pictureToken } = await createLead({ payload });
    currentLeadId.value = leadId;
    currentPictureToken.value = pictureToken;

    submitSuccess.value = true;
    showImageUpload.value = true;
  } catch {
    submitError.value = "Übermittlung fehlgeschlagen. Bitte erneut versuchen.";
  } finally {
    isSubmitting.value = false;
  }
}

async function uploadImages(): Promise<void> {
  if (
    !currentLeadId.value ||
    !currentPictureToken.value ||
    selectedImages.value.length === 0
  ) {
    return;
  }

  isUploadingImages.value = true;
  imageUploadError.value = "";

  try {
    for (const file of selectedImages.value) {
      const presign = await presignPicture({
        leadId: currentLeadId.value,
        payload: {
          fileName: file.name,
          contentType: file.type,
        },
        pictureToken: currentPictureToken.value,
      });

      await uploadImageToS3({
        url: presign.url,
        fields: presign.fields,
        file,
      });

      await attachPictureToLead({
        leadId: currentLeadId.value,
        payload: {
          key: presign.key,
          mimeType: file.type,
          originalName: file.name,
        },
        pictureToken: currentPictureToken.value,
      });
    }

    showImageUpload.value = false;
    submitSuccess.value = true;
    resetForm();
  } catch {
    imageUploadError.value =
      "Bild-Upload fehlgeschlagen. Bitte erneut versuchen.";
  } finally {
    isUploadingImages.value = false;
  }
}

function skipImageUpload(): void {
  showImageUpload.value = false;
  submitSuccess.value = true;
  resetForm();
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
