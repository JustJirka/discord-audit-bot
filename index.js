require('dotenv').config();
const { Client, GatewayIntentBits, AuditLogEvent, EmbedBuilder, Events } = require('discord.js');
const { modifyCredits, getCredits, getAllCredits } = require('./creditSystem');
const auditConfig = require('./auditConfig');
const CZECH_BAD_WORDS = require('./vulgarities');
const czechSentiment = require('./czechSentiment'); // Fallback
const { spawn } = require('child_process');

// --- PYTHON BRIDGE SETUP ---
let sentimentProcess = null;
let isPythonReady = false;
const pendingRequests = []; // Queue for messages waiting for sentiment

function startPythonBridge() {
    console.log('Starting Python Sentiment Engine...');
    // python or python3 depending on system. Trying 'python' first.
    // In some docker containers it might be python3.
    // For Windows 'python' is usually correct if added to PATH.
    sentimentProcess = spawn('python', ['sentiment_engine.py']);

    sentimentProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            if (line === 'READY') {
                console.log('Python Sentiment Engine is READY.');
                isPythonReady = true;
                return;
            }

            // Attempt to parse JSON response
            // We need a mechanism to match requests to responses if we want async.
            // The simplest way for a chat bot without high concurrency requirement 
            // is to process one by one or attach an ID.
            // However, since we are just piping lines, if we process sequentially 
            // and the user sends many messages, we might get desynced if we don't track IDs.
            // BUT, for simplicity in this "hacky" bridge, let's assume FIFO for current implementation
            // OR simpler: we don't use a queue for the RESPONSE, we just handle the "next" callback.

            if (pendingRequests.length > 0) {
                const { resolve } = pendingRequests.shift();
                try {
                    const json = JSON.parse(line);
                    resolve(json);
                } catch (e) {
                    console.error('Failed to parse Python output:', line);
                    resolve(null); // Resolve with null to fallback
                }
            }
        });
    });

    sentimentProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    sentimentProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        isPythonReady = false;
        // Optional: Restart?
        // setTimeout(startPythonBridge, 5000);
    });
}

function analyzeWithPython(text) {
    return new Promise((resolve) => {
        if (!isPythonReady || !sentimentProcess) {
            resolve(null); // Fallback immediately
            return;
        }

        // Add to queue
        pendingRequests.push({ resolve });

        // Write to stdin
        // Ensure no newlines in text break the protocol
        const safeText = text.replace(/\n/g, ' ') + '\n';
        sentimentProcess.stdin.write(safeText);
    });
}

// Start the bridge
startPythonBridge();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration, // Required to receive audit log events
        GatewayIntentBits.GuildMessages,   // Required to read messages
        GatewayIntentBits.MessageContent,  // Required to read message content for sentiment
    ],
});

const TARGET_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);
    if (!TARGET_CHANNEL_ID) {
        console.warn('WARNING: LOG_CHANNEL_ID is not set in environment variables.');
    }

    // Register /1984 command
    const data = [
        {
            name: '1984',
            description: 'Shows the Social Credit Leaderboard for this channel.',
        }
    ];

    try {
        console.log('Refreshing application (/) commands...');
        await client.application.commands.set(data);
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error refreshing commands:', error);
    }
});

