import { ref } from "vue";
import {
  saveDraft,
  getDraft,
  clearDraft,
  hasDraft,
  type OfflineDraft,
} from "@/utils/offline-draft";
import type { CreateLeadPayload, OfflineImageRecord } from "@/types/leads";

function filesToImageRecords(files: File[]): OfflineImageRecord[] {
  return files.map((file) => ({
    id: crypto.randomUUID(),
    fileName: file.name,
    mimeType: file.type,
    blob: file,
  }));
}

export function useOfflineDraft() {
  const hasOfflineDraft = ref(false);
  const isSavingDraft = ref(false);
  const draftError = ref("");

  async function refreshDraftState(): Promise<void> {
    hasOfflineDraft.value = await hasDraft();
  }

  // Create draft (form submit offline)
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
    } catch {
      draftError.value = "Offline speichern fehlgeschlagen.";
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
      if (!draft) return;

      const newImages = filesToImageRecords(files);

      const updatedDraft: OfflineDraft = {
        ...draft,
        images: [...draft.images, ...newImages],
      };

      await saveDraft(updatedDraft.formData, []); // overwrite metadata
      await saveDraft(updatedDraft.formData, updatedDraft.images as any);

      hasOfflineDraft.value = true;
    } catch {
      draftError.value = "Offline Bilder speichern fehlgeschlagen.";
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
