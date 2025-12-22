import { ref } from "vue";
import {
  saveDraft,
  getDraft,
  clearDraft,
  hasDraft,
  type OfflineDraft,
} from "@/utils/offline-draft";
import type { CreateLeadPayload } from "@/types/leads";

export function useOfflineDraft() {
  const hasOfflineDraft = ref<boolean>(false);
  const isSavingDraft = ref<boolean>(false);
  const draftError = ref<string>("");

  async function refreshDraftState(): Promise<void> {
    hasOfflineDraft.value = await hasDraft();
  }

  async function saveOffline(
    payload: CreateLeadPayload,
    files: File[]
  ): Promise<void> {
    isSavingDraft.value = true;
    draftError.value = "";

    try {
      await saveDraft(payload, files);
      hasOfflineDraft.value = true;
    } catch (e) {
      draftError.value = "Offline speichern fehlgeschlagen.";
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
    loadDraft,
    clearOffline,
  };
}