// --- INTERACTION HANDLER (/1984) ---
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === '1984') {
        const allCredits = getAllCredits();
        // Get members in current channel/guild to filter or just show top global?
        // User asked: "users in the channel where it is written"
        // We need to fetch channel members. Note: in large guilds this is expensive, 
        // but for a small bot it's fine. 
        // Best approach: Iterate over credit data and check if they are in the channel.

        const channel = interaction.channel;
        if (!channel) return;

        const leaderboard = [];

        for (const [userId, score] of Object.entries(allCredits)) {
            // Check if user is in this channel (permissions wise)
            // Ideally we check interaction.guild.members.cache
            try {
                // We rely on cache or fetch. For speed, cache.
                const member = interaction.guild.members.cache.get(userId);
                if (member) {
                    // Check if they can view this channel? 
                    // Or "users in the channel" implies members present.
                    // Let's just list known members.
                    leaderboard.push({ tag: member.user.tag, score: score });
                }
            } catch (e) {
                // ignore
            }
        }

        // Sort descending
        leaderboard.sort((a, b) => b.score - a.score);

        // Format
        const topList = leaderboard.slice(0, 20).map((entry, index) => {
            let icon = '😐';
            if (entry.score >= 1500) icon = '🌟';
            else if (entry.score >= 1000) icon = '✅';
            else if (entry.score < 500) icon = '⚠️';
            else if (entry.score < 0) icon = '💀';

            return `**${index + 1}.** ${entry.tag}: **${entry.score}** ${icon}`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('📜 Ministry of Truth: Social Credit Logs')
            .setDescription(topList || 'No citizens found in the registry.')
            .setColor('DarkRed')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});

// --- MESSAGE SENTIMENT ANALYSIS ---
client.on(Events.MessageCreate, async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    const contentLower = message.content.toLowerCase();

    // 1. Check for Bad Words first (Fast fail)
    const foundBadWord = CZECH_BAD_WORDS.find(word => contentLower.includes(word));

    let creditChange = 0;
    let newTotal = 0;
    let reason = '';
    let isPositive = false;

    if (foundBadWord) {
        // Vulgarity detected
        creditChange = -100;
        newTotal = modifyCredits(message.author.id, creditChange);
        reason = `Language Violation (Vocabulary: ${foundBadWord})`;
        isPositive = false;
    } else {
        // 2. Python AI Analysis
        let score = 0;
        // Try Python first
        const pythonResult = await analyzeWithPython(message.content);

        if (pythonResult && pythonResult.score !== undefined) {
            // Python sent a score (-2 to 2)
            score = pythonResult.score; // Already mapped roughly
            // Scale it up. 1 star (-2) -> -20, 5 stars (2) -> +20
            creditChange = score * 10;
        } else {
            // Fallback to JS Heuristic
            const Sentiment = require('sentiment'); // Re-require purely for fallback logic structure
            const sentiment = new Sentiment();
            sentiment.registerLanguage('cs', czechSentiment);

            const result = sentiment.analyze(message.content, {
                language: 'cs',
                scoringStrategy: czechSentiment.scoringStrategy
            });

            // JS score is raw sum (e.g. 3)
            creditChange = result.score * 5;
        }

        if (creditChange === 0) return; // Ignore neutral messages

        isPositive = creditChange > 0;
        reason = isPositive ? 'Positive Citizen Sentiment' : 'Negative Citizen Sentiment';
        newTotal = modifyCredits(message.author.id, creditChange);
    }

    // --- REPORT TO LOG CHANNEL ONLY ---
    if (!TARGET_CHANNEL_ID) return;

    try {
        const logChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle(isPositive ? '✅ Citizen Sentiment Analysis' : '⚠️ Citizen Sentiment Alert')
                .setColor(isPositive ? 'Green' : 'Red')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription(`**Message:** "${message.content}"`)
                .addFields(
                    { name: 'Analysis', value: `${isPositive ? 'POSITIVE' : 'NEGATIVE'}`, inline: true },
                    { name: 'Score Change', value: `${creditChange > 0 ? '+' : ''}${creditChange}`, inline: true },
                    { name: 'New Total', value: `${newTotal}`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setFooter({ text: 'Ministry of Truth Surveillance' })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    } catch (err) {
        console.error('Failed to log sentiment:', err);
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
            // If it's MemberUpdate, check if it was actually a timeout.
            if (action === AuditLogEvent.MemberUpdate) {
                const timeoutChange = changes.find(c => c.key === 'communication_disabled_until');
                if (timeoutChange && timeoutChange.new) {
                    // Punish the Executor for silencing the user (Limit of Speech?)
                    creditDeduction = -50;
                    scMessage = 'Issued Timeout (Suppression of Speech).';
                    recipientId = executorId;
                    recipientUser = executor;
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
