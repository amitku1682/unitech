let hasLoggedStartupWarnings = false;

/**
 * Server-side startup check that logs a clear warning if any required environment
 * variables are missing or empty.
 * Strictly adheres to security requirements: NEVER logs the values of any variable.
 * Does NOT throw errors — the site must still start.
 */
export function logStartupEnvWarnings(): void {
  if (hasLoggedStartupWarnings) return;
  hasLoggedStartupWarnings = true;

  const required = [
    "DATABASE_URL",
    "SETTINGS_ENCRYPTION_KEY",
    "ADMIN_SESSION_SECRET",
    "APP_BASE_URL",
  ];

  const missing = required.filter((key) => {
    const val = process.env[key];
    return !val || val.trim() === "";
  });

  if (missing.length > 0) {
    console.warn(
      `[STARTUP WARNING] Missing or empty required environment variable(s): ${missing.join(
        ", "
      )}. The server will continue running, but functionality depending on these variables may be degraded or disabled.`
    );
  }
}
