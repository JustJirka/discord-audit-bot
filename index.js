require('dotenv').config();
const { Client, GatewayIntentBits, AuditLogEvent, EmbedBuilder, Events } = require('discord.js');
const Sentiment = require('sentiment');
const { modifyCredits, getCredits } = require('./creditSystem');
const auditConfig = require('./auditConfig');
const CZECH_BAD_WORDS = require('./vulgarities');

const sentiment = new Sentiment();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration, // Required to receive audit log events
        GatewayIntentBits.GuildMessages,   // Required to read messages
        GatewayIntentBits.MessageContent,  // Required to read message content for sentiment
    ],
});

const TARGET_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);
    if (!TARGET_CHANNEL_ID) {
        console.warn('WARNING: LOG_CHANNEL_ID is not set in environment variables.');
    }
});

// --- MESSAGE SENTIMENT ANALYSIS ---
client.on(Events.MessageCreate, async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    const contentLower = message.content.toLowerCase();

    // 1. Check for Bad Words
    const foundBadWord = CZECH_BAD_WORDS.find(word => contentLower.includes(word));

    let creditChange = 0;
    let replyMsg = '';
    let newTotal = 0;

    if (foundBadWord) {
        // Vulgarity detected
        creditChange = -100;
        newTotal = modifyCredits(message.author.id, creditChange);
        replyMsg = `⚠️ **LANGUAGE VIOLATION!**\nDetected vulgar vocabulary: ||${foundBadWord}||\nSocial Credits **${creditChange}**\nTotal Score: **${newTotal}**\n*Watch your tongue, citizen.*`;
    } else {
        // 2. Sentiment Analysis (if no bad words)
        const result = sentiment.analyze(message.content);
        const score = result.score;
        const multiplier = 5;
        creditChange = score * multiplier;

        if (creditChange === 0) return; // Ignore neutral messages

        newTotal = modifyCredits(message.author.id, creditChange);

        if (creditChange > 0) {
            replyMsg = `✅ **Good Citizen!**\nSocial Credits **+${creditChange}**\nTotal Score: **${newTotal}**\n*Glory to the Server!*`;
        } else {
            replyMsg = `⚠️ **ATTENTION CITIZEN!**\nNegative attitude detected!\nSocial Credits **${creditChange}**\nTotal Score: **${newTotal}**\n*Be more positive.*`;
        }
    }

    // Reply to the user
    try {
        await message.reply(replyMsg);
    } catch (err) {
        console.error('Failed to reply to message:', err);
    }
});

// --- AUDIT LOG TRACKING ---
client.on(Events.GuildAuditLogEntryCreate, async (auditLogEntry, guild) => {
    if (!TARGET_CHANNEL_ID) return;

    try {
        const channel = await guild.channels.fetch(TARGET_CHANNEL_ID);
        if (!channel) {
            console.error(`Could not find channel with ID ${TARGET_CHANNEL_ID}`);
            return;
        }

        const { action, executorId, targetId, reason, changes } = auditLogEntry;

        // Fetch executor user
        const executor = await client.users.fetch(executorId).catch(() => null);
        // Fetch target user if possible
        const targetUser = targetId ? await client.users.fetch(targetId).catch(() => null) : null;

        // Determine action name
        const actionName = Object.keys(AuditLogEvent).find(key => AuditLogEvent[key] === action) || action;

        // --- Social Credit Logic from Config ---
        let creditDeduction = 0;
        let scMessage = '';
        let recipientId = null;
        let recipientUser = null;

        // Check if we have a config for this action
        const config = auditConfig[action];

        if (config) {
            // Determine who gets the score change
            if (config.type === 'target' && targetId) {
                creditDeduction = config.score;
                scMessage = config.reason;
                recipientId = targetId;
                recipientUser = targetUser;
            } else if (config.type === 'executor' && executorId) {
                creditDeduction = config.score;
                scMessage = config.reason;
                recipientId = executorId;
                recipientUser = executor;
            }

            // Special Case: MemberUpdate (Timeouts)
            // If it's MemberUpdate, we need to check if it was actually a timeout.
            // Config default for MemberUpdate is -50. But Timeout is severe.
            if (action === AuditLogEvent.MemberUpdate) {
                const timeoutChange = changes.find(c => c.key === 'communication_disabled_until');
                if (timeoutChange && timeoutChange.new) {
                    creditDeduction = -200;
                    scMessage = 'Timeout Issued (Communication Rights Suspended).';
                    recipientId = targetId;
                    recipientUser = targetUser;
                }
            }
        }

        let newTotal = 'N/A';
        // Apply credits if we identified a recipient
        if (recipientId && creditDeduction !== 0) {
            newTotal = modifyCredits(recipientId, creditDeduction);
        }

        // Build Embed
        const embed = new EmbedBuilder()
            .setTitle('Víí Uuu víí uuu Nela něco kuchtí víí uuu vííí uuu')
            .setColor(creditDeduction < 0 ? 'Red' : 'Blurple')
            .addFields(
                { name: 'Action', value: `${actionName}`, inline: true },
                { name: 'Executor', value: executor ? `${executor.tag} (<@${executor.id}>)` : 'Unknown', inline: true },
                { name: 'Target', value: targetUser ? `${targetUser.tag} (<@${targetUser.id}>)` : `${targetId || 'N/A'}`, inline: true },
                { name: 'Reason', value: reason || 'No reason provided', inline: false }
            )
            .setTimestamp();

        // Add Social Credit Field if applicable
        if (creditDeduction !== 0 && recipientUser) {
            embed.addFields({
                name: '🇨🇳 Social Credit Update',
                value: `**Recipient:** ${recipientUser.tag}\n**Change:** ${creditDeduction > 0 ? '+' : ''}${creditDeduction} Credits\n**New Total:** ${newTotal}\n**Reason:** ${scMessage}`
            });
        }

        await channel.send({ embeds: [embed] });
        console.log(`Logged action ${actionName} to channel.`);

    } catch (error) {
        console.error('Error sending audit log message:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
