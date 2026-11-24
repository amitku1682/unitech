export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logStartupEnvWarnings } = await import("@/lib/server/startupCheck");
    logStartupEnvWarnings();
  }
}
