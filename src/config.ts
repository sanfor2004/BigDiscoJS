export interface LocalLlmConfig {
  readonly enabled: boolean;
  readonly baseUrl: string;
  readonly model: string;
  readonly channelName: string;
}

export interface AppConfig {
  readonly discordToken: string;
  readonly developmentGuildId?: string;
  readonly localLlm: LocalLlmConfig;
}

export class ConfigurationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

function optionalSnowflake(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  if (!/^\d{16,20}$/.test(normalized)) {
    throw new ConfigurationError(
      "DEVELOPMENT_GUILD_ID must be a Discord snowflake containing only digits.",
    );
  }

  return normalized;
}

function optionalBoolean(value: string | undefined, name: string, fallback: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new ConfigurationError(`${name} must be true or false.`);
}

function loopbackUrl(value: string | undefined): string {
  const candidate = value?.trim() || "http://127.0.0.1:11434";
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new ConfigurationError("BIGDPP_LLM_BASE_URL must be a valid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ConfigurationError("BIGDPP_LLM_BASE_URL must use HTTP or HTTPS.");
  }

  const allowedHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
  if (!allowedHosts.has(parsed.hostname)) {
    throw new ConfigurationError("BIGDPP_LLM_BASE_URL must point to a loopback host.");
  }

  return candidate.replace(/\/$/, "");
}

export function loadConfig(environment: NodeJS.ProcessEnv): AppConfig {
  const discordToken = environment.DISCORD_TOKEN?.trim();

  if (!discordToken || discordToken === "replace-with-your-discord-bot-token") {
    throw new ConfigurationError(
      "DISCORD_TOKEN is required. Copy .env.example to .env and set your Discord bot token.",
    );
  }

  const developmentGuildId = optionalSnowflake(environment.DEVELOPMENT_GUILD_ID);
  const localLlm: LocalLlmConfig = {
    enabled: optionalBoolean(environment.BIGDPP_LLM_ENABLED, "BIGDPP_LLM_ENABLED", false),
    baseUrl: loopbackUrl(environment.BIGDPP_LLM_BASE_URL),
    model: environment.BIGDPP_LLM_MODEL?.trim() || "llama3.2",
    channelName: environment.BIGDPP_AI_CHANNEL_NAME?.trim() || "ai-agent",
  };

  return developmentGuildId === undefined
    ? { discordToken, localLlm }
    : { discordToken, developmentGuildId, localLlm };
}
