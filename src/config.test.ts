import { describe, expect, it } from "vitest";

import { ConfigurationError, loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("requires a real Discord token", () => {
    expect(() => loadConfig({})).toThrow(ConfigurationError);
    expect(() => loadConfig({ DISCORD_TOKEN: "replace-with-your-discord-bot-token" })).toThrow(
      "DISCORD_TOKEN is required",
    );
  });

  it("loads a token and optional development guild", () => {
    expect(loadConfig({ DISCORD_TOKEN: "test-token", DEVELOPMENT_GUILD_ID: "123456789012345678" })).toEqual({
      discordToken: "test-token",
      developmentGuildId: "123456789012345678",
      localLlm: {
        enabled: false,
        baseUrl: "http://127.0.0.1:11434",
        model: "llama3.2",
        channelName: "ai-agent",
      },
    });
  });

  it("loads loopback local LLM configuration", () => {
    expect(loadConfig({
      DISCORD_TOKEN: "test-token",
      BIGDPP_LLM_ENABLED: "true",
      BIGDPP_LLM_BASE_URL: "http://localhost:11434/",
      BIGDPP_LLM_MODEL: "qwen2.5",
      BIGDPP_AI_CHANNEL_NAME: "assistant",
    }).localLlm).toEqual({
      enabled: true,
      baseUrl: "http://localhost:11434",
      model: "qwen2.5",
      channelName: "assistant",
    });
  });

  it("rejects malformed development guild IDs", () => {
    expect(() =>
      loadConfig({ DISCORD_TOKEN: "test-token", DEVELOPMENT_GUILD_ID: "not-a-snowflake" }),
    ).toThrow("DEVELOPMENT_GUILD_ID");
  });

  it("rejects remote local-LLM endpoints", () => {
    expect(() => loadConfig({ DISCORD_TOKEN: "test-token", BIGDPP_LLM_BASE_URL: "https://example.com" })).toThrow(
      "loopback",
    );
  });
});
