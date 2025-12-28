import {
  computed,
  ComputedRef,
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref,
} from "vue";

type NetworkState = {
  isOnline: Ref<boolean, boolean>;
  statusMessage: ComputedRef<string>;
};

export function useNetworkState(): NetworkState {
  const isOnline = ref<boolean>(navigator.onLine);

  const statusMessage = computed(() => {
    if (isOnline.value) {
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
