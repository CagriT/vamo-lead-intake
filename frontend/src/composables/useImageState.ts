import { ref } from "vue";

export type ImageState = ReturnType<typeof useImageState>;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export function useImageState() {
  const selectedImages = ref<File[]>([]);
  const isUploadingImages = ref<boolean>(false);
  const imageUploadError = ref<string>("");
  const offlineImageNotice = ref<string>("");

  function addFiles(files: File[]): void {
    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        imageUploadError.value = "Datei ist zu groß. Maximal 20MB pro Bild.";
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      selectedImages.value = [...selectedImages.value, ...validFiles];
      if (validFiles.length === files.length) {
        imageUploadError.value = "";
      }
    }
  }

  function clearSelected(): void {
    selectedImages.value = [];
  }

  function setOfflineNotice(message: string): void {
    offlineImageNotice.value = message;
  }

  return {
    selectedImages,
    isUploadingImages,
    imageUploadError,
    offlineImageNotice,
    addFiles,
    clearSelected,
    setOfflineNotice,
  };
}
