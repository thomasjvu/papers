# Discord Integration

Complete guide for setting up Discord integration.

## Runtime Support

The admin/runtime path in this repo supports Discord bot authentication,
channels, commands, and auto-replies. Voice chat requires the dedicated
Discord.js runtime and is not available from the lightweight HTTP integration
runtime.

## Prerequisites

- Discord Developer Account
- Bot Application created

## Setup Steps

1. Create application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable bot features and get token
3. Configure intents (Message Content, Guild Messages)
4. Invite bot to your server

## Environment Variables

```env
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_APPLICATION_ID=your-app-id
```

## Next Steps

- [Discord Plugin Configuration](/docs/plugins/platforms/discord)
