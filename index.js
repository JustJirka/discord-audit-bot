require('dotenv').config();
const { Client, GatewayIntentBits, AuditLogEvent, EmbedBuilder, Events } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration, // Required to receive audit log events
    ],
});

const TARGET_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);
    if (!TARGET_CHANNEL_ID) {
        console.warn('WARNING: LOG_CHANNEL_ID is not set in environment variables.');
    }
});

client.on(Events.GuildAuditLogEntryCreate, async (auditLogEntry, guild) => {
    // Basic creating of the log message
    if (!TARGET_CHANNEL_ID) return;

    try {
        const channel = await guild.channels.fetch(TARGET_CHANNEL_ID);
        if (!channel) {
            console.error(`Could not find channel with ID ${TARGET_CHANNEL_ID}`);
            return;
        }

        const { action, executorId, targetId, reason, extra } = auditLogEntry;

        // Fetch executor user
        const executor = await client.users.fetch(executorId).catch(() => null);

        // Determine action name (e.g. MEMBER_KICK, CHANNEL_CREATE)
        const actionName = Object.keys(AuditLogEvent).find(key => AuditLogEvent[key] === action) || action;

        const embed = new EmbedBuilder()
            .setTitle('Víí Uuu víí uuu Nela něco kuchtí víí uuu vííí uuu')
            .setColor('Blurple')
            .addFields(
                { name: 'Action', value: `${actionName}`, inline: true },
                { name: 'Executor', value: executor ? `${executor.tag} (<@${executor.id}>)` : 'Unknown', inline: true },
                { name: 'Target ID', value: `${targetId || 'N/A'}`, inline: true },
                { name: 'Reason', value: reason || 'No reason provided', inline: false }
            )
            .setTimestamp();

        // Add extra info if available (changes, etc) could be complex, sticking to summary for now

        await channel.send({ embeds: [embed] });
        console.log(`Logged action ${actionName} to channel.`);

    } catch (error) {
        console.error('Error sending audit log message:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
