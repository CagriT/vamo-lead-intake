<template>
  <div class="page">
    <p v-if="submitSuccess" class="success">
      Vielen Dank! Wir melden uns bei Ihnen.
    </p>

    <p v-if="submitError" class="error">
      {{ submitError }}
    </p>
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
        <span v-if="errors.salutation" class="error">
          {{ errors.salutation }}
        </span>
      </div>

      <div class="field">
        <label>Vorname</label>
        <input v-model="form.firstName" type="text" />
        <span v-if="errors.firstName" class="error">
          {{ errors.firstName }}
        </span>
      </div>

      <div class="field">
        <label>Nachname</label>
        <input v-model="form.lastName" type="text" />
        <span v-if="errors.lastName" class="error">
          {{ errors.lastName }}
        </span>
      </div>

      <div class="field">
        <label>Postleitzahl</label>
        <input v-model="form.postalCode" type="text" />
        <span v-if="errors.postalCode" class="error">
          {{ errors.postalCode }}
        </span>
      </div>

      <div class="field">
        <label>E-Mail</label>
        <input v-model="form.email" type="email" />
        <span v-if="errors.email" class="error">
          {{ errors.email }}
        </span>
      </div>

      <div class="field">
        <label>Telefon</label>
        <input v-model="form.phone" type="tel" />
        <span v-if="errors.phone" class="error">
          {{ errors.phone }}
        </span>
      </div>

      <button type="submit" :disabled="!isFormValid">Anfrage senden</button>
    </form>
    <div class="checkbox-field">
      <label>
        <input type="checkbox" v-model="form.privacyAccepted" />
        Ich habe die
        <a href="/datenschutz" target="_blank">Datenschutzerklärung</a>
        zur Kenntnis genommen.
      </label>

      <span v-if="errors.privacyAccepted" class="error">
        {{ errors.privacyAccepted }}
      </span>
    </div>

    <div class="checkbox-field">
      <label>
        <input type="checkbox" v-model="form.newsletterSingleOptIn" />
        Ja, ich möchte den Newsletter von Vamo erhalten.
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useLeadValidation } from "@/composables/useLeadValidation";

const isSubmitting = ref(false);
const submitSuccess = ref(false);
const submitError = ref("");
const form = reactive({
  salutation: "",
  firstName: "",
  lastName: "",
  postalCode: "",
  email: "",
  phone: "",
  privacyAccepted: false,
  newsletterSingleOptIn: false,
});
const { errors, isFormValid } = useLeadValidation(form);

const salutationOptions = [
  { label: "Herr", value: "MALE" },
  { label: "Frau", value: "FEMALE" },
  { label: "Divers", value: "DIVERS" },
];

async function submit() {
  if (!isFormValid.value) return;

  isSubmitting.value = true;
  submitError.value = "";

  const payload = {
    salutation: form.salutation,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    postalCode: form.postalCode.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    newsletterSingleOptIn: form.newsletterSingleOptIn,
  };
  console.log("Submitting lead:", payload);

  try {
    await fetch("http://localhost:3000/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    submitSuccess.value = true;
  } catch (err) {
    submitError.value = "Übermittlung fehlgeschlagen. Bitte erneut versuchen.";
  } finally {
    isSubmitting.value = false;
  }
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

.success {
  color: #2e7d32;
  margin-bottom: 16px;
}
.error {
  color: #b00020;
  font-size: 12px;
  margin-top: 4px;
}
.checkbox-field {
  margin-top: 16px;
  font-size: 14px;
}

.checkbox-field input {
  margin-right: 8px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.3;
}

.checkbox-label input {
  margin-top: 2px;
}
</style>
