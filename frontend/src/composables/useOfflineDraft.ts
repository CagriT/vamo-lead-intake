import { Ref, ref } from "vue";
import {
  saveDraft,
  getDraft,
  clearDraft,
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

export type SaveOfflineParams = {
  payload: CreateLeadPayload;
  leadMeta?: {
    leadId: string;
    pictureToken: string;
  };
};

type OfflineDraftRetVal = {
  offlineImageCount: Ref<number, number>;
  draftError: Ref<string, string>;
  getDraft(): Promise<OfflineDraft | null>;
  refreshDraftState: () => Promise<void>;
  saveOffline: (params: SaveOfflineParams) => Promise<void>;
  appendImagesOffline: (files: File[]) => Promise<void>;
  clearOffline: () => Promise<void>;
};

export function useOfflineDraft(): OfflineDraftRetVal {
  const offlineImageCount = ref(0); // How many images are actually stored in the draft
  const draftError = ref("");

  async function refreshDraftState(): Promise<void> {
    const draft = await getDraft();
    offlineImageCount.value = draft?.images?.length ?? 0;
  }

  // Create/overwrite draft (form submit offline OR online meta persistence)
  async function saveOffline(params: SaveOfflineParams): Promise<void> {
    const { payload, leadMeta } = params;
    draftError.value = "";

    try {
      await saveDraft({ payload, files: [], leadMeta });
      await refreshDraftState(); // keep in sync
    } catch (e) {
      draftError.value =
        e instanceof Error && e.message === "OFFLINE_QUOTA_EXCEEDED"
          ? "Offline-Speicher voll. Bitte weniger oder kleinere Bilder auswählen."
          : "Offline speichern fehlgeschlagen.";
    }
  }

  // Append images (image step offline)
  async function appendImagesOffline(files: File[]): Promise<void> {
    if (files.length === 0) return;
    draftError.value = "";

    try {
      const draft = await getDraft();
      if (!draft) {
        throw new Error("NO_DRAFT");
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
      await saveDraft({ payload: draft.formData, files: mergedFiles });
      await refreshDraftState(); // now offlineImageCount updates
    } catch (e) {
      draftError.value =
        e instanceof Error && e.message === "NO_DRAFT"
          ? "Keine Offline-Anfrage gefunden. Bitte Formular erneut senden."
          : e instanceof Error && e.message === "OFFLINE_QUOTA_EXCEEDED"
          ? "Offline-Speicher voll. Bitte weniger oder kleinere Bilder auswählen."
          : "Offline Bilder speichern fehlgeschlagen.";
    }
  }

  async function clearOffline(): Promise<void> {
    await clearDraft();
    offlineImageCount.value = 0;
  }

  return {
    offlineImageCount,
    draftError,
    getDraft,
    refreshDraftState,
    saveOffline,
    appendImagesOffline,
    clearOffline,
  };
}
