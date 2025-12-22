<template>
  <div class="page">
    <div class="status-bar">
      <span :class="['status-pill', isOnline ? 'online' : 'offline']">
        {{ isOnline ? "Online" : "Offline" }}
      </span>
      <span v-if="pendingUploads > 0" class="status-text">
        Ausstehende Uploads: {{ pendingUploads }}
      </span>
    </div>

    <p v-if="syncError" class="error">
      {{ syncError }}
    </p>

    <p v-if="submitSuccess && !showImageUpload" class="success">
      Vielen Dank! Wir melden uns bei Ihnen.
    </p>

    <p v-if="submitError" class="error">
      {{ submitError }}
    </p>

    <form v-if="!showImageUpload" class="form-card" @submit.prevent="submit">
      <h1>Ihre Anfrage</h1>

      <div class="grid-fields">
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
          <span
            v-if="showValidationError && errors.salutation"
            class="field-error"
          >
            {{ errors.salutation }}
          </span>
        </div>

        <div class="field">
          <label>Vorname</label>
          <input v-model="form.firstName" type="text" placeholder="Max" />
          <span
            v-if="showValidationError && errors.firstName"
            class="field-error"
          >
            {{ errors.firstName }}
          </span>
        </div>

        <div class="field">
          <label>Nachname</label>
          <input v-model="form.lastName" type="text" placeholder="Mustermann" />
          <span
            v-if="showValidationError && errors.lastName"
            class="field-error"
          >
            {{ errors.lastName }}
          </span>
        </div>

        <div class="field">
          <label>Postleitzahl</label>
          <input v-model="form.postalCode" type="text" placeholder="10115" />
          <span
            v-if="showValidationError && errors.postalCode"
            class="field-error"
          >
            {{ errors.postalCode }}
          </span>
        </div>

        <div class="field">
          <label>E-Mail</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="max@beispiel.de"
          />
          <span v-if="showValidationError && errors.email" class="field-error">
            {{ errors.email }}
          </span>
        </div>

        <div class="field">
          <label>Telefon</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="+49 170 1234567"
          />
          <span v-if="showValidationError && errors.phone" class="field-error">
            {{ errors.phone }}
          </span>
        </div>
      </div>

      <div class="checkbox-field">
        <label>
          <input type="checkbox" v-model="form.privacyAccepted" />
          <span>
            Ich habe die
            <a href="/datenschutz" target="_blank">Datenschutzerklärung</a>
            zur Kenntnis genommen.
          </span>
        </label>
        <span
          v-if="showValidationError && errors.privacyAccepted"
          class="field-error"
        >
          {{ errors.privacyAccepted }}
        </span>
      </div>

      <div class="checkbox-field">
        <label>
          <input type="checkbox" v-model="form.newsletterSingleOptIn" />
          <span>Ja, ich möchte den Newsletter von Vamo erhalten.</span>
        </label>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="!isSubmitEnabled">
          {{ isSubmitting ? "Wird gesendet..." : "Anfrage senden" }}
        </button>
      </div>
    </form>

    <div v-if="showImageUpload" class="form-card">
      <h2>Bilder hochladen (optional)</h2>
      <p class="info-text">
        Sie können optional Bilder hochladen. Dies ist nicht erforderlich.
      </p>

      <p :class="['status-banner', isOnline ? 'online' : 'offline']">
        {{ statusMessage }}
      </p>

      <p v-if="pendingUploads > 0" class="queue-text">
        Gespeicherte Bilder: {{ pendingUploads }}
      </p>

      <p v-if="offlineImageNotice" class="info-text">
        {{ offlineImageNotice }}
      </p>

      <div class="field">
        <label>Foto aufnehmen (Kamera)</label>
        <input
          type="file"
          :accept="IMAGE_ACCEPT_TYPES"
          capture="environment"
          @change="handleImageSelect"
          :disabled="isUploadingImages"
        />
      </div>

      <div class="field">
        <label>Bilder aus Dateien auswählen</label>
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
        <span v-if="imageUploadError" class="field-error">
          {{ imageUploadError }}
        </span>
      </div>

      <button
        type="button"
        @click="handlePrimaryAction"
        :disabled="primaryButtonDisabled"
        class="upload-button"
      >
        {{ primaryButtonLabel }}
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
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import {
  attachPictureToLead,
  createLead,
  presignPicture,
  uploadImageToS3,
} from "@/api/leads";
import { CreateLeadPayload, OfflineLeadRecord } from "@/types/leads";
import {
  IMAGE_ACCEPT_TYPES,
  MAX_FILE_SIZE_BYTES,
  EMAIL_REGEX,
} from "@/constants";
import {
  appendImagesToPendingLead,
  deletePendingLead,
  getPendingLeads,
  savePendingLead,
  updateLeadStatus,
} from "@/utils/offline-queue";

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

