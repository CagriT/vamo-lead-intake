import { Ref, ref } from "vue";
import { fileKey } from "./useOfflineDraft";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type ImageState = {
  selectedImages: Ref<File[]>;
  isUploadingImages: Ref<boolean>;
  imageUploadError: Ref<string>;
  addFiles: (files: File[]) => void;
  clearSelected: () => void;
};

export function useImageState(): ImageState {
  const selectedImages = ref<File[]>([]);
  const isUploadingImages = ref<boolean>(false);
  const imageUploadError = ref<string>("");

  function addFiles(files: File[]): void {
    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES)
        imageUploadError.value = "Datei ist zu groß. Maximal 20MB pro Bild.";
      else validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const existingKeys = new Set(selectedImages.value.map(fileKey));
      const newFiles = validFiles.filter((file) => {
        const key = fileKey(file);
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      if (newFiles.length > 0) {
        selectedImages.value = [...selectedImages.value, ...newFiles];
      }
      if (validFiles.length === files.length) imageUploadError.value = "";
    }
  }

  function clearSelected(): void {
    selectedImages.value = [];
  }

  return {
    selectedImages,
    isUploadingImages,
    imageUploadError,
    addFiles,
    clearSelected,
  };
}
