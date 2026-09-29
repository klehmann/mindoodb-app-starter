/**
 * The app's test URL, `/__haven-test/`: the real app in an iframe, launched by a mock
 * Haven with seeded data and a control panel. Use it for Playwright and for clicking
 * through the app without installing it in a real Haven.
 *
 * It is built only for `pnpm dev` and when `HAVEN_TEST_HOST=1` is set (preview
 * deployments), never for the production deploy — the public URL shows the landing page.
 */
import type { MindooDBAppDefinition } from "mindoodb-app-sdk";
import { mockDatabasesFromDefinition, mountHavenTestHost } from "mindoodb-app-sdk/testing";

import { seedDocuments } from "@/testHost/seed";

async function start() {
  const response = await fetch(new URL("../haven-app.json", window.location.href));
  const definition = (await response.json()) as MindooDBAppDefinition;

  mountHavenTestHost({
    appUrl: "../",
    title: definition.label,
    launchContext: { appId: definition.appId },
    databases: mockDatabasesFromDefinition(definition, seedDocuments),
  });
}

void start();
