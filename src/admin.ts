import {
  ChannelType,
  PermissionFlagsBits,
  PermissionsBitField,
  type CategoryChannel,
  type ChatInputCommandInteraction,
  type GuildBasedChannel,
  type GuildChannel,
  type GuildMember,
  type Role,
  type TextChannel,
  type VoiceChannel,
} from "discord.js";

const ADMIN_COMMANDS = new Set([
  "server-info", "server-edit", "server-setup", "channel-create", "channel-edit",
  "channel-delete", "channel-lock", "channel-unlock", "channel-access", "role-create",
  "role-edit", "role-delete", "create-role", "role-add", "role-remove", "member-warn", "member-timeout",
  "member-untimeout", "member-kick", "member-ban", "member-unban", "messages-purge", "audit-log",
]);

const CONFIRM_REQUIRED = new Set([
  "server-edit", "server-setup", "channel-delete", "channel-lock", "channel-unlock",
  "channel-access", "role-edit", "role-delete", "member-timeout", "member-kick", "member-ban",
  "member-unban", "messages-purge",
]);

type EditableChannel = TextChannel | VoiceChannel | CategoryChannel;

interface AuditEntry {
  readonly action: string;
  readonly actor: string;
  readonly result: string;
  readonly timestamp: number;
}

function isEditableChannel(channel: GuildBasedChannel | null): channel is EditableChannel {
  return channel?.type === ChannelType.GuildText || channel?.type === ChannelType.GuildAnnouncement ||
    channel?.type === ChannelType.GuildVoice || channel?.type === ChannelType.GuildCategory;
}

export function parseColor(value: string | null): number | undefined {
  if (!value) return undefined;
  const normalized = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error("Color must be six hexadecimal digits, for example #D8FF3E.");
  }
  return Number.parseInt(normalized, 16);
}

export class AdminService {
  private readonly auditEntries: AuditEntry[] = [];

  public async handle(interaction: ChatInputCommandInteraction): Promise<boolean> {
    if (!ADMIN_COMMANDS.has(interaction.commandName)) return false;
    if (!interaction.inGuild() || !interaction.guild) {
      await this.reply(interaction, "This command can only be used inside a server.");
      return true;
    }
    if (!this.isAuthorized(interaction)) {
      await this.reply(interaction, "Only the server owner or a member with Administrator can use this command.");
      return true;
    }

    try {
      await this.dispatch(interaction);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The operation failed.";
      this.record(interaction, interaction.commandName, `failed: ${message}`);
      await this.reply(interaction, `Operation failed safely: ${message}`);
    }
    return true;
  }

  private isAuthorized(interaction: ChatInputCommandInteraction): boolean {
    const guild = interaction.guild;
    return guild !== null && (guild.ownerId === interaction.user.id ||
      (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false));
  }

  private async dispatch(interaction: ChatInputCommandInteraction): Promise<void> {
    switch (interaction.commandName) {
      case "server-info": await this.serverInfo(interaction); return;
      case "server-edit": await this.serverEdit(interaction); return;
      case "server-setup": await this.serverSetup(interaction); return;
      case "channel-create": await this.channelCreate(interaction); return;
      case "channel-edit": await this.channelEdit(interaction); return;
      case "channel-delete": await this.channelDelete(interaction); return;
      case "channel-lock": await this.channelLock(interaction, true); return;
      case "channel-unlock": await this.channelLock(interaction, false); return;
      case "channel-access": await this.channelAccess(interaction); return;
      case "role-create":
      case "create-role": await this.roleCreate(interaction); return;
      case "role-edit": await this.roleEdit(interaction); return;
      case "role-delete": await this.roleDelete(interaction); return;
      case "role-add": await this.roleMember(interaction, true); return;
      case "role-remove": await this.roleMember(interaction, false); return;
      case "member-warn": await this.memberWarn(interaction); return;
      case "member-timeout": await this.memberTimeout(interaction, true); return;
      case "member-untimeout": await this.memberTimeout(interaction, false); return;
      case "member-kick": await this.memberKick(interaction); return;
      case "member-ban": await this.memberBan(interaction, true); return;
      case "member-unban": await this.memberBan(interaction, false); return;
      case "messages-purge": await this.messagesPurge(interaction); return;
      case "audit-log": await this.auditLog(interaction); return;
      default: return;
    }
  }

