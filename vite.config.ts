import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { havenBundle } from "mindoodb-app-sdk/vite";
import wasm from "vite-plugin-wasm";
import { defineConfig } from "vitest/config";

/**
 * `LOCAL_MINDOODB=1` (via `pnpm dev:local` / `build:local`) compiles the App SDK from a
 * sibling checkout instead of the published package, for developing against an
 * unreleased SDK. Without the flag everything resolves from the registry, which is what
 * CI and the Cloudflare build do.
 */
function createResolveAliases(): Record<string, string> {
  const aliases: Record<string, string> = {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
  };

  if (process.env.LOCAL_MINDOODB === "1") {
    aliases["mindoodb-app-sdk/testing"] = fileURLToPath(
      new URL("../mindoodb-app-sdk/src/testing/index.ts", import.meta.url),
    );
    aliases["mindoodb-app-sdk/vite"] = fileURLToPath(
      new URL("../mindoodb-app-sdk/src/vite/index.ts", import.meta.url),
    );
    aliases["mindoodb-app-sdk"] = fileURLToPath(
      new URL("../mindoodb-app-sdk/src/index.ts", import.meta.url),
    );
  }

  return aliases;
}

/**
 * `/__haven-test/` frames the app with a mock Haven (see `src/testHost/main.ts`). `vite dev`
 * serves it anyway; a build only includes it with `HAVEN_TEST_HOST=1`, for preview
 * deployments, so the production URL never exposes a mock-data page to end users.
 */
function createBuildInputs(): Record<string, string> {
  const inputs: Record<string, string> = {
    main: fileURLToPath(new URL("./index.html", import.meta.url)),
  };
  if (process.env.HAVEN_TEST_HOST === "1") {
    inputs.havenTest = fileURLToPath(new URL("./__haven-test/index.html", import.meta.url));
  }
  return inputs;
}

export default defineConfig({
  // Relative asset URLs so the same build works from this app's own origin and from
  // Haven's `/__mindoodb_hosted_apps__/<bundleId>/` prefix in hosted mode.
  base: "./",
  // `wasm()` is required because the SDK reaches Automerge, which ships as WebAssembly;
  // without it the `.wasm` import resolves to nothing and the first document operation
  // fails at runtime rather than at build time.
  //
  // `havenBundle()` writes haven-bundle.json + haven-bundle.zip into dist/ so Haven can
  // install this app as a hosted bundle. Harmless for an externally hosted app.
  plugins: [wasm(), vue(), havenBundle()],
  resolve: {
    alias: createResolveAliases(),
  },
  build: {
    rollupOptions: {
      input: createBuildInputs(),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 4300,
  },
  test: {
    environment: "jsdom",
  },
});
