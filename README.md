# BigDiscoJS

![BigDiscoJS lemon-green banner](branding/bigdiscojs-banner.png)

JavaScript/TypeScript Discord operations bot for the next iteration of the
BigDisco project. The repository was initialized from the
`sanfor2004/BigDiscoJS` GitHub repository.

## BigDPP reference

The legacy C++ Discord operations bot is documented here as a behavioral and
safety reference:

- [Reusable BigDPP implementation prompt](BIGDPP_PROMPT.md)
- [BigDPP project brief](BIGDPP_PROJECT_BRIEF.md)

The prompt preserves the source project's current capabilities, architecture
boundaries, security rules, tests, and roadmap without claiming that planned
features are already implemented in this JavaScript workspace.

## Brand direction

BigDiscoJS uses a lemon-green visual identity: bright citrus green, deep green
contrast, and near-black surfaces for a technical but energetic feel. The
branding assets are intentionally separate from the legacy BigDPP assets.

## Local development

Requirements:

- Node.js 20 or newer
- A Discord application and bot token

Install dependencies with PowerShell's executable npm shim:

```powershell
npm.cmd install
```

Create local configuration:

```powershell
Copy-Item .env.example .env
```

Set `DISCORD_TOKEN`. Set `DEVELOPMENT_GUILD_ID` while developing so slash
commands register immediately in one guild; leave it empty for global
registration. To enable `/ask`, install Ollama locally, pull the configured
model, and set `BIGDPP_LLM_ENABLED=true`. The AI endpoint must remain on the
loopback host.

Run the type checker, tests, and development bot:

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run build
npm.cmd start
npm.cmd run dev
```

Use `npm.cmd start` after building for the compiled runtime, or use
`npm.cmd run dev` for watch mode during development. The current runnable
foundation requests only the `Guilds` intent and registers 26 commands on the
ready event. Never commit `.env` or expose the bot token in logs.

## Available slash commands

Foundation:

- `/ping`, `/status`, and `/ask question:<text>`

Server:

- `/server-info`, `/server-edit`, `/server-setup`

Channels:

- `/channel-create`, `/channel-edit`, `/channel-delete`
- `/channel-lock`, `/channel-unlock`, `/channel-access`

Roles:

- `/role-create` (also available as `/create-role`), `/role-edit`, `/role-delete`
- `/role-add`, `/role-remove`

Members and moderation:

- `/member-warn`, `/member-timeout`, `/member-untimeout`
- `/member-kick`, `/member-ban`, `/member-unban`
- `/messages-purge`, `/audit-log`

Administrative commands require the server owner or Discord Administrator.
Each mutation checks the bot's required permission and role hierarchy. Deleting,
locking, access changes, moderation actions, and purges show a preview first and
require `confirm:true`. Warning and audit entries are currently process-memory
only; durable storage is planned. `/ask` sends only the question to local
Ollama and cannot inspect Discord state or execute administrative actions.
