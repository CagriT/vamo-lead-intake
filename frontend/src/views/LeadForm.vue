<template>
  <div class="page">
    <!-- Status bar -->
    <div class="status-bar">
      <span :class="['status-pill', isOnline ? 'online' : 'offline']">
        {{ isOnline ? "Online" : "Offline" }}
      </span>
    </div>

    <p v-if="displayError" class="error">{{ displayError }}</p>

    <!-- <p v-if="submitSuccess && step === 'form'" class="success">
      Vielen Dank! Wir melden uns bei Ihnen.
    </p> -->

    <!-- FORM STEP -->
    <form v-if="step === 'form'" class="form-card" @submit.prevent="submitForm">
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
          <input v-model="form.firstName" type="text" />
          <span
            v-if="showValidationError && errors.firstName"
            class="field-error"
          >
            {{ errors.firstName }}
          </span>
        </div>

        <div class="field">
          <label>Nachname</label>
          <input v-model="form.lastName" type="text" />
          <span
            v-if="showValidationError && errors.lastName"
            class="field-error"
          >
            {{ errors.lastName }}
          </span>
        </div>

        <div class="field">
          <label>Postleitzahl</label>
          <input v-model="form.postalCode" type="text" />
          <span
            v-if="showValidationError && errors.postalCode"
            class="field-error"
          >
            {{ errors.postalCode }}
          </span>
        </div>

        <div class="field">
          <label>E-Mail</label>
          <input v-model="form.email" type="email" />
          <span v-if="showValidationError && errors.email" class="field-error">
            {{ errors.email }}
          </span>
        </div>

        <div class="field">
          <label>Telefon</label>
          <input v-model="form.phone" type="tel" />
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
            gelesen.
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
          <span>Ja, ich möchte den Newsletter erhalten.</span>
        </label>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="!isSubmitEnabled || isSubmitting">
          {{ isSubmitting ? "Wird gesendet..." : "Anfrage senden" }}
        </button>
      </div>
    </form>

    <!-- IMAGE STEP -->
    <div v-else class="form-card">
      <h2>Bilder hochladen (optional)</h2>

      <p
        v-if="!submitSuccess"
        :class="['status-banner', isOnline ? 'online' : 'offline']"
      >
        {{ statusMessage }}
      </p>

      <p v-if="submitSuccess" class="success">
        Bilder wurden erfolgreich hochgeladen.
      </p>

      <p v-if="!isOnline" class="info-text">
        Bilder werden lokal gespeichert und können später über den Upload-Button
        hochgeladen werden.
      </p>

      <div v-if="isMobile" class="field">
        <label>Foto aufnehmen (Kamera)</label>
        <input
          type="file"
          :accept="IMAGE_ACCEPT_TYPES"
          capture="environment"
          @change="onSelectFiles"
          :disabled="isUploadingImages"
        />
      </div>

      <div class="field">
        <label>Bilder auswählen</label>
        <input
          type="file"
          :accept="IMAGE_ACCEPT_TYPES"
          multiple
          @change="onSelectFiles"
          :disabled="isUploadingImages"
        />
        <span v-if="selectedImages.length" class="image-preview">
          Ausgewählt: {{ selectedImages.length }} Datei(en)
        </span>
      </div>

      <button
        type="button"
        class="upload-button"
        :disabled="primaryButtonDisabled"
        @click="primaryAction"
      >
        {{ primaryButtonLabel }}
      </button>

      <button
        type="button"
        class="skip-button"
        :disabled="isUploadingImages"
        @click="skipImages"
      >
        Überspringen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLeadFlow } from "@/composables/useLeadFlow";

const IMAGE_ACCEPT_TYPES =
  "image/jpeg,image/png,image/webp,image/heic,image/heif";

const salutationOptions = [
  { label: "Herr", value: "MALE" },
  { label: "Frau", value: "FEMALE" },
  { label: "Divers", value: "DIVERS" },
];
const {
  step,
  form,
  errors,
  isSubmitting,
  showValidationError,
  isSubmitEnabled,
  submitSuccess,
  displayError,
  isOnline,
  statusMessage,
  selectedImages,
  isUploadingImages,
  primaryButtonLabel,
  primaryButtonDisabled,
  submitForm,
  primaryAction,
  skipImages,
  selectImages,
} = useLeadFlow();

function onSelectFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  input.value = "";
  if (files.length > 0) {
    selectImages(files);
  }
}

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
</script>

<style scoped src="./LeadForm.css"></style>
