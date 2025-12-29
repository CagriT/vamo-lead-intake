import { ref, computed, onMounted, Ref, ComputedRef } from "vue";
import {
  LeadFormErrors,
  LeadFormInputs,
  useLeadFormState,
} from "./useLeadFormState";
import { useImageState } from "./useImageState";
import { useNetworkState } from "./useNetworkState";
import { useOfflineDraft } from "./useOfflineDraft";
import {
  createLead,
  presignPicture,
  uploadImageToS3,
  attachPictureToLead,
} from "@/api/leads";
import { OfflineDraft } from "@/utils/offline-draft";

type Step = "form" | "images";
type LeadFlow = {
  step: Ref<Step, Step>;
  submitSuccess: Ref<boolean, boolean>;
  displayError: Ref<string, string>;
  isSubmitting: Ref<boolean, boolean>;
  form: LeadFormInputs;
  errors: ComputedRef<LeadFormErrors>;
  showValidationError: Ref<boolean, boolean>;
  isSubmitEnabled: ComputedRef<boolean>;
  selectedImages: Ref<File[], File[]>;
  isUploadingImages: Ref<boolean, boolean>;
  isOnline: Ref<boolean, boolean>;
  statusMessage: ComputedRef<string>;
  primaryButtonLabel: ComputedRef<string>;
  primaryButtonDisabled: ComputedRef<boolean>;
  submitForm: () => Promise<void>;
  primaryAction: () => Promise<void>;
  skipImages: () => Promise<void>;
  selectImages: (files: File[]) => void;
};

export function useLeadFlow(): LeadFlow {
  // State
  const step = ref<Step>("form");
  const submitSuccess = ref<boolean>(false);
  const displayError = ref<string>("");
  const isSubmitting = ref<boolean>(false);

  // Persisted lead identity (for image uploads)
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
    const hasOfflineImages = offlineDraft.offlineImageCount.value;
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
    isSubmitting.value = true;

    try {
      const payload = formState.buildPayload();

      // OFFLINE → save form only
      if (!network.isOnline.value) {
        await offlineDraft.saveOffline({
          payload,
        });
        step.value = "images";
        return;
      }

      // ONLINE → create lead
      const res = await createLead({ payload });

      leadId.value = res.leadId;
      pictureToken.value = res.pictureToken;

      // CRITICAL: persist identity for later offline usage
      await offlineDraft.saveOffline({
        payload,
        leadMeta: {
          leadId: res.leadId,
          pictureToken: res.pictureToken,
        },
      });

      step.value = "images";
    } catch {
      displayError.value = "Senden fehlgeschlagen.";
    } finally {
      isSubmitting.value = false;
    }
  }

  function selectImages(files: File[]) {
    displayError.value = "";
    offlineDraft.draftError.value = "";
    imageState.addFiles(files);
  }

  // Upload Btn Primary action
  async function primaryAction(): Promise<void> {
    const hasNewImages = imageState.selectedImages.value.length > 0;
    // OFFLINE → save only
    if (!network.isOnline.value) {
      if (hasNewImages) await saveImagesOffline();
      return;
    }

    // ONLINE
    const draft = await offlineDraft.getDraft();

    // CAN BE ACTIVATED ONLY FOR OFFLINE INITIAL FORM SUBMISSION IN IMAGE UPLOAD SECTION
    // Only sync form-only draft if user did NOT select new images
    // if (draft && draft.images.length === 0 && !hasNewImages) {
    //   try {
    //     if (!draft.leadId || !draft.pictureToken) {
    //       console.log("primaryAction TRY IF BLOCk");
    //       await createLead({ payload: draft.formData });
    //     }
    //     await offlineDraft.clearOffline();
    //     submitSuccess.value = true;
    //   } catch {
    //     displayError.value = "Lead konnte nicht synchronisiert werden.";
    //   }
    //   return;
    // }

    imageState.isUploadingImages.value = true;
    try {
      // Upload offline images first (if any)
      if (draft && draft.images.length > 0)
        await uploadOfflineDraftImages(draft);

      // Upload newly selected images (if any)
      if (hasNewImages) await uploadImagesOnline();
    } finally {
      imageState.isUploadingImages.value = false;
    }
  }

  // Upload flows
  async function uploadImagesOnline(): Promise<void> {
    if (!leadId.value || !pictureToken.value) return;

    try {
      for (const file of imageState.selectedImages.value) {
        await uploadSingleImage(file);
      }
      imageState.clearSelected();
      await offlineDraft.clearOffline();
      submitSuccess.value = true;
    } catch (e) {
      console.log(e instanceof Error ? e.message : e);
      displayError.value = "Bild-Upload fehlgeschlagen.";
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

  async function uploadOfflineDraftImages(
    draft: OfflineDraft | null
  ): Promise<void> {
    displayError.value = "";

    try {
      if (!draft || draft.images.length === 0) return;

      // Create lead ONCE and persist identity
      if (draft.leadId && draft.pictureToken) {
        leadId.value = draft.leadId;
        pictureToken.value = draft.pictureToken;
      } else {
        const res = await createLead({ payload: draft.formData });
        leadId.value = res.leadId;
        pictureToken.value = res.pictureToken;
      }

      // Upload all offline images
      for (const img of draft.images) {
        const file = new File([img.blob], img.fileName, {
          type: img.mimeType,
        });

        await uploadSingleImage(file);
      }

      // Cleanup
      await offlineDraft.clearOffline();
      submitSuccess.value = true;
    } catch {
      displayError.value = "Offline-Bilder konnten nicht hochgeladen werden.";
    }
  }

  async function saveImagesOffline(): Promise<void> {
    await offlineDraft.appendImagesOffline(imageState.selectedImages.value);

    if (offlineDraft.draftError.value) {
      displayError.value = offlineDraft.draftError.value;
      imageState.clearSelected();
      return;
    }
    // to make the upload btn disable
    imageState.clearSelected();
  }

  // Skip / reset
  async function skipImages(): Promise<void> {
    imageState.clearSelected();

    await offlineDraft.clearOffline(); // clear IndexedDB draft

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
    isSubmitting,

    form: formState.form,
    errors: formState.errors,
    showValidationError: formState.showValidationError,
    isSubmitEnabled: formState.isSubmitEnabled,

    selectedImages: imageState.selectedImages,
    isUploadingImages: imageState.isUploadingImages,

    isOnline: network.isOnline,
    statusMessage: network.statusMessage,

    primaryButtonLabel,
    primaryButtonDisabled,

    submitForm,
    primaryAction,
    skipImages,
    selectImages,
  };
}
