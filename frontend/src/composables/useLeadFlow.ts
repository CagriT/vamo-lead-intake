// src/composables/useLeadFlow.ts
import { ref, computed, onMounted } from "vue";
import { useLeadFormState } from "./useLeadFormState";
import { useImageState } from "./useImageState";
import { useNetworkState } from "./useNetworkState";
import { useOfflineDraft } from "./useOfflineDraft";
import {
  createLead,
  presignPicture,
  uploadImageToS3,
  attachPictureToLead,
} from "@/api/leads";

type Step = "form" | "images";

export function useLeadFlow() {
  // State
  const step = ref<Step>("form");
  const submitSuccess = ref(false);
  const displayError = ref("");

  // Persisted lead identity (CRITICAL FIX)
  const leadId = ref<string | null>(null);
  const pictureToken = ref<string | null>(null);

  // Composables
  const formState = useLeadFormState();
  const imageState = useImageState();
  const offlineDraft = useOfflineDraft();
  const network = useNetworkState();

  // UI state
  const primaryButtonLabel = computed(() => {
    if (imageState.isUploadingImages.value) return "Wird hochgeladen...";
    return network.isOnline.value
      ? "Bilder hochladen"
      : "Bilder lokal speichern";
  });

  const primaryButtonDisabled = computed(() => {
    const hasNewImages = imageState.selectedImages.value.length > 0;
    const hasOfflineImages = offlineDraft.hasOfflineDraft.value;
    return (
      imageState.isUploadingImages.value || (!hasNewImages && !hasOfflineImages)
    );
  });

  // Form submit
  async function submitForm(): Promise<void> {
    submitSuccess.value = false;
    displayError.value = "";
    formState.showValidationError.value = true;

    if (!formState.isFormValid.value) return;

    try {
      const payload = formState.buildPayload();

      // OFFLINE → save form only
      if (!network.isOnline.value) {
        await offlineDraft.saveOffline(payload, []);
        step.value = "images";
        return;
      }

      // ONLINE → create lead
      const res = await createLead({ payload });

      leadId.value = res.leadId;
      pictureToken.value = res.pictureToken;

      // 🔐 CRITICAL: persist identity for later offline usage
      await offlineDraft.saveOffline(payload, [], {
        leadId: res.leadId,
        pictureToken: res.pictureToken,
      });

      step.value = "images";
    } catch {
      displayError.value = "Senden fehlgeschlagen.";
    }
  }

  // Primary action
  async function primaryAction(): Promise<void> {
    // OFFLINE → save only
    if (!network.isOnline.value) {
      if (imageState.selectedImages.value.length > 0) {
        await saveImagesOffline();
      }
      return;
    }

    const draft = await offlineDraft.loadDraft();

    // 1️⃣ Upload offline images first (if any)
    if (draft && draft.images.length > 0) {
      await uploadOfflineDraftImages();
    }

    // 2️⃣ Upload newly selected images (if any)
    if (imageState.selectedImages.value.length > 0) {
      await uploadImagesOnline();
    }
  }

  // Upload flows
  async function uploadImagesOnline(): Promise<void> {
    if (!leadId.value || !pictureToken.value) return;

    imageState.isUploadingImages.value = true;
    try {
      for (const file of imageState.selectedImages.value) {
        await uploadSingleImage(file);
      }
      imageState.clearSelected();
      submitSuccess.value = true;
    } catch {
      displayError.value = "Bild-Upload fehlgeschlagen.";
    } finally {
      imageState.isUploadingImages.value = false;
    }
  }

  async function uploadOfflineImages(): Promise<void> {
    if (!leadId.value || !pictureToken.value) return;

    imageState.isUploadingImages.value = true;
    try {
      const draft = await offlineDraft.loadDraft();
      if (!draft) return;

      for (const img of draft.images) {
        const file = new File([img.blob], img.fileName, {
          type: img.mimeType,
        });
        await uploadSingleImage(file);
      }

      await offlineDraft.clearOffline();
      submitSuccess.value = true;
    } catch {
      displayError.value = "Offline-Bilder konnten nicht hochgeladen werden.";
    } finally {
      imageState.isUploadingImages.value = false;
    }
  }

  async function uploadSingleImage(file: File): Promise<void> {
    if (!leadId.value || !pictureToken.value) return;

    const presign = await presignPicture({
      leadId: leadId.value,
      pictureToken: pictureToken.value,
      payload: {
        fileName: file.name,
        contentType: file.type,
      },
    });

    await uploadImageToS3({
      url: presign.url,
      fields: presign.fields,
      file,
    });

    await attachPictureToLead({
      leadId: leadId.value,
      pictureToken: pictureToken.value,
      payload: {
        key: presign.key,
        mimeType: file.type,
        originalName: file.name,
      },
    });
  }

  async function uploadOfflineDraftImages(): Promise<void> {
    imageState.isUploadingImages.value = true;
    displayError.value = "";

    try {
      const draft = await offlineDraft.loadDraft();
      if (!draft || draft.images.length === 0) return;

      // 1️⃣ Create lead ONCE and persist identity
      if (draft.leadId && draft.pictureToken) {
        leadId.value = draft.leadId;
        pictureToken.value = draft.pictureToken;
      } else {
        const res = await createLead({ payload: draft.formData });
        leadId.value = res.leadId;
        pictureToken.value = res.pictureToken;
      }

      // 2️⃣ Upload all offline images
      for (const img of draft.images) {
        const file = new File([img.blob], img.fileName, {
          type: img.mimeType,
        });

        const presign = await presignPicture({
          leadId: leadId.value,
          pictureToken: pictureToken.value,
          payload: {
            fileName: file.name,
            contentType: file.type,
          },
        });

        await uploadImageToS3({
          url: presign.url,
          fields: presign.fields,
          file,
        });

        await attachPictureToLead({
          leadId: leadId.value,
          pictureToken: pictureToken.value,
          payload: {
            key: presign.key,
            mimeType: file.type,
            originalName: file.name,
          },
        });
      }

      // 3️⃣ Cleanup
      await offlineDraft.clearOffline();
    } catch {
      displayError.value = "Offline-Bilder konnten nicht hochgeladen werden.";
    } finally {
      imageState.isUploadingImages.value = false;
    }
  }

  async function saveImagesOffline(): Promise<void> {
    try {
      const payload = formState.buildPayload();
      await offlineDraft.saveOffline(payload, imageState.selectedImages.value);
      imageState.clearSelected();
    } catch {
      displayError.value = "Offline speichern fehlgeschlagen.";
    }
  }

  // Skip / reset
  function skipImages(): void {
    imageState.clearSelected();
    submitSuccess.value = true;
    step.value = "form";
    formState.resetForm();
    leadId.value = null;
    pictureToken.value = null;
  }

  // Lifecycle
  onMounted(() => {
    offlineDraft.refreshDraftState();
  });

  return {
    step,
    submitSuccess,
    displayError,

    form: formState.form,
    errors: formState.errors,
    showValidationError: formState.showValidationError,
    isSubmitEnabled: formState.isSubmitEnabled,

    selectedImages: imageState.selectedImages,
    isUploadingImages: imageState.isUploadingImages,
    offlineImageNotice: imageState.offlineImageNotice,

    isOnline: network.isOnline,
    statusMessage: network.statusMessage,

    primaryButtonLabel,
    primaryButtonDisabled,

    submitForm,
    uploadOfflineDraftImages,
    primaryAction,
    skipImages,
    selectImages: imageState.addFiles,
  };
}
