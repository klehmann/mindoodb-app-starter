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
  server: {
    host: "127.0.0.1",
    port: 4300,
  },
  test: {
    environment: "jsdom",
  },
});
