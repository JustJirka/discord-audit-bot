# Discord Audit Log Bot

This bot listens to the Discord Audit Log and sends a message to a configured channel whenever an action is performed.

## Setup

### 1. Discord Developer Portal
1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2.  Create a "New Application".
3.  Go to the **Bot** tab.
4.  Uncheck "Public Bot" (unless you want others to invite it).
5.  **Privileged Gateway Intents**: Enable **Presence Intent**, **Server Members Intent**, and **Message Content Intent** (just to be safe, though mainly you need Guilds).
    *   *Critical*: Ensure your bot has permission to VIEW AUDIT LOGS in the server.
6.  Copy the **Token**.

### 2. Configuration
1.  Rename `.env.example` to `.env`.
2.  Edit `.env`:
    *   `DISCORD_TOKEN`: Paste your bot token here.
    *   `LOG_CHANNEL_ID`: Right-click the channel in Discord where you want logs to appear and click "Copy ID" (Enable Developer Mode in Discord Settings > Advanced to see this).

### 3. Invitation
1.  Go to **OAuth2** > **URL Generator**.
2.  Scopes: `bot`.
3.  Bot Permissions: `View Audit Log`, `Send Messages`, `Embed Links`.
4.  Copy the generated URL and invite the bot to your server.

### 4. Running on OpenMediaVault (Docker Compose)
1.  Upload this folder to your OMV server (e.g., via SMB or SSH).
2.  SSH into your OMV server.
3.  Navigate to the folder.
4.  Create the `.env` file with your credentials as described above.
5.  Run:
    ```bash
    docker compose up -d --build
    ```
6.  Check logs if needed:
    ```bash
    docker compose logs -f
    ```

## Development
To run locally:
```bash
npm install
npm start
```
