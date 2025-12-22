import { CreateLeadPayload, OfflineImageRecord } from "@/types/leads";

const DB_NAME = "vamo-offline";
const DB_VERSION = 2;
const STORE_NAME = "draft";

export interface OfflineDraft {
  formData: CreateLeadPayload;
  images: OfflineImageRecord[];
  createdAt: number;
  leadId?: string;
  pictureToken?: string;
}

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

export async function saveDraft(
  payload: CreateLeadPayload,
  files: File[]
): Promise<void> {
  const db = await openDb();

  const draft: OfflineDraft = {
    formData: payload,
    images: files.map(fileToRecord),
    createdAt: Date.now(),
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

export async function hasDraft(): Promise<boolean> {
  const draft = await getDraft();
  return Boolean(draft);
}
