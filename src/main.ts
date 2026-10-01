import { isLaunchedByHaven, renderHavenAppLandingPage } from "mindoodb-app-sdk";
import { createApp } from "vue";

import App from "@/App.vue";
import { formatBuildInfo } from "@/buildInfo";

console.info(`[app] build ${formatBuildInfo()}`);

// Opened from Haven: run the app. Opened directly (a shared link, a bookmark): there is
// no host to talk to, so show what the app is and a button that installs it in Haven.
if (isLaunchedByHaven()) {
  createApp(App).mount("#app");
} else {
  void renderHavenAppLandingPage();
}
