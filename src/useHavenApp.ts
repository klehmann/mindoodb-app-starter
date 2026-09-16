/**
 * The whole Haven integration for this app, in one place.
 *
 * A Haven app is an ordinary web page that talks to its host over a postMessage
 * bridge. There are only four moves, and they are all here:
 *
 * 1. `createMindooDBAppBridge()` then `await bridge.connect()` — the handshake.
 * 2. `await session.getLaunchContext()` — who the user is, which databases this app
 *    was granted, what theme the host is in.
 * 3. `await session.openDatabase(id)` — the `documents` / `attachments` API for one
 *    granted database.
 * 4. `session.onThemeChange(...)` — the host pushes light/dark changes; returns an
 *    unsubscribe function.
 *
 * What this app may do with a database is decided by Haven, not by this code. The
 * granted capabilities arrive on `launchContext.databases[].capabilities`, and the UI
 * should read them rather than assume (see `canWrite` below). Asking for more than
 * `haven-app.json` declares does not fail silently — it fails.
 */
import { computed, onBeforeUnmount, ref } from "vue";
import {
  createMindooDBAppBridge,
  type MindooDBAppDatabase,
  type MindooDBAppHostTheme,
  type MindooDBAppLaunchContext,
  type MindooDBAppSession,
} from "mindoodb-app-sdk";

/** The logical database id declared in `haven-app.json`. Keep the two in sync. */
export const MAIN_DATABASE_ID = "main";

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useHavenApp() {
  const session = ref<MindooDBAppSession | null>(null);
  const launchContext = ref<MindooDBAppLaunchContext | null>(null);
  const database = ref<MindooDBAppDatabase | null>(null);
  const theme = ref<MindooDBAppHostTheme>({ mode: "light", preset: "mindoo" });
  const connecting = ref(false);
  const error = ref<string | null>(null);

  let unsubscribeTheme: (() => void) | null = null;

  const connected = computed(() => session.value !== null);
  const userName = computed(() => launchContext.value?.user.username ?? "");
  const databaseInfos = computed(() => launchContext.value?.databases ?? []);
  const mainDatabaseInfo = computed(
    () => databaseInfos.value.find((info) => info.id === MAIN_DATABASE_ID) ?? null,
  );
  /** Haven grants capabilities per database; never assume, always check. */
  const canWrite = computed(
    () => mainDatabaseInfo.value?.capabilities.includes("create") === true,
  );

  /** Mirror the host theme onto the document so CSS can follow it. */
  function applyTheme(next: MindooDBAppHostTheme) {
    theme.value = next;
    document.documentElement.dataset.theme = next.mode;
  }

  async function connect() {
    connecting.value = true;
    error.value = null;
    try {
      const bridge = createMindooDBAppBridge();
      const nextSession = await bridge.connect();
      session.value = nextSession;

      const context = await nextSession.getLaunchContext();
      launchContext.value = context;
      applyTheme(context.theme);
      unsubscribeTheme = nextSession.onThemeChange(applyTheme);

      // Opening a database is optional for a welcome screen, but doing it here proves
      // the mapping in haven-app.json actually resolved.
      if (mainDatabaseInfo.value) {
        database.value = await nextSession.openDatabase(MAIN_DATABASE_ID);
      }
    } catch (connectError) {
      error.value = readErrorMessage(
        connectError,
        "Could not reach the Haven host. Open this app from Haven rather than directly in a browser tab.",
      );
    } finally {
      connecting.value = false;
    }
  }

  async function disconnect() {
    unsubscribeTheme?.();
    unsubscribeTheme = null;
    const current = session.value;
    session.value = null;
    database.value = null;
    if (!current) {
      return;
    }
    try {
      await current.disconnect();
    } catch {
      // Teardown is best-effort; the host drops the port either way.
    }
  }

  onBeforeUnmount(() => {
    void disconnect();
  });

  return {
    canWrite,
    connect,
    connected,
    connecting,
    database,
    databaseInfos,
    disconnect,
    error,
    launchContext,
    mainDatabaseInfo,
    theme,
    userName,
  };
}
