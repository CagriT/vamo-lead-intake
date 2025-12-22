import { computed, onBeforeUnmount, onMounted, ref, type Ref } from "vue";

export type NetworkState = ReturnType<typeof useNetworkState>;

export function useNetworkState(pendingRecords?: Ref<number>) {
  const isOnline = ref<boolean>(navigator.onLine);

  const statusMessage = computed(() => {
    if (isOnline.value) {
      if (pendingRecords?.value && pendingRecords.value > 0) {
        return `Online — ${pendingRecords.value} gespeicherte Anfrage(n) bereit zum Upload.`;
      }
      return "Online — Bilder können jetzt über den Upload-Button hochgeladen werden.";
    }
    return "Offline — Bilder werden lokal gespeichert und später hochgeladen.";
  });

  function updateOnlineStatus(): void {
    isOnline.value = navigator.onLine;
  }

  onMounted(() => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("online", updateOnlineStatus);
    window.removeEventListener("offline", updateOnlineStatus);
  });

  return {
    isOnline,
    statusMessage,
  };
}
