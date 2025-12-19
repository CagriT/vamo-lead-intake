<template>
  <div class="page">
    <form class="form-card" @submit.prevent="submit">
      <h1>Ihre Anfrage</h1>

      <div class="field">
        <label>Anrede</label>
        <select v-model="form.salutation">
          <option value="" disabled>Bitte wählen</option>
          <option
            v-for="option in salutationOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="field">
        <label>Vorname</label>
        <input v-model="form.firstName" type="text" />
      </div>

      <div class="field">
        <label>Nachname</label>
        <input v-model="form.lastName" type="text" />
      </div>

      <div class="field">
        <label>Postleitzahl</label>
        <input v-model="form.postalCode" type="text" />
      </div>

      <div class="field">
        <label>E-Mail</label>
        <input v-model="form.email" type="email" />
      </div>

      <div class="field">
        <label>Telefon</label>
        <input v-model="form.phone" type="tel" />
      </div>

      <button type="submit" :disabled="!isFormValid">Anfrage senden</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";

const form = reactive({
  salutation: "",
  firstName: "",
  lastName: "",
  postalCode: "",
  email: "",
  phone: "",
});

// const salutation = ref("");
// const firstName = ref("");
// const lastName = ref("");
// const postalCode = ref("");
// const email = ref("");
// const phone = ref("");

const salutationOptions = [
  { label: "Herr", value: "MALE" },
  { label: "Frau", value: "FEMALE" },
  { label: "Divers", value: "DIVERS" },
];

const isEmailValid = computed(() => form.email.includes("@"));
const isFormValid = computed(() => {
  return Boolean(
    form.salutation &&
      form.firstName &&
      form.lastName &&
      form.postalCode &&
      isEmailValid.value &&
      form.phone
  );
});

async function submit() {
  const payload = {
    salutation: form.salutation,
    firstName: form.firstName,
    lastName: form.lastName,
    postalCode: form.postalCode,
    email: form.email,
    phone: form.phone,
  };
  console.log("Submitting lead:", payload);
  await fetch("http://localhost:3000/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  alert("Lead submitted!");
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 16px;
}

.form-card {
  width: 100%;
  max-width: 420px;
  background: var(--off-white);
  padding: 24px;
  border-radius: 12px;
}

@media (min-width: 768px) {
  .form-card {
    padding: 32px;
  }
}

h1 {
  margin-bottom: 24px;
  font-size: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

label {
  font-size: 14px;
  margin-bottom: 6px;
}

input,
select {
  padding: 12px;
  font-size: 16px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--accent);
}

button {
  margin-top: 16px;
  width: 100%;
  padding: 14px;
  font-size: 16px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:disabled {
  background: #9fb89f;
  cursor: not-allowed;
}
</style>
