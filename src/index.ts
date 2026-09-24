import "dotenv/config";

import { startBot } from "./bot.js";
import { ConfigurationError, loadConfig } from "./config.js";

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const code = "code" in error ? ` [code=${String(error.code)}]` : "";
    return `${error.name}${error.message ? `: ${error.message}` : ""}${code}`;
  }

  return String(error);
}

try {
  const config = loadConfig(process.env);
  await startBot(config);
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error(`Configuration error: ${error.message}`);
  } else {
    console.error(`BigDiscoJS failed: ${describeError(error)}`);
  }

  process.exitCode = 1;
}
