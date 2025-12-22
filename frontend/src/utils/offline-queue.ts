import {
  AppendImagesToPendingLeadParams,
  DeletePendingLeadParams,
  OfflineImageRecord,
  OfflineLeadRecord,
  SavePendingLeadParams,
  UpdateLeadStatusParams,
} from "@/types/leads";

const DB_NAME = "vamo-offline";
const DB_VERSION = 1;
const STORE_NAME = "leads";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function mapFilesToRecords(files: File[]): OfflineImageRecord[] {
  return files.map((file) => ({
    id: generateId(),
    fileName: file.name,
    mimeType: file.type,
    blob: file,
  }));
}

export async function savePendingLead(
  params: SavePendingLeadParams
): Promise<string> {
  const { formData, images } = params;
  const db = await openDb();

  const record: OfflineLeadRecord = {
    id: generateId(),
    formData,
    images: mapFilesToRecords(images),
    status: "pending",
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.put(record);

    tx.oncomplete = () => resolve(record.id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function appendImagesToPendingLead(
  params: AppendImagesToPendingLeadParams
): Promise<void> {
  const { id, images } = params;
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const record = request.result as OfflineLeadRecord | undefined;
      if (!record) {
        resolve();
        return;
      }

      const newImages = mapFilesToRecords(images);
      record.images = [...record.images, ...newImages];

      store.put(record);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingLeads(): Promise<OfflineLeadRecord[]> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () =>
      resolve((request.result as OfflineLeadRecord[]) || []);
    request.onerror = () => reject(request.error);
  });
}

export async function updateLeadStatus(
  params: UpdateLeadStatusParams
): Promise<void> {
  const { id, status, lastError } = params;
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const record = request.result as OfflineLeadRecord | undefined;
      if (!record) {
        resolve();
        return;
      }

      record.status = status;
      if (lastError !== undefined) {
        record.lastError = lastError;
      }

      store.put(record);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deletePendingLead(
  params: DeletePendingLeadParams
): Promise<void> {
  const { id } = params;
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
