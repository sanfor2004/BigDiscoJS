import {
  ChannelType,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type Client,
  type Guild,
} from "discord.js";

import type { LocalLlmConfig } from "./config.js";

interface OllamaResponse {
  readonly message?: { readonly content?: string };
}

export class LocalLlmService {
  public constructor(private readonly config: LocalLlmConfig) {}

  public async ensureChannels(client: Client<true>): Promise<void> {
    if (!this.config.enabled) return;

    for (const guild of client.guilds.cache.values()) {
      try {
        await this.ensureChannel(guild);
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        console.warn(`Could not prepare /ask channel in ${guild.name}: ${message}`);
      }
    }
  }

  public async handle(interaction: ChatInputCommandInteraction): Promise<boolean> {
    if (interaction.commandName !== "ask") return false;

    if (!this.config.enabled) {
      await this.reply(interaction, "Local AI is disabled. Set BIGDPP_LLM_ENABLED=true to enable /ask.");
      return true;
    }

    if (!interaction.inGuild() || !interaction.guild) {
      await this.reply(interaction, " /ask can only be used inside a server.");
      return true;
    }

    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    if (!channel || channel.name !== this.config.channelName) {
      await this.reply(interaction, `Use /ask in #${this.config.channelName}.`);
      return true;
    }

    const question = interaction.options.getString("question", true).trim();
    await interaction.deferReply();

    try {
      const response = await this.ask(question);
      await interaction.editReply({
        content: response.slice(0, 1900),
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The local AI request failed.";
      await interaction.editReply({ content: `Local AI unavailable: ${message}` });
    }
    return true;
  }

  private async ensureChannel(guild: Guild): Promise<void> {
    const existing = guild.channels.cache.find(
      (channel) => channel.type === ChannelType.GuildText && channel.name === this.config.channelName,
    );
    if (existing) return;

    const bot = guild.members.me ?? (await guild.members.fetchMe());
    if (!bot.permissions.has(PermissionFlagsBits.ManageChannels)) {
      throw new Error("BigDiscoJS needs Manage Channels to create the AI channel.");
    }

    await guild.channels.create({
      name: this.config.channelName,
      type: ChannelType.GuildText,
      reason: "Prepare the configured BigDiscoJS local AI channel",
    });
  }

  private async ask(question: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          stream: false,
          messages: [
            {
              role: "system",
              content: "You are BigDiscoJS's local Discord assistant. Answer helpfully and concisely. You cannot inspect Discord state, access credentials, or execute server-management actions.",
            },
            { role: "user", content: question },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
      const payload = (await response.json()) as OllamaResponse;
      const content = payload.message?.content?.trim();
      if (!content) throw new Error("Ollama returned an empty response.");
      return content;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("The local AI request timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private async reply(interaction: ChatInputCommandInteraction, content: string): Promise<void> {
    if (interaction.replied || interaction.deferred) await interaction.editReply({ content });
    else await interaction.reply({ content, ephemeral: true });
  }
}