  private async botMember(interaction: ChatInputCommandInteraction): Promise<GuildMember> {
    if (!interaction.guild) throw new Error("This command requires a server.");
    return interaction.guild.members.me ?? interaction.guild.members.fetchMe();
  }

  private async requirePermission(interaction: ChatInputCommandInteraction, permission: bigint): Promise<GuildMember> {
    const bot = await this.botMember(interaction);
    if (!bot.permissions.has(permission)) {
      const names = new PermissionsBitField(permission).toArray().join(", ");
      throw new Error(`BigDiscoJS needs the ${names} permission.`);
    }
    return bot;
  }

  private async actor(interaction: ChatInputCommandInteraction): Promise<GuildMember> {
    if (!interaction.guild) throw new Error("This command requires a server.");
    return interaction.guild.members.cache.get(interaction.user.id) ??
      interaction.guild.members.fetch(interaction.user.id);
  }

  private resolveChannel(interaction: ChatInputCommandInteraction, name: string): GuildBasedChannel {
    const option = interaction.options.getChannel(name, true);
    const channel = interaction.guild?.channels.cache.get(option.id);
    if (!channel) throw new Error("That channel is not available in this server.");
    return channel;
  }

  private resolveOptionalChannel(interaction: ChatInputCommandInteraction, name: string): GuildBasedChannel | null {
    const option = interaction.options.getChannel(name);
    if (!option) return null;
    const channel = interaction.guild?.channels.cache.get(option.id);
    if (!channel) throw new Error("That channel is not available in this server.");
    return channel;
  }

  private resolveRole(interaction: ChatInputCommandInteraction, name: string): Role {
    const option = interaction.options.getRole(name, true);
    const role = interaction.guild?.roles.resolve(option.id);
    if (!role) throw new Error("That role is not available in this server.");
    return role;
  }

