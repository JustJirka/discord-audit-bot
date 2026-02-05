const { AuditLogEvent } = require('discord.js');

// Structure: [EventType]: { score: Number, type: 'target' | 'executor', reason: String }
// 'target': The user being acted upon receives the score change.
// 'executor': The user doing the action receives the score change.
// UPDATED: Enforcement actions now PUNISH the EXECUTOR (as per user request: "acting against the state").

module.exports = {
    // --- Server Management (Executor builds/maintains server -> Credit+) ---
    [AuditLogEvent.GuildUpdate]: { score: 10, type: 'executor', reason: 'Upgraded Server Settings' },

    [AuditLogEvent.ChannelCreate]: { score: 20, type: 'executor', reason: 'Expanded Server Territory (Channel Created)' },
    [AuditLogEvent.ChannelUpdate]: { score: 5, type: 'executor', reason: 'Maintained Channel Infrastructure' },
    [AuditLogEvent.ChannelDelete]: { score: -10, type: 'executor', reason: 'Destroyed Server Territory' }, // Punishable
    [AuditLogEvent.ChannelOverwriteCreate]: { score: 5, type: 'executor', reason: 'Refined Channel Permissions' },
    [AuditLogEvent.ChannelOverwriteUpdate]: { score: 5, type: 'executor', reason: 'Refined Channel Permissions' },
    [AuditLogEvent.ChannelOverwriteDelete]: { score: 5, type: 'executor', reason: 'Cleaned Channel Permissions' },

    // --- Member Management (Executor Punished for Harmful Actions against Citizens) ---
    [AuditLogEvent.MemberKick]: { score: -100, type: 'executor', reason: 'Expelled a Citizen (Kick)' },
    [AuditLogEvent.MemberPrune]: { score: -200, type: 'executor', reason: 'Mass Expulsion (Prune) detected' },
    [AuditLogEvent.MemberBanAdd]: { score: -300, type: 'executor', reason: 'Banished a Citizen. Harmful to Population.' },
    [AuditLogEvent.MemberBanRemove]: { score: 100, type: 'executor', reason: 'Restored a Citizen (Unban). Praise be.' },
    [AuditLogEvent.MemberUpdate]: { score: -10, type: 'executor', reason: 'Altered Citizen Record' },
    [AuditLogEvent.MemberRoleUpdate]: { score: 0, type: 'executor', reason: 'Adjusted Citizen Rank' }, // Neutral
    [AuditLogEvent.MemberMove]: { score: 0, type: 'executor', reason: 'Relocated Citizen (Voice)' },
    [AuditLogEvent.MemberDisconnect]: { score: -20, type: 'executor', reason: 'Silenced Citizen Connection' },
    [AuditLogEvent.BotAdd]: { score: 50, type: 'executor', reason: 'Invited Helper Unit' },

    // --- Role Management ---
    [AuditLogEvent.RoleCreate]: { score: 15, type: 'executor', reason: 'Created new Social Class (Role)' },
    [AuditLogEvent.RoleUpdate]: { score: 5, type: 'executor', reason: 'Modified Social Class' },
    [AuditLogEvent.RoleDelete]: { score: -50, type: 'executor', reason: 'Destroyed Social Class' },

    // --- Invite Management ---
    [AuditLogEvent.InviteCreate]: { score: 10, type: 'executor', reason: 'Propaganda Spread (Invite Created)' },
    [AuditLogEvent.InviteDelete]: { score: -5, type: 'executor', reason: 'Propaganda Retracted' },

    // --- Webhook ---
    [AuditLogEvent.WebhookCreate]: { score: 10, type: 'executor', reason: 'Communication Relay Established' },
    [AuditLogEvent.WebhookUpdate]: { score: 5, type: 'executor', reason: 'Communication Relay Tuned' },
    [AuditLogEvent.WebhookDelete]: { score: -5, type: 'executor', reason: 'Communication Relay Destroyed' },

    // --- Emoji / Sticker ---
    [AuditLogEvent.EmojiCreate]: { score: 15, type: 'executor', reason: 'Cultural Asset Added (Emoji)' },
    [AuditLogEvent.EmojiUpdate]: { score: 5, type: 'executor', reason: 'Cultural Asset Refined' },
    [AuditLogEvent.EmojiDelete]: { score: -15, type: 'executor', reason: 'Cultural Asset Destroyed' },
    [AuditLogEvent.StickerCreate]: { score: 15, type: 'executor', reason: 'Propaganda Sticker Added' },
    [AuditLogEvent.StickerUpdate]: { score: 5, type: 'executor', reason: 'Propaganda Sticker Refined' },
    [AuditLogEvent.StickerDelete]: { score: -15, type: 'executor', reason: 'Propaganda Sticker Destroyed' },

    // --- Messages ---
    [AuditLogEvent.MessageDelete]: { score: -20, type: 'executor', reason: 'Censorship Detected (Message Deleted)' },
    [AuditLogEvent.MessageBulkDelete]: { score: -50, type: 'executor', reason: 'Mass Censorship Detected' },
    [AuditLogEvent.MessagePin]: { score: 5, type: 'executor', reason: 'Highlighted Exemplary Content' },
    [AuditLogEvent.MessageUnpin]: { score: 0, type: 'executor', reason: 'Updated Pinned Content' },

    // --- Integrations ---
    [AuditLogEvent.IntegrationCreate]: { score: 20, type: 'executor', reason: 'Foreign Relations Established' },
    [AuditLogEvent.IntegrationUpdate]: { score: 10, type: 'executor', reason: 'Foreign Relations Adjusted' },
    [AuditLogEvent.IntegrationDelete]: { score: -20, type: 'executor', reason: 'Foreign Relations Severed' },

    // --- Thread ---
    [AuditLogEvent.ThreadCreate]: { score: 10, type: 'executor', reason: 'New Discussion Topic Approved' },
    [AuditLogEvent.ThreadUpdate]: { score: 5, type: 'executor', reason: 'Discussion Topic Moderated' },
    [AuditLogEvent.ThreadDelete]: { score: -10, type: 'executor', reason: 'Discussion Topic Silenced' },

    // --- Events (Scheduled) ---
    [AuditLogEvent.GuildScheduledEventCreate]: { score: 30, type: 'executor', reason: 'State Gathering Organized' },
    [AuditLogEvent.GuildScheduledEventUpdate]: { score: 10, type: 'executor', reason: 'State Gathering Adjusted' },
    [AuditLogEvent.GuildScheduledEventDelete]: { score: -20, type: 'executor', reason: 'State Gathering Cancelled' },

    // --- Auto Moderation ---
    [AuditLogEvent.AutoModerationRuleCreate]: { score: 50, type: 'executor', reason: 'Implemented Law & Order (AutoMod)' },
    [AuditLogEvent.AutoModerationRuleUpdate]: { score: 10, type: 'executor', reason: 'Updated Law & Order' },
    [AuditLogEvent.AutoModerationRuleDelete]: { score: -50, type: 'executor', reason: 'Repealed Law & Order' },

    // Automod triggers are usually neutral or ignored for executor, as it's the bot. 
    // We can punish the target for causing it, or just leave it.
    [AuditLogEvent.AutoModerationBlockMessage]: { score: -100, type: 'target', reason: 'Message Blocked by AutoMod.' },
    [AuditLogEvent.AutoModerationFlagToChannel]: { score: -50, type: 'target', reason: 'Final Warning Detected.' },
    [AuditLogEvent.AutoModerationUserCommunicationDisabled]: { score: -200, type: 'target', reason: 'Auto-Silenced.' }
};
