import { SaveOfflineParams } from "@/composables/useOfflineDraft";
import { CreateLeadPayload, OfflineImageRecord } from "@/types/leads";

const DB_NAME = "vamo-offline";
const DB_VERSION = 1;
const STORE_NAME = "draft";

// Total offline draft cap (images stored in IndexedDB)
const OFFLINE_DRAFT_MAX_BYTES = 20 * 1024 * 1024; // 20MB

export interface OfflineDraft {
  formData: CreateLeadPayload;
  images: OfflineImageRecord[];
  createdAt: number;
  leadId?: string;
  pictureToken?: string;
}

type SaveDraftParams = SaveOfflineParams & {
  files: File[];
};

function openDb(): Promise<IDBDatabase> {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB not supported"));
  }

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function fileToRecord(file: File): OfflineImageRecord {
  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    mimeType: file.type,
    blob: file,
  };
}

function sumExistingBytes(images: OfflineImageRecord[] | undefined): number {
  if (!images) return 0;
  return images.reduce((sum, img) => sum + (img.blob?.size ?? 0), 0);
}

export async function saveDraft(params: SaveDraftParams): Promise<void> {
  const { payload, leadMeta, files } = params;
  const existing = await getDraft();
  // Enforce storage limit: existing images + new files
  const existingBytes = sumExistingBytes(existing?.images);
  const newBytes = files.reduce((sum, f) => sum + f.size, 0);

  if (existingBytes + newBytes > OFFLINE_DRAFT_MAX_BYTES) {
    throw new Error("OFFLINE_QUOTA_EXCEEDED");
  }

  const db = await openDb();

  const draft: OfflineDraft = {
    formData: payload,
    images: files.map(fileToRecord),
    createdAt: existing?.createdAt ?? Date.now(),
    leadId: leadMeta?.leadId ?? existing?.leadId,
    pictureToken: leadMeta?.pictureToken ?? existing?.pictureToken,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(draft, "current");

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDraft(): Promise<OfflineDraft | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get("current");

    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearDraft(): Promise<void> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete("current");

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
