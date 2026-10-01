/**
 * Which build is running: version, commit and build time, so a user (or a bug report)
 * can tell which state they see. Values are stamped in by vite.config.ts; show them
 * somewhere unobtrusive, e.g. the footer of a settings dialog.
 */
export const BUILD_INFO = {
  version: __APP_VERSION__,
  commit: __GIT_SHA__,
  builtAt: __BUILD_TIMESTAMP__,
} as const;

/** "0.1.0 · 85a8d1d · 01.10.2026, 15:20" in the user's locale. */
export function formatBuildInfo(locale?: string): string {
  const builtAt = new Date(BUILD_INFO.builtAt);
  const when = Number.isNaN(builtAt.getTime())
    ? BUILD_INFO.builtAt
    : builtAt.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  return `${BUILD_INFO.version} · ${BUILD_INFO.commit} · ${when}`;
}