const isOnline = ref<boolean>(navigator.onLine);
const pendingUploads = ref<number>(0);
const isSyncingQueue = ref<boolean>(false);
const pendingPayload = ref<CreateLeadPayload | null>(null);
const pendingLeadId = ref<string>("");
const syncError = ref<string>("");
const offlineImageNotice = ref<string>("");

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

const salutationOptions = [
  { label: "Herr", value: "MALE" },
  { label: "Frau", value: "FEMALE" },
  { label: "Divers", value: "DIVERS" },
];

const postalCodeRegex = /^\d{5}$/;
const germanPhoneRegex = /^(\+49|0)[0-9\s\-()]{6,}$/;

const errors = computed(() => ({
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
  Object.values(errors.value).every((value) => !value)
);

const isSubmitEnabled = computed(() => {
  const allFilled =
    Boolean(form.salutation) &&
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.postalCode.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.phone.trim().length > 0;

  return allFilled && form.privacyAccepted && !isSubmitting.value;
});

const statusMessage = computed(() => {
  if (isOnline.value) {
    if (pendingUploads.value > 0) {
      return `Online — ${pendingUploads.value} gespeicherte Bilder bereit zum Upload.`;
    }
    return "Online — Bilder werden sofort hochgeladen.";
  }
  return "Offline — Bilder werden lokal gespeichert und später hochgeladen.";
});

const primaryButtonLabel = computed(() => {
  if (!isOnline.value && selectedImages.value.length > 0) {
    return "Bilder lokal speichern";
  }
  if (isOnline.value && selectedImages.value.length > 0) {
    return "Bilder hochladen";
  }
  if (isOnline.value && pendingUploads.value > 0) {
    return `Gespeicherte Bilder hochladen (${pendingUploads.value})`;
  }
  return "Fotos auswählen";
});

const primaryButtonDisabled = computed(() => {
  if (isUploadingImages.value || isSyncingQueue.value) return true;
  if (!isOnline.value) return selectedImages.value.length === 0;
  if (selectedImages.value.length > 0) return false;
  if (pendingUploads.value > 0) return false;
  return true;
});

async function handlePrimaryAction(): Promise<void> {
  if (primaryButtonDisabled.value) return;

  if (!isOnline.value || selectedImages.value.length > 0) {
    await uploadImages();
    return;
  }

  if (pendingUploads.value > 0) {
    await syncPendingLeads();
  }
}

function updateOnlineStatus(): void {
  isOnline.value = navigator.onLine;
}

async function refreshPendingCount(): Promise<void> {
  try {
    const records = await getPendingLeads();
    pendingUploads.value = records.reduce(
      (sum, record) => sum + record.images.length,
      0
    );
  } catch {
    pendingUploads.value = 0;
  }
}

onMounted(() => {
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  refreshPendingCount();
});

onBeforeUnmount(() => {
  window.removeEventListener("online", updateOnlineStatus);
  window.removeEventListener("offline", updateOnlineStatus);
});

watch(
  () => form,
  () => {
    showValidationError.value = false;
  },
  { deep: true }
);

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

function handleImageSelect(event: Event): void {
  const target = event.target as HTMLInputElement;
  const files = target.files ? Array.from(target.files) : [];
  target.value = "";
  offlineImageNotice.value = "";

  if (files.length === 0) return;

  const validFiles: File[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      imageUploadError.value = "Datei ist zu groß. Maximal 20MB pro Bild.";
    } else {
      validFiles.push(file);
    }
  }
  console.log("validFiles:", validFiles);
  console.log("selectedImages:", selectedImages);

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
  offlineImageNotice.value = "";
  currentPictureToken.value = "";
  pendingPayload.value = null;
  pendingLeadId.value = "";
  showValidationError.value = false;
}

async function submit(): Promise<void> {
  if (!isFormValid.value) {
    showValidationError.value = true;
    return;
  }

  isSubmitting.value = true;
  submitError.value = "";

  const payload: CreateLeadPayload = buildPayload();

  if (!isOnline.value) {
    pendingPayload.value = payload;

    try {
      const id = await savePendingLead({
        formData: payload,
        images: [],
      });
      pendingLeadId.value = id;
      await refreshPendingCount();

      showImageUpload.value = true;
    } catch {
      submitError.value = "Lokales Speichern fehlgeschlagen.";
    } finally {
      isSubmitting.value = false;
    }

    return;
  }

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
  if (selectedImages.value.length === 0) {
    return;
  }

  if (!isOnline.value) {
    const payload = pendingPayload.value ?? buildPayload();

    try {
      if (!pendingLeadId.value) {
        const id = await savePendingLead({
          formData: payload,
          images: [],
        });
        pendingLeadId.value = id;
      }

      await appendImagesToPendingLead({
        id: pendingLeadId.value,
        images: selectedImages.value,
      });

      await refreshPendingCount();

      offlineImageNotice.value =
        "Bilder wurden lokal gespeichert und werden bei Internetverbindung hochgeladen.";
      selectedImages.value = [];
      imageUploadError.value = "";
    } catch {
      imageUploadError.value = "Lokales Speichern fehlgeschlagen.";
    }

    return;
  }

  if (!currentLeadId.value || !currentPictureToken.value) {
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

async function skipImageUpload(): Promise<void> {
  if (!isOnline.value) {
    showImageUpload.value = false;
    submitSuccess.value = true;
    resetForm();
    return;
  }

  showImageUpload.value = false;
  submitSuccess.value = true;
  resetForm();
}

async function syncPendingLeads(): Promise<void> {
  if (!isOnline.value || isSyncingQueue.value) {
    return;
  }

  isSyncingQueue.value = true;
  syncError.value = "";

  try {
    const records = await getPendingLeads();

    for (const record of records) {
      await updateLeadStatus({ id: record.id, status: "uploading" });

      try {
        await syncRecord(record);
        await deletePendingLead({ id: record.id });
      } catch {
        await updateLeadStatus({
          id: record.id,
          status: "failed",
          lastError: "Sync failed",
        });
      }
    }

    await refreshPendingCount();
  } catch {
    syncError.value = "Synchronisierung fehlgeschlagen.";
  } finally {
    isSyncingQueue.value = false;
  }
}

async function syncRecord(record: OfflineLeadRecord): Promise<void> {
  const { leadId, pictureToken } = await createLead({
    payload: record.formData,
  });

  for (const image of record.images) {
    const file = new File([image.blob], image.fileName, {
      type: image.mimeType,
    });

    const presign = await presignPicture({
      leadId,
      payload: {
        fileName: file.name,
        contentType: file.type,
      },
      pictureToken,
    });

    await uploadImageToS3({
      url: presign.url,
      fields: presign.fields,
      file,
    });

    await attachPictureToLead({
      leadId,
      payload: {
        key: presign.key,
        mimeType: file.type,
        originalName: file.name,
      },
      pictureToken,
    });
  }
}
</script>

<style scoped src="./LeadForm.css"></style>