  private async manageableMember(interaction: ChatInputCommandInteraction, userId: string): Promise<GuildMember> {
    if (!interaction.guild) throw new Error("This command requires a server.");
    const target = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!target) throw new Error("That user is not a member of this server.");
    const bot = await this.botMember(interaction);
    const caller = await this.actor(interaction);
    if (target.id === interaction.guild.ownerId || target.id === bot.id) throw new Error("That member cannot be managed.");
    if (bot.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
      throw new Error("BigDiscoJS's highest role must be above the target member.");
    }
    if (caller.id !== interaction.guild.ownerId && caller.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
      throw new Error("Your highest role must be above the target member.");
    }
    return target;
  }

  private async manageableRole(interaction: ChatInputCommandInteraction, role: Role): Promise<void> {
    if (!interaction.guild) throw new Error("This command requires a server.");
    if (role.managed || role.id === interaction.guild.id) throw new Error("That role is managed or is @everyone.");
    const bot = await this.requirePermission(interaction, PermissionFlagsBits.ManageRoles);
    const caller = await this.actor(interaction);
    if (bot.roles.highest.comparePositionTo(role) <= 0) throw new Error("BigDiscoJS's highest role must be above the target role.");
    if (caller.id !== interaction.guild.ownerId && caller.roles.highest.comparePositionTo(role) <= 0) {
      throw new Error("Your highest role must be above the target role.");
    }
  }

  private confirmed(interaction: ChatInputCommandInteraction): boolean {
    return !CONFIRM_REQUIRED.has(interaction.commandName) || interaction.options.getBoolean("confirm") === true;
  }

  private reason(interaction: ChatInputCommandInteraction): string {
    return interaction.options.getString("reason") ?? `BigDiscoJS action by ${interaction.user.tag}`;
  }

  private record(interaction: ChatInputCommandInteraction, action: string, result: string): void {
    this.auditEntries.push({ action, actor: interaction.user.tag, result, timestamp: Date.now() });
    if (this.auditEntries.length > 100) this.auditEntries.shift();
    console.log(`[audit] ${action} by ${interaction.user.tag}: ${result}`);
  }

  private async reply(interaction: ChatInputCommandInteraction, content: string): Promise<void> {
    const safeContent = content.slice(0, 1900);
    if (interaction.replied || interaction.deferred) await interaction.editReply({ content: safeContent });
    else await interaction.reply({ content: safeContent, ephemeral: true });
  }

  private async serverInfo(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild!;
    await this.reply(interaction, [
      `**${guild.name}**`, `ID: ${guild.id}`, `Owner: <@${guild.ownerId}>`,
      `Members: ${guild.memberCount ?? "unknown"}`, `Channels: ${guild.channels.cache.size}`,
      `Roles: ${guild.roles.cache.size}`,
    ].join("\n"));
  }

  private async serverEdit(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild!;
    await this.requirePermission(interaction, PermissionFlagsBits.ManageGuild);
    const name = interaction.options.getString("name");
    const description = interaction.options.getString("description");
    if (!name && description === null) throw new Error("Provide a name or description.");
    const preview = `name=${name ?? guild.name}; description=${description ?? guild.description ?? "(empty)"}`;
    if (!this.confirmed(interaction)) {
      await this.reply(interaction, `Preview: update server ${preview}. Re-run with confirm:true to apply.`);
      return;
    }
    const changes: { name?: string; description?: string; reason?: string } = { reason: this.reason(interaction) };
    if (name) changes.name = name;
    if (description !== null) changes.description = description;
    await guild.edit(changes);
    this.record(interaction, "server-edit", preview);
    await this.reply(interaction, `Updated server: ${preview}.`);
  }

  private async serverSetup(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild!;
    const bot = await this.requirePermission(interaction, PermissionFlagsBits.ManageChannels);
    await this.requirePermission(interaction, PermissionFlagsBits.ManageRoles);
    const categories = ["INFORMATION", "COMMUNITY", "STAFF"];
    const channels = ["welcome", "rules", "general", "ai-agent", "mod-log"];
    const roles = ["Server Owner", "Administrator", "Moderator", "Member", "AI User"];
    const missing = [
      ...categories.filter((name) => !guild.channels.cache.some((channel) => channel.type === ChannelType.GuildCategory && channel.name === name)),
      ...channels.filter((name) => !guild.channels.cache.some((channel) => channel.name === name)),
      ...roles.filter((name) => !guild.roles.cache.some((role) => role.name === name)),
    ];
    if (!this.confirmed(interaction)) {
      await this.reply(interaction, missing.length ? `Preview: create ${missing.join(", ")}. Re-run with confirm:true.` : "Baseline is already complete.");
      return;
    }

    const categoryMap = new Map<string, CategoryChannel>();
    for (const name of categories) {
      const existing = guild.channels.cache.find((channel) => channel.type === ChannelType.GuildCategory && channel.name === name) as CategoryChannel | undefined;
      categoryMap.set(name, existing ?? await guild.channels.create({ name, type: ChannelType.GuildCategory }));
    }
    const information = categoryMap.get("INFORMATION")!;
    const community = categoryMap.get("COMMUNITY")!;
    const staff = categoryMap.get("STAFF")!;
    const channelParents = new Map([["welcome", information], ["rules", information], ["general", community], ["ai-agent", community], ["mod-log", staff]]);
    for (const [name, parent] of channelParents) {
      if (guild.channels.cache.some((channel) => channel.name === name)) continue;
      const permissionOverwrites = name === "mod-log" ? [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: bot.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ] : undefined;
      if (permissionOverwrites) {
        await guild.channels.create({ name, type: ChannelType.GuildText, parent, permissionOverwrites });
      } else {
        await guild.channels.create({ name, type: ChannelType.GuildText, parent });
      }
    }
    for (const name of roles) {
      if (!guild.roles.cache.some((role) => role.name === name)) {
        await guild.roles.create({ name, permissions: [], reason: this.reason(interaction) });
      }
    }
    this.record(interaction, "server-setup", `created ${missing.length} missing baseline items`);
    await this.reply(interaction, `Baseline setup complete. Created ${missing.length} missing items.`);
  }

  private async channelCreate(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild!;
    await this.requirePermission(interaction, PermissionFlagsBits.ManageChannels);
    const name = interaction.options.getString("name", true);
    const type = interaction.options.getString("type", true);
    const category = this.resolveOptionalChannel(interaction, "category");
    const topic = interaction.options.getString("topic");
    if (category && category.type !== ChannelType.GuildCategory) throw new Error("Parent must be a category.");
    const parent = category?.id;
    const channel = type === "category"
      ? await guild.channels.create({ name, type: ChannelType.GuildCategory })
      : type === "voice"
        ? await guild.channels.create({ name, type: ChannelType.GuildVoice, ...(parent ? { parent } : {}) })
        : await guild.channels.create({ name, type: ChannelType.GuildText, ...(parent ? { parent } : {}), ...(topic ? { topic } : {}) });
    this.record(interaction, "channel-create", channel.name);
    await this.reply(interaction, `Created ${channel}.`);
  }

  private async channelEdit(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.requirePermission(interaction, PermissionFlagsBits.ManageChannels);
    const channel = this.resolveChannel(interaction, "channel");
    if (!isEditableChannel(channel)) throw new Error("That channel type is not supported.");
    const name = interaction.options.getString("name");
    const topic = interaction.options.getString("topic");
    const slowmode = interaction.options.getInteger("slowmode");
    const nsfw = interaction.options.getBoolean("nsfw");
    if (!name && topic === null && slowmode === null && nsfw === null) throw new Error("Provide at least one channel change.");
    const changes: Parameters<GuildChannel["edit"]>[0] = { reason: this.reason(interaction) };
    if (name) changes.name = name;
    if (topic !== null) changes.topic = topic;
    if (slowmode !== null) changes.rateLimitPerUser = slowmode;
    if (nsfw !== null) changes.nsfw = nsfw;
    await channel.edit(changes);
    this.record(interaction, "channel-edit", `${channel.name} updated`);
    await this.reply(interaction, `Updated ${channel}.`);
  }

  private async channelDelete(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.requirePermission(interaction, PermissionFlagsBits.ManageChannels);
    const channel = this.resolveChannel(interaction, "channel");
    if (!this.confirmed(interaction)) {
      await this.reply(interaction, `Preview: delete ${channel}. Re-run with confirm:true to apply.`);
      return;
    }
    await channel.delete(this.reason(interaction));
    this.record(interaction, "channel-delete", channel.name);
    await this.reply(interaction, `Deleted channel #${channel.name}.`);
  }

  private async channelLock(interaction: ChatInputCommandInteraction, lock: boolean): Promise<void> {
    await this.requirePermission(interaction, PermissionFlagsBits.ManageChannels);
    const channel = this.resolveChannel(interaction, "channel");
    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) throw new Error("That channel is not a text channel.");
    if (!this.confirmed(interaction)) {
      await this.reply(interaction, `Preview: ${lock ? "lock" : "unlock"} ${channel}. Re-run with confirm:true.`);
      return;
    }
    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: lock ? false : null }, { reason: this.reason(interaction) });
    this.record(interaction, lock ? "channel-lock" : "channel-unlock", channel.name);
    await this.reply(interaction, `${lock ? "Locked" : "Unlocked"} ${channel}.`);
  }

  private async channelAccess(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.requirePermission(interaction, PermissionFlagsBits.ManageChannels);
    const channel = this.resolveChannel(interaction, "channel");
    const mode = interaction.options.getString("mode", true);
    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) throw new Error("That channel is not a text channel.");
    if (!this.confirmed(interaction)) {
      await this.reply(interaction, `Preview: make ${channel} ${mode}. Re-run with confirm:true.`);
      return;
    }
    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { ViewChannel: mode === "private" ? false : null }, { reason: this.reason(interaction) });
    this.record(interaction, "channel-access", `${channel.name}: ${mode}`);
    await this.reply(interaction, `Channel ${channel} is now ${mode}.`);
  }

  private async roleCreate(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.requirePermission(interaction, PermissionFlagsBits.ManageRoles);
    const name = interaction.options.getString("name", true);
    const color = parseColor(interaction.options.getString("color"));
    const profile = interaction.options.getString("profile") ?? "cosmetic";
    const role = await interaction.guild!.roles.create({
      name,
      ...(color === undefined ? {} : { color }),
      permissions: profile === "moderator" ? [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ModerateMembers] : [],
      reason: this.reason(interaction),
    });
    this.record(interaction, "role-create", role.name);
    await this.reply(interaction, `Created ${role}.`);
  }

  private async roleEdit(interaction: ChatInputCommandInteraction): Promise<void> {
    const role = this.resolveRole(interaction, "role");
    await this.manageableRole(interaction, role);
    const name = interaction.options.getString("name");
    const color = parseColor(interaction.options.getString("color"));
    const profile = interaction.options.getString("profile");
    if (!name && color === undefined && !profile) throw new Error("Provide at least one role change.");
    const preview = `role=${role.name}${name ? `; name=${name}` : ""}${color === undefined ? "" : `; color=#${color.toString(16).padStart(6, "0")}`}${profile ? `; profile=${profile}` : ""}`;
    if (!this.confirmed(interaction)) {
      await this.reply(interaction, `Preview: ${preview}. Re-run with confirm:true to apply.`);
      return;
    }
    await role.edit({
      ...(name ? { name } : {}),
      ...(color === undefined ? {} : { color }),
      ...(profile ? { permissions: profile === "moderator" ? [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ModerateMembers] : [] } : {}),
      reason: this.reason(interaction),
    });
    this.record(interaction, "role-edit", preview);
    await this.reply(interaction, `Updated ${role}.`);
  }

  private async roleDelete(interaction: ChatInputCommandInteraction): Promise<void> {
    const role = this.resolveRole(interaction, "role");
    await this.manageableRole(interaction, role);
    if (!this.confirmed(interaction)) {
      await this.reply(interaction, `Preview: delete ${role}. Re-run with confirm:true.`);
      return;
    }
    await role.delete(this.reason(interaction));
    this.record(interaction, "role-delete", role.name);
    await this.reply(interaction, `Deleted role ${role.name}.`);
  }

  private async roleMember(interaction: ChatInputCommandInteraction, add: boolean): Promise<void> {
    const role = this.resolveRole(interaction, "role");
    await this.manageableRole(interaction, role);
    const member = await this.manageableMember(interaction, interaction.options.getUser("user", true).id);
    if (add) await member.roles.add(role, this.reason(interaction));
    else await member.roles.remove(role, this.reason(interaction));
    this.record(interaction, add ? "role-add" : "role-remove", `${role.name} -> ${member.user.tag}`);
    await this.reply(interaction, `${add ? "Added" : "Removed"} ${role} ${add ? "to" : "from"} ${member}.`);
  }

  private async memberWarn(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.requirePermission(interaction, PermissionFlagsBits.ModerateMembers);
    const member = await this.manageableMember(interaction, interaction.options.getUser("user", true).id);
    const reason = interaction.options.getString("reason", true);
    this.record(interaction, "member-warn", `${member.user.tag}: ${reason}`);
    await this.reply(interaction, `Warning recorded for ${member.user.tag}. Durable warning storage is not enabled yet.`);
  }

  private async memberTimeout(interaction: ChatInputCommandInteraction, timeout: boolean): Promise<void> {
    await this.requirePermission(interaction, PermissionFlagsBits.ModerateMembers);
    const member = await this.manageableMember(interaction, interaction.options.getUser("user", true).id);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    if (!timeout) {
      await member.timeout(null, reason);
      this.record(interaction, "member-untimeout", member.user.tag);
      await this.reply(interaction, `Removed timeout from ${member.user.tag}.`);
      return;
    }
    const minutes = interaction.options.getInteger("minutes", true);
    if (!this.confirmed(interaction)) {
      await this.reply(interaction, `Preview: timeout ${member.user.tag} for ${minutes} minutes. Re-run with confirm:true.`);
      return;
    }
    await member.timeout(minutes * 60 * 1000, reason);
    this.record(interaction, "member-timeout", `${member.user.tag}: ${minutes} minutes`);
    await this.reply(interaction, `Timed out ${member.user.tag} for ${minutes} minutes.`);
  }

  private async memberKick(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.requirePermission(interaction, PermissionFlagsBits.KickMembers);
    const member = await this.manageableMember(interaction, interaction.options.getUser("user", true).id);
    const reason = interaction.options.getString("reason", true);
    if (!this.confirmed(interaction)) {
      await this.reply(interaction, `Preview: kick ${member.user.tag}. Re-run with confirm:true.`);
      return;
    }
    await member.kick(reason);
    this.record(interaction, "member-kick", member.user.tag);
    await this.reply(interaction, `Kicked ${member.user.tag}.`);
  }

  private async memberBan(interaction: ChatInputCommandInteraction, ban: boolean): Promise<void> {
    await this.requirePermission(interaction, PermissionFlagsBits.BanMembers);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const user = interaction.options.getUser("user");
    const userId = ban ? user?.id : interaction.options.getString("user_id", true);
    if (!userId) throw new Error("A user is required.");
    if (ban) {
      const member = await this.manageableMember(interaction, userId);
      if (!this.confirmed(interaction)) {
        await this.reply(interaction, `Preview: ban ${member.user.tag}. Re-run with confirm:true.`);
        return;
      }
      const deleteDays = interaction.options.getInteger("delete_days") ?? 0;
      await member.ban({ deleteMessageSeconds: deleteDays * 86400, reason });
      this.record(interaction, "member-ban", `${member.user.tag}; delete_days=${deleteDays}`);
      await this.reply(interaction, `Banned ${member.user.tag}.`);
    } else {
      if (!/^\d{16,20}$/.test(userId)) throw new Error("user_id must be a Discord snowflake.");
      if (!this.confirmed(interaction)) {
        await this.reply(interaction, `Preview: unban user ${userId}. Re-run with confirm:true.`);
        return;
      }
      await interaction.guild!.members.unban(userId, reason);
      this.record(interaction, "member-unban", userId);
      await this.reply(interaction, `Unbanned user ${userId}.`);
    }
  }

  private async messagesPurge(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.requirePermission(interaction, PermissionFlagsBits.ManageMessages);
    const target = this.resolveOptionalChannel(interaction, "channel") ?? interaction.channel;
    if (!target || (target.type !== ChannelType.GuildText && target.type !== ChannelType.GuildAnnouncement)) throw new Error("Purge requires a text channel.");
    const amount = interaction.options.getInteger("amount", true);
    if (!this.confirmed(interaction)) {
      await this.reply(interaction, `Preview: delete up to ${amount} messages in ${target}. Re-run with confirm:true.`);
      return;
    }
    const deleted = await target.bulkDelete(amount, true);
    this.record(interaction, "messages-purge", `${deleted.size} messages in ${target.name}`);
    await this.reply(interaction, `Deleted ${deleted.size} recent messages in ${target}.`);
  }

  private async auditLog(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.auditEntries.length) {
      await this.reply(interaction, "No BigDiscoJS administrative actions have been recorded in this process yet.");
      return;
    }
    const lines = this.auditEntries.slice(-10).reverse().map((entry) =>
      `<t:${Math.floor(entry.timestamp / 1000)}:R> — **${entry.action}** by ${entry.actor}: ${entry.result}`,
    );
    await this.reply(interaction, lines.join("\n"));
  }
}

export { ADMIN_COMMANDS };
