<script setup lang="ts">
/**
 * Welcome screen for a fresh Haven app.
 *
 * Deliberately small: it proves the bridge works and shows what the host handed over,
 * so the first thing you build replaces this rather than digging it out.
 */
import { onMounted } from "vue";

import { useHavenApp } from "@/useHavenApp";

const app = useHavenApp();

onMounted(() => {
  void app.connect();
});
</script>

<template>
  <main class="app">
    <h1>{{ app.launchContext.value?.appId ?? "MindooDB App Starter" }}</h1>

    <p v-if="app.connecting.value" class="status">Connecting to Haven…</p>

    <p v-else-if="app.error.value" class="status status--error">{{ app.error.value }}</p>

    <template v-else-if="app.connected.value">
      <p class="status">
        Connected as <strong>{{ app.userName.value }}</strong>
      </p>

      <section>
        <h2>Databases this app was granted</h2>
        <ul v-if="app.databaseInfos.value.length > 0">
          <li v-for="info in app.databaseInfos.value" :key="info.id">
            <strong>{{ info.title }}</strong>
            <span class="detail">{{ info.id }} &middot; {{ info.capabilities.join(", ") }}</span>
          </li>
        </ul>
        <p v-else class="detail">
          None yet. Declare one in <code>haven-app.json</code> and reinstall the app.
        </p>
      </section>

      <p class="detail">
        Host theme: {{ app.theme.value.mode }} ({{ app.theme.value.preset }}). Writing is
        {{ app.canWrite.value ? "allowed" : "not granted" }}.
      </p>
    </template>

    <p class="detail">
      Next step: describe what this app should do in <code>TASK.md</code>, then let a
      coding agent implement it. <code>AGENTS.md</code> has the ground rules.
    </p>
  </main>
</template>

<style>
:root {
  color-scheme: light;
  --app-background: #f6f8fb;
  --app-surface: #ffffff;
  --app-text: #0d1b2a;
  --app-muted: #5a6b7d;
  --app-border: #dde4ec;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --app-background: #081325;
  --app-surface: #0f1e33;
  --app-text: #f6f8ff;
  --app-muted: #9fb0c4;
  --app-border: #1e3350;
}

body {
  margin: 0;
  background: var(--app-background);
  color: var(--app-text);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
</style>

<style scoped>
.app {
  max-width: 44rem;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
}

h2 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.status {
  margin: 0;
}

.status--error {
  color: #b42318;
}

section {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 0.6rem;
  padding: 1rem 1.25rem;
}

ul {
  margin: 0;
  padding-left: 1.1rem;
}

.detail {
  margin: 0;
  color: var(--app-muted);
  font-size: 0.85rem;
}

li .detail {
  display: block;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
}
</style>
