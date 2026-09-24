import {
  Client,
  Events,
  GatewayIntentBits,
  type ChatInputCommandInteraction,
} from "discord.js";

import type { AppConfig } from "./config.js";
import { AdminService } from "./admin.js";
import { commandPayloads } from "./commands.js";
import { LocalLlmService } from "./llm.js";

async function registerCommands(client: Client, config: AppConfig): Promise<void> {
  if (!client.application) {
    throw new Error("Discord application is not available after the ready event.");
  }

  if (config.developmentGuildId) {
    await client.application.commands.set(commandPayloads, config.developmentGuildId);
  } else {
    await client.application.commands.set(commandPayloads);
  }

  const scope = config.developmentGuildId
    ? `development guild ${config.developmentGuildId}`
    : "globally";
  console.log(`Registered ${commandPayloads.length} slash commands ${scope}.`);
}

async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  switch (interaction.commandName) {
    case "ping":
      await interaction.reply("Pong!");
      return;
    case "status":
      await interaction.reply(`Online as ${interaction.client.user.username}.`);
      return;
    default:
      await interaction.reply({ content: "Unknown command.", ephemeral: true });
  }
}

export function createClient(): Client {
  return new Client({ intents: [GatewayIntentBits.Guilds] });
}

export async function startBot(config: AppConfig): Promise<Client> {
  const client = createClient();
  const adminService = new AdminService();
  const localLlmService = new LocalLlmService(config.localLlm);

  client.once(Events.ClientReady, async (readyClient) => {
    try {
      await registerCommands(readyClient, config);
      await localLlmService.ensureChannels(readyClient);
      console.log(`BigDiscoJS is online as ${readyClient.user.tag}.`);
    } catch (error) {
      console.error("Command registration failed.", error);
      process.exitCode = 1;
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    try {
      if (await localLlmService.handle(interaction)) {
        return;
      }

      if (await adminService.handle(interaction)) {
        return;
      }

      await handleCommand(interaction);
    } catch (error) {
      console.error(`Command ${interaction.commandName} failed.`, error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "The command failed safely.", ephemeral: true });
      } else {
        await interaction.reply({ content: "The command failed safely.", ephemeral: true });
      }
    }
  });

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void client.destroy();
      console.log(`BigDiscoJS stopped after ${signal}.`);
    });
  }

  await client.login(config.discordToken);
  return client;
}
