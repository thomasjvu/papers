# Twitch Integration Setup Guide

This guide will walk you through setting up the Twitch integration for your Phantasy Agent. No coding required!

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a Twitch Application](#creating-a-twitch-application)
3. [Generating OAuth Tokens](#generating-oauth-tokens)
4. [Configuring Your Agent](#configuring-your-agent)
5. [Starting the Twitch Bot](#starting-the-twitch-bot)
6. [Testing Your Setup](#testing-your-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:

- ✅ A Twitch account (free to create at [twitch.tv](https://twitch.tv))
- ✅ Access to your Phantasy Agent Admin UI
- ✅ Your Twitch channel name (your username in lowercase)

**Time Required**: ~15 minutes

---

## Creating a Twitch Application

### Step 1: Access Twitch Developer Console

1. Go to [dev.twitch.tv](https://dev.twitch.tv)
2. Click **"Log in with Twitch"** in the top right corner
3. Log in with your Twitch account

Use the Twitch developer console labels directly; this guide avoids stale screenshots.

### Step 2: Register a New Application

1. Click on **"Your Console"** in the top right
2. Navigate to the **"Applications"** tab
3. Click the **"Register Your Application"** button

### Step 3: Fill Out Application Details

Fill in the following information:

- **Name**: Choose a name for your bot (e.g., "MyAgentBot")
- **OAuth Redirect URLs**: Enter `http://localhost:3000` (you can change this later)
- **Category**: Select "Chat Bot"

### Step 4: Get Your Client ID and Secret

1. Click **"Create"** to save your application
2. You'll see your new application in the list
3. Click **"Manage"** on your application
4. Copy your **Client ID** (you'll need this later)
5. Click **"New Secret"** to generate a Client Secret
6. **IMPORTANT**: Copy the Client Secret immediately! You won't be able to see it again.

> ⚠️ **Security Note**: Never share your Client Secret with anyone. Treat it like a password!

---

## Generating OAuth Tokens

Your agent needs special permissions (called "scopes") to interact with Twitch on your behalf.

### Required Scopes

Your bot needs these permissions:

- `chat:read` - Read chat messages
- `chat:edit` - Send chat messages
- `channel:manage:broadcast` - Update stream title and category
- `channel:read:subscriptions` - Read subscriber information
- `moderator:manage:banned_users` - Timeout/ban users (if moderator)
- `channel:manage:polls` - Create polls
- `clips:edit` - Create clips

### Step 1: Use the Twitch OAuth Flow

Generate a token with the standard Twitch OAuth authorize URL:

1. Replace `YOUR_CLIENT_ID` in the URL below
2. Open it in a browser
3. Approve the scopes you need
4. Copy the `access_token` value from the redirect URL fragment

Authorize URL:

```
https://id.twitch.tv/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost&response_type=token&scope=chat:read+chat:edit+channel:manage:broadcast+channel:read:subscriptions+moderator:manage:banned_users+channel:manage:polls+clips:edit
```

(Replace `YOUR_CLIENT_ID` with your actual Client ID)

5. You will be redirected to a URL like: `http://localhost/#access_token=...`
6. Copy the **access_token** value (the long string after `access_token=` and before `&`)

### Step 2: Get a Refresh Token (Optional but Recommended)

Access tokens expire after about 60 days. A refresh token allows your agent to automatically get new tokens.

For simplicity, we'll skip this for now. You can always regenerate tokens when they expire.

---

## Configuring Your Agent

Now that you have your credentials, let's configure your agent!

### Step 1: Open Admin UI

1. Navigate to your Phantasy Agent Admin UI (usually `http://localhost:2000`)
2. Log in if required
3. Click on the **"Plugins"** tab in the left sidebar

### Step 2: Find the Twitch Plugin

1. Scroll down to find the **"Twitch" plugin** (look for the 🎮 icon)
2. Click on the plugin card to expand it
3. Click the **"Configure"** button

### Step 3: Enter Your Credentials

Fill in the configuration form with the information you gathered:

1. **Client ID**: Paste your Client ID from Twitch Developer Console
2. **Client Secret**: Paste your Client Secret (from when you clicked "New Secret")
3. **Access Token**: Paste your OAuth access token (from twitchtokengenerator.com)
4. **Channel Name**: Enter your Twitch username in lowercase (e.g., `yourchannelname`)
5. **Bot Username**: (Optional) Enter a bot username, or leave blank to use your channel name

### Step 4: Optional Settings

You can customize how your bot behaves:

- **Enable Chat Responses**: Toggle ON to allow the bot to respond to chat
- **Respond to Mentions**: Toggle ON to respond when users @mention the bot
- **Respond to Commands**: Toggle ON to respond to !commands
- **Response Delay**: Set to 2-5 seconds to avoid spam
- **Max Messages Per Minute**: Limit to 10 to comply with Twitch rate limits

### Step 5: Save Configuration

1. Review all your settings
2. Click the **"Save"** button at the bottom
3. You should see a success message: ✅ "Twitch configuration saved successfully"

---

## Starting the Twitch Bot

### Step 1: Enable the Plugin

1. Make sure the **"Enabled"** toggle at the top of the plugin config is ON (green)
2. Click **"Save"** if you changed it

### Step 2: Verify Credentials

Use **Test Connection** after saving credentials. The current release focuses on credential validation and saved configuration inside the admin surface.

---

## Testing Your Setup

Let's verify everything is working!

### Test 1: Check Bot Status

1. Go to your Twitch channel page
2. Look at your viewer list
3. You should see your bot username in the list (if you have Chat visible)

### Test 2: Send a Test Message

#### From Admin UI (Recommended First Test):

1. In the Twitch plugin config, scroll to **"Test Message"** section
2. Enter a simple message like: `Hello from Phantasy Agent! 🤖`
3. Click **"Send Test Message"**
4. Open your Twitch chat in another tab
5. You should see your message appear in chat!

#### Using AI Tools:

1. Open the **"Chat"** tab in Admin UI
2. Send a message to your agent like:
   ```
   Please send "Hi chat! The bot is working!" to my Twitch channel
   ```
3. The agent should use the `twitch_send_chat_message` tool
4. Check your Twitch chat to see the message

### Test 3: Respond to a Chat Message

1. Open your Twitch stream or channel chat
2. Type a message that mentions your bot:
   ```
   @YourBotName hello!
   ```
3. The bot should respond with an AI-generated message!

### Test 4: Try a Command

Type this in your Twitch chat:

```
!help
```

The bot should respond with:

```
Available commands: !help, !about, !socials. I'm an AI assistant here to chat!
```

---

## Advanced Features

Once your bot is working, you can use these advanced features:

### Stream Management

Your agent can update your stream title and category:

**Example Chat Message to Agent**:

```
Change my stream title to "Building a cool AI bot!" and set the game to "Software and Game Development"
```

The agent will use the `twitch_update_channel` tool automatically.

### Create Clips

**Example**:

```
Create a clip of the last 30 seconds!
```

The agent uses the `twitch_create_clip` tool.

### Moderation

**Example** (if bot has moderator permissions):

```
Timeout the user "SpamBot123" for 10 minutes
```

### Polls

**Example**:

```
Create a poll asking "What should we build next?" with choices: "Discord Bot", "Twitter Bot", "Web App"
```

---

## Troubleshooting

### ❌ "Failed to connect to Twitch IRC"

**Possible Causes**:

- Incorrect access token
- Token expired (tokens last ~60 days)
- Invalid Client ID or Client Secret

**Solution**:

1. Generate a new access token using the steps above
2. Update your configuration in Admin UI
3. Try starting the bot again

---

### ❌ Bot appears offline in chat

**Possible Causes**:

- Bot not started
- Connection lost
- Twitch server issues

**Solution**:

1. Check bot status in Admin UI
2. Click **"Stop Bot"** then **"Start Bot"** to reconnect
3. Check your internet connection

---

### ❌ Bot doesn't respond to mentions

**Check These Settings**:

1. Go to Twitch plugin configuration
2. Verify **"Respond to Mentions"** is toggled ON
3. Verify **"Enable Chat Responses"** is toggled ON
4. Make sure you're mentioning the correct bot username
5. Check that the bot has been started

---

### ❌ "Rate limit exceeded" error

**Explanation**:
Twitch limits how many messages bots can send to prevent spam.

**Solution**:

- Default limit is 10 messages per minute
- Add 3-second cooldown between messages
- These are already configured in the plugin defaults

---

### ❌ Bot can't create clips or polls

**Possible Causes**:

- Your access token doesn't have the required scopes
- Channel must be live for clips
- Channel must be affiliate or partner for polls

**Solution**:

1. Generate a new token with all the required scopes listed earlier
2. Make sure your stream is live before creating clips
3. Verify your channel status (affiliate/partner)

---

## FAQ

### Q: Can the bot run 24/7?

**A**: Yes! Once started, the bot stays connected until you stop it or restart the server. The bot automatically reconnects if the connection drops.

### Q: Will the bot work when I'm offline?

**A**: The bot can be online and respond to chat even when you're not streaming. However, some features like creating clips require an active stream.

### Q: Can I use the same bot on multiple channels?

**A**: No, each bot instance connects to one channel. You'd need to run multiple agent instances for multiple channels.

### Q: How do I change the bot's personality?

**A**: The bot uses your agent's main personality configuration. Update your agent's personality settings in the Admin UI under **"Configuration" → "Personality"**.

### Q: Is this against Twitch TOS?

**A**: No! Using approved bots via the official IRC and Helix APIs is allowed. Just make sure to:

- Respect rate limits
- Don't spam
- Follow Twitch Community Guidelines

### Q: Can the bot be a moderator?

**A**: Yes! To give the bot moderator powers:

1. Type this in your Twitch chat: `/mod YourBotUsername`
2. The bot will gain moderator permissions
3. It can then use moderation tools like timeout

---

## Support

Need help? Here are your options:

1. **Check Logs**: Look at the plugin logs in Admin UI for error messages
2. **GitHub Issues**: Report bugs at [github.com/phantasy-bot/agent/issues](https://github.com/phantasy-bot/agent/issues)
3. **Discord Community**: Join our Discord for live support (link in Admin UI)
4. **Documentation**: Read more at [docs.phantasy.bot](https://docs.phantasy.bot)

---

## Next Steps

Now that your Twitch bot is set up, you can:

- ✅ Customize commands in the plugin configuration
- ✅ Adjust chat response settings
- ✅ Integrate with other plugins (Discord, Twitter, etc.)
- ✅ Create custom automations using webhooks
- ✅ Build custom plugins to extend functionality

**Happy streaming! 🎮✨**
