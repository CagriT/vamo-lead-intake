import { ref } from "vue";
import {
  saveDraft,
  getDraft,
  clearDraft,
  hasDraft,
  type OfflineDraft,
} from "@/utils/offline-draft";
import type { CreateLeadPayload } from "@/types/leads";

function recordToFile(record: {
  blob: Blob;
  fileName: string;
  mimeType: string;
}): File {
  return new File([record.blob], record.fileName, { type: record.mimeType });
}

export function useOfflineDraft() {
  const hasOfflineDraft = ref(false);
  const isSavingDraft = ref(false);
  const draftError = ref("");

  async function refreshDraftState(): Promise<void> {
    hasOfflineDraft.value = await hasDraft();
  }

  // Create/overwrite draft (form submit offline OR online meta persistence)
  async function saveOffline(
    payload: CreateLeadPayload,
    files: File[],
    leadMeta?: { leadId: string; pictureToken: string }
  ): Promise<void> {
    isSavingDraft.value = true;
    draftError.value = "";

    try {
      await saveDraft(payload, files, leadMeta);
      hasOfflineDraft.value = true;
    } catch (e) {
      if (e instanceof Error && e.message === "OFFLINE_QUOTA_EXCEEDED") {
        draftError.value =
          "Offline-Speicher voll. Bitte weniger oder kleinere Bilder auswählen.";
      } else {
        draftError.value = "Offline speichern fehlgeschlagen.";
      }
    } finally {
      isSavingDraft.value = false;
    }
  }

  // Append images (image step offline)
  async function appendImagesOffline(files: File[]): Promise<void> {
    if (files.length === 0) return;

    isSavingDraft.value = true;
    draftError.value = "";

    try {
      const draft = await getDraft();
      if (!draft) {
        // If user somehow lands on image step without draft, create minimal draft from files only
        if (!draft) {
          throw new Error("NO_DRAFT");
        }
        hasOfflineDraft.value = true;
        return;
      }

      // Convert existing OfflineImageRecord[] -> File[]
      const existingFiles = draft.images.map((img) =>
        recordToFile({
          blob: img.blob,
          fileName: img.fileName,
          mimeType: img.mimeType,
        })
      );

      const mergedFiles = [...existingFiles, ...files];

      // Save once: saveDraft will preserve createdAt + leadId/pictureToken internally
      await saveDraft(draft.formData, mergedFiles);

      hasOfflineDraft.value = true;
    } catch (e) {
      if (e instanceof Error && e.message === "NO_DRAFT") {
        draftError.value =
          "Keine Offline-Anfrage gefunden. Bitte Formular erneut senden.";
      } else if (e instanceof Error && e.message === "OFFLINE_QUOTA_EXCEEDED") {
        draftError.value =
          "Offline-Speicher voll. Bitte weniger oder kleinere Bilder auswählen.";
      } else {
        draftError.value = "Offline Bilder speichern fehlgeschlagen.";
      }
    } finally {
      isSavingDraft.value = false;
    }
  }

  async function loadDraft(): Promise<OfflineDraft | null> {
    return getDraft();
  }

  async function clearOffline(): Promise<void> {
    await clearDraft();
    hasOfflineDraft.value = false;
  }

  return {
    hasOfflineDraft,
    isSavingDraft,
    draftError,
    refreshDraftState,
    saveOffline,
    appendImagesOffline,
    loadDraft,
    clearOffline,
  };
}
