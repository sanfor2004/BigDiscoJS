import { ChannelType, SlashCommandBuilder } from "discord.js";

export const commandDefinitions = [
  new SlashCommandBuilder().setName("ping").setDescription("Check whether BigDiscoJS is responding."),
  new SlashCommandBuilder().setName("status").setDescription("Show the bot's current Discord identity."),
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the optional local Ollama assistant a question.")
    .addStringOption((option) => option.setName("question").setDescription("Your question.").setRequired(true).setMaxLength(1000)),
  new SlashCommandBuilder().setName("server-info").setDescription("Show basic information about this server."),
  new SlashCommandBuilder()
    .setName("server-edit")
    .setDescription("Preview or update the server name or description.")
    .addStringOption((option) => option.setName("name").setDescription("New server name.").setMaxLength(100))
    .addStringOption((option) => option.setName("description").setDescription("New server description.").setMaxLength(120))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Apply the change instead of previewing it.")),
  new SlashCommandBuilder()
    .setName("server-setup")
    .setDescription("Preview or create the additive BigDisco baseline.")
    .addBooleanOption((option) => option.setName("confirm").setDescription("Create missing baseline items.")),
  new SlashCommandBuilder()
    .setName("channel-create")
    .setDescription("Create a text, voice, or category channel.")
    .addStringOption((option) => option.setName("name").setDescription("Channel name.").setRequired(true).setMaxLength(100))
    .addStringOption((option) => option.setName("type").setDescription("Channel type.").setRequired(true).addChoices({ name: "Text", value: "text" }, { name: "Voice", value: "voice" }, { name: "Category", value: "category" }))
    .addChannelOption((option) => option.setName("category").setDescription("Optional parent category.").addChannelTypes(ChannelType.GuildCategory))
    .addStringOption((option) => option.setName("topic").setDescription("Optional text-channel topic.").setMaxLength(1024)),
  new SlashCommandBuilder()
    .setName("channel-edit")
    .setDescription("Edit a channel's name, topic, slowmode, or NSFW setting.")
    .addChannelOption((option) => option.setName("channel").setDescription("Channel to edit.").setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildVoice, ChannelType.GuildCategory))
    .addStringOption((option) => option.setName("name").setDescription("New channel name.").setMaxLength(100))
    .addStringOption((option) => option.setName("topic").setDescription("New topic for text channels.").setMaxLength(1024))
    .addIntegerOption((option) => option.setName("slowmode").setDescription("Slowmode seconds for text channels.").setMinValue(0).setMaxValue(21600))
    .addBooleanOption((option) => option.setName("nsfw").setDescription("Set NSFW status.")),
  new SlashCommandBuilder()
    .setName("channel-delete")
    .setDescription("Delete a channel after explicit confirmation.")
    .addChannelOption((option) => option.setName("channel").setDescription("Channel to delete.").setRequired(true))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Confirm permanent deletion."))
    .addStringOption((option) => option.setName("reason").setDescription("Audit reason.").setMaxLength(500)),
  new SlashCommandBuilder()
    .setName("channel-lock")
    .setDescription("Lock a text channel after explicit confirmation.")
    .addChannelOption((option) => option.setName("channel").setDescription("Text channel to lock.").setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Confirm the lock."))
    .addStringOption((option) => option.setName("reason").setDescription("Audit reason.").setMaxLength(500)),
  new SlashCommandBuilder()
    .setName("channel-unlock")
    .setDescription("Unlock a text channel after explicit confirmation.")
    .addChannelOption((option) => option.setName("channel").setDescription("Text channel to unlock.").setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Confirm the unlock."))
    .addStringOption((option) => option.setName("reason").setDescription("Audit reason.").setMaxLength(500)),
  new SlashCommandBuilder()
    .setName("channel-access")
    .setDescription("Make a text channel public or private.")
    .addChannelOption((option) => option.setName("channel").setDescription("Text channel to update.").setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addStringOption((option) => option.setName("mode").setDescription("Access mode.").setRequired(true).addChoices({ name: "Public", value: "public" }, { name: "Private", value: "private" }))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Confirm the change."))
    .addStringOption((option) => option.setName("reason").setDescription("Audit reason.").setMaxLength(500)),
  new SlashCommandBuilder()
    .setName("role-create")
    .setDescription("Create a cosmetic or limited moderator role.")
    .addStringOption((option) => option.setName("name").setDescription("Role name.").setRequired(true).setMaxLength(100))
    .addStringOption((option) => option.setName("color").setDescription("Hex color such as #D8FF3E."))
    .addStringOption((option) => option.setName("profile").setDescription("Permission profile.").addChoices({ name: "Cosmetic", value: "cosmetic" }, { name: "Moderator", value: "moderator" })),
  new SlashCommandBuilder()
    .setName("create-role")
    .setDescription("Compatibility alias for /role-create.")
    .addStringOption((option) => option.setName("name").setDescription("Role name.").setRequired(true).setMaxLength(100))
    .addStringOption((option) => option.setName("color").setDescription("Hex color such as #D8FF3E."))
    .addStringOption((option) => option.setName("profile").setDescription("Permission profile.").addChoices({ name: "Cosmetic", value: "cosmetic" }, { name: "Moderator", value: "moderator" })),
  new SlashCommandBuilder()
    .setName("role-edit")
    .setDescription("Preview or edit a manageable role.")
    .addRoleOption((option) => option.setName("role").setDescription("Role to edit.").setRequired(true))
    .addStringOption((option) => option.setName("name").setDescription("New role name.").setMaxLength(100))
    .addStringOption((option) => option.setName("color").setDescription("New hex color."))
    .addStringOption((option) => option.setName("profile").setDescription("New permission profile.").addChoices({ name: "Cosmetic", value: "cosmetic" }, { name: "Moderator", value: "moderator" }))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Apply the edit.")),
  new SlashCommandBuilder()
    .setName("role-delete")
    .setDescription("Delete a role after explicit confirmation.")
    .addRoleOption((option) => option.setName("role").setDescription("Role to delete.").setRequired(true))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Confirm permanent deletion.")),
  new SlashCommandBuilder()
    .setName("role-add")
    .setDescription("Assign a manageable role to a member.")
    .addUserOption((option) => option.setName("user").setDescription("Member to update.").setRequired(true))
    .addRoleOption((option) => option.setName("role").setDescription("Role to assign.").setRequired(true)),
  new SlashCommandBuilder()
    .setName("role-remove")
    .setDescription("Remove a manageable role from a member.")
    .addUserOption((option) => option.setName("user").setDescription("Member to update.").setRequired(true))
    .addRoleOption((option) => option.setName("role").setDescription("Role to remove.").setRequired(true)),
  new SlashCommandBuilder()
    .setName("member-warn")
    .setDescription("Record an in-process warning for a member.")
    .addUserOption((option) => option.setName("user").setDescription("Member to warn.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Warning reason.").setRequired(true).setMaxLength(500)),
  new SlashCommandBuilder()
    .setName("member-timeout")
    .setDescription("Timeout a member after explicit confirmation.")
    .addUserOption((option) => option.setName("user").setDescription("Member to timeout.").setRequired(true))
    .addIntegerOption((option) => option.setName("minutes").setDescription("Timeout duration, 1 to 40320 minutes.").setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption((option) => option.setName("reason").setDescription("Timeout reason.").setRequired(true).setMaxLength(500))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Confirm the timeout.")),
  new SlashCommandBuilder()
    .setName("member-untimeout")
    .setDescription("Remove a member timeout.")
    .addUserOption((option) => option.setName("user").setDescription("Member to restore.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Audit reason.").setMaxLength(500)),
  new SlashCommandBuilder()
    .setName("member-kick")
    .setDescription("Kick a member after explicit confirmation.")
    .addUserOption((option) => option.setName("user").setDescription("Member to kick.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Kick reason.").setRequired(true).setMaxLength(500))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Confirm the kick.")),
  new SlashCommandBuilder()
    .setName("member-ban")
    .setDescription("Ban a member after explicit confirmation.")
    .addUserOption((option) => option.setName("user").setDescription("Member to ban.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Ban reason.").setRequired(true).setMaxLength(500))
    .addIntegerOption((option) => option.setName("delete_days").setDescription("Delete 0 to 7 days of messages.").setMinValue(0).setMaxValue(7))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Confirm the ban.")),
  new SlashCommandBuilder()
    .setName("member-unban")
    .setDescription("Unban a user after explicit confirmation.")
    .addStringOption((option) => option.setName("user_id").setDescription("User ID to unban.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Audit reason.").setMaxLength(500))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Confirm the unban.")),
  new SlashCommandBuilder()
    .setName("messages-purge")
    .setDescription("Delete up to 100 recent messages after confirmation.")
    .addIntegerOption((option) => option.setName("amount").setDescription("Messages to delete, 1 to 100.").setRequired(true).setMinValue(1).setMaxValue(100))
    .addChannelOption((option) => option.setName("channel").setDescription("Text channel; defaults to current channel.").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addStringOption((option) => option.setName("reason").setDescription("Audit reason.").setMaxLength(500))
    .addBooleanOption((option) => option.setName("confirm").setDescription("Confirm deletion.")),
  new SlashCommandBuilder().setName("audit-log").setDescription("Show recent BigDiscoJS administrative actions."),
];

export const commandPayloads = commandDefinitions.map((command) => command.toJSON());
