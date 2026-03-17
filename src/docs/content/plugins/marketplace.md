# Plugin Marketplace User Guide

Welcome to the Phantasy Agent Plugin Marketplace! This guide will help you discover, install, and manage plugins to extend your agent's capabilities.

## Table of Contents

1. [Introduction](#introduction)
2. [Accessing the Marketplace](#accessing-the-marketplace)
3. [Installing Plugins](#installing-plugins)
4. [Custom Plugin Installation](#custom-plugin-installation)
5. [Managing Installed Plugins](#managing-installed-plugins)
6. [Updating Plugins](#updating-plugins)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Introduction

The Plugin Marketplace is your one-stop shop for extending your Phantasy Agent with new features and integrations. Similar to the WordPress plugin ecosystem, you can:

- **Browse** featured and community plugins
- **Install** plugins with one click
- **Update** plugins automatically
- **Manage** all your plugins from one interface

### What Can Plugins Do?

Plugins can add:

- 🎮 **Platform Integrations** (Twitch, Discord, Twitter, YouTube, etc.)
- 🤖 **AI Tools** (Image generation, voice synthesis, translation)
- 📊 **Analytics** (Usage tracking, sentiment analysis)
- 🎨 **Customization** (Themes, personalities, behaviors)
- 🔧 **Utilities** (Database connectors, API clients, automation tools)

---

## Accessing the Marketplace

### Step 1: Open Admin UI

1. Navigate to your Phantasy Agent Admin UI (default: `http://localhost:2000`)
2. Log in if required
3. Click the **"Plugins"** tab in the left sidebar

### Step 2: Switch to Marketplace View

1. At the top of the Plugins page, you'll see two tabs:
   - **"My Plugins"** - Shows your installed plugins
   - **"Marketplace"** - Shows available plugins to install

2. Click **"Marketplace"** to browse available plugins

The Marketplace tab labels are the source of truth. The UI changes faster than screenshots, so this guide stays text-first on purpose.

---

## Installing Plugins

### Featured Plugins (One-Click Install)

The marketplace showcases featured plugins that are:

- ✅ Tested and verified by the Phantasy team
- ✅ Actively maintained
- ✅ Well-documented

#### Installation Steps:

1. **Browse** the plugin grid to find a plugin you want
2. **Click** the plugin card to see more details
3. **Read** the description, features, and requirements
4. **Click "Install"** button on the plugin card
5. **Wait** for installation to complete (usually 10-30 seconds)
6. **Success!** You'll see a confirmation message

The plugin is now installed and ready to configure!

### Search and Filter

Can't find what you're looking for? Use the search and filter tools:

**Search Bar:**

- Type plugin names, keywords, or descriptions
- Results update in real-time
- Example searches: "twitch", "discord bot", "image generation"

**Category Filter:**

- Select from categories like:
  - 🎮 **Streaming** - Twitch, YouTube Live, etc.
  - 💬 **Social Media** - Twitter, Discord, Instagram
  - 🎯 **Gaming** - Game integrations and stats
  - 🤖 **Chat** - Chat platforms and bots
  - ⚙️ **Automation** - Workflow and task automation

Use the search bar plus the category filter row at the top of the Marketplace tab.

---

## Custom Plugin Installation

Want to install a plugin not in the marketplace? Use the **Custom Install** feature!

### Step 1: Open Custom Install Modal

1. Click the **"Custom Install"** button in the top right of the marketplace
2. A modal will appear with installation options

### Step 2: Choose Installation Type

Select the appropriate type based on your plugin source:

#### Git Repository

- **When to use:** Plugin hosted on GitHub, GitLab, or other git platforms
- **Example:** `https://github.com/username/my-plugin`
- **Options:**
  - Branch: Specify a branch (default: `main`)

#### NPM Package

- **When to use:** Plugin published to NPM registry
- **Example:** `@phantasy/plugin-example` or `phantasy-plugin-example`
- **Options:**
  - Version: Specify a version (default: `latest`)

#### ZIP Archive

- **When to use:** Plugin distributed as a .zip file via URL
- **Example:** `https://example.com/plugins/my-plugin.zip`
- **Note:** ZIP must contain a valid `phantasy.plugin.json` manifest or `package.json#phantasy` metadata

### Step 3: Enter Plugin Details

1. **Source URL/Package Name:**
   - For Git: Full repository URL
   - For NPM: Package name (with or without @scope)
   - For ZIP: Direct download URL to .zip file

2. **Optional Settings:**
   - Git Branch: Target branch (e.g., `main`, `development`, `v2.0`)
   - NPM Version: Specific version (e.g., `1.2.3`, `^2.0.0`)

### Step 4: Install

1. Click **"Install Plugin"** button
2. Wait for download and installation (may take 30-60 seconds)
3. Check for success message or error details

The Custom Install dialog asks for the source type first, then the repository/package/archive details.

### Example: Installing from GitHub

```
Type: Git Repository
Source: https://github.com/phantasy-community/plugin-analytics
Branch: main
```

### Example: Installing from NPM

```
Type: NPM Package
Source: @phantasy/plugin-tiktok
Version: latest
```

---

## Managing Installed Plugins

After installing plugins, manage them from the **"My Plugins"** tab.

### View Installed Plugins

1. Click **"My Plugins"** tab
2. See a list of all your installed plugins
3. Each plugin shows:
   - Name and description
   - Version number
   - Installation status
   - Configuration button

### Configure a Plugin

1. Find the plugin in the list
2. Click the **"Configure"** button or plugin card
3. Fill in required settings (API keys, preferences, etc.)
4. Click **"Save"** to apply changes

### Enable/Disable Plugins

1. Find the plugin you want to toggle
2. Click the **Enable/Disable** switch
3. Plugin will start/stop running immediately

**Tip:** Disable plugins you're not using to improve performance!

### Uninstall a Plugin

1. Find the plugin you want to remove
2. Click the **"Uninstall"** or trash icon button
3. Confirm deletion
4. Plugin files are removed from your system

**Warning:** Uninstalling removes all plugin data and configuration!

---

## Updating Plugins

Keep your plugins up-to-date to get the latest features and security fixes.

### Automatic Update Checks

The system automatically checks for updates when you:

- Open the Plugins page
- Click the refresh button
- Restart the agent

### Update a Single Plugin

1. If an update is available, you'll see an **"Update Available"** badge
2. Click the **"Update"** button next to the plugin
3. The system will:
   - ✅ Create an automatic backup
   - ✅ Download the new version
   - ✅ Install dependencies
   - ✅ Restore from backup if anything fails
4. Success message confirms update

### Updating Multiple Plugins

Update plugins one at a time today. That keeps the failure surface small and makes rollback easier when a third-party plugin ships a bad release.

---

## Troubleshooting

### ❌ "Installation Failed" Error

**Possible Causes:**

- Invalid repository URL or package name
- Plugin already installed
- Network connection issues
- Missing required dependencies

**Solutions:**

1. Verify the source URL is correct and accessible
2. Check if plugin is already installed in "My Plugins"
3. Try refreshing the marketplace
4. Check your internet connection
5. Look at browser console for detailed errors

---

### ❌ "Plugin Not Found" (Custom Install)

**Possible Causes:**

- Incorrect Git URL
- Private repository without access token
- NPM package doesn't exist
- ZIP URL returns 404

**Solutions:**

1. Double-check the URL/package name for typos
2. Ensure repository is public or you have access
3. Try visiting the URL in a browser to verify
4. For NPM: Search npmjs.com to confirm package exists

---

### ❌ "Invalid Plugin Manifest"

**Possible Causes:**

- Plugin missing `phantasy.plugin.json` or `package.json#phantasy` metadata
- Malformed JSON in manifest
- Missing required fields (name, version)

**Solutions:**

1. Contact the plugin developer
2. Check if plugin is compatible with Phantasy Agent
3. Verify plugin is in the correct format (see Developer Guide)

---

### ❌ Plugin Won't Start After Install

**Possible Causes:**

- Missing configuration (API keys, etc.)
- Dependency conflicts
- Incompatible plugin version

**Solutions:**

1. Configure the plugin in "My Plugins" → "Configure"
2. Check plugin documentation for required setup
3. Review logs in Admin UI for error details
4. Try disabling/re-enabling the plugin
5. Uninstall and reinstall if issues persist

---

### ❌ Update Failed / Plugin Broken After Update

**Don't worry!** The update system creates automatic backups.

**Recovery Steps:**

1. The system automatically rolls back to the previous version on failure
2. If plugin is broken, go to "My Plugins"
3. Find the plugin and click **"Restore from Backup"** (if available)
4. Or uninstall and reinstall the previous version

---

## FAQ

### Q: Are plugins safe to install?

**A:** Featured marketplace plugins are reviewed by the Phantasy team. For custom plugins:

- Only install from trusted sources
- Review the repository/package before installing
- Check for active maintenance and community feedback
- Use at your own risk for unverified plugins

### Q: Can I install multiple plugins at once?

**A:** Not currently, but batch installation is planned for a future update. For now, install plugins one at a time.

### Q: How do I find more plugins?

**A:**

- Browse the marketplace
- Visit the Phantasy Community Forum
- Check GitHub for plugins with the `phantasy-plugin` topic
- Search NPM for packages with `phantasy-plugin` keyword

### Q: Can I create my own plugins?

**A:** Yes! See [Developing Plugins](./developing.md) for instructions on creating custom plugins.

### Q: Do plugins cost money?

**A:** Most plugins in the marketplace are free and open-source. Some commercial plugins may require payment or subscription - check the plugin's homepage for details.

### Q: Can I use plugins from WordPress/Discord/other platforms?

**A:** No, Phantasy Agent plugins use a specific format and API. Plugins must be built specifically for Phantasy Agent.

### Q: How do I report a bug in a plugin?

**A:**

1. For featured plugins: File an issue on the Phantasy GitHub repository
2. For community plugins: File an issue on the plugin's repository
3. Include error logs and steps to reproduce

### Q: Can plugins access my API keys or sensitive data?

**A:** Plugins have access to the agent's environment and configuration. Only install plugins you trust. Featured marketplace plugins are reviewed for security.

### Q: What happens if a plugin repository is deleted?

**A:** Your installed version will continue to work, but you won't receive updates. Consider:

- Backing up the plugin directory
- Finding an alternative plugin
- Forking the repository if it's open-source

### Q: Can I roll back to an older version of a plugin?

**A:** Currently, you can restore from the automatic backup created during updates. Manual version pinning is planned for a future release.

### Q: How much space do plugins use?

**A:** Most plugins are 1-5 MB. Complex plugins with dependencies may be 10-50 MB. Check the plugin's repository for size estimates.

---

## Support

Need more help?

1. **Check Logs:** Admin UI → Logs tab for error details
2. **Documentation:** Read plugin-specific guides in `/docs`
3. **Community:** Join our Discord for live support
4. **GitHub Issues:** Report bugs at [github.com/phantasy-bot/agent/issues](https://github.com/phantasy-bot/agent/issues)

**Happy plugin hunting! 🚀✨**
