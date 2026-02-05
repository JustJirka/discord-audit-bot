const { AuditLogEvent } = require('discord.js');

// Structure: [EventType]: { score: Number, type: 'target' | 'executor', reason: String }
// 'target': The user being acted upon receives the score change.
// 'executor': The user doing the action receives the score change.

module.exports = {
    // --- Server Management (Executor builds/maintains server -> Credit+) ---
    [AuditLogEvent.GuildUpdate]: { score: 10, type: 'executor', reason: 'Upgraded Server Settings' },

    [AuditLogEvent.ChannelCreate]: { score: 20, type: 'executor', reason: 'Expanded Server Territory (Channel Created)' },
    [AuditLogEvent.ChannelUpdate]: { score: 5, type: 'executor', reason: 'Maintained Channel Infrastructure' },
    [AuditLogEvent.ChannelDelete]: { score: -5, type: 'executor', reason: 'Removed Server Territory (Channel Deleted)' }, // Deletion could be controversial? Let's say slight cost or 0.
    [AuditLogEvent.ChannelOverwriteCreate]: { score: 5, type: 'executor', reason: 'Refined Channel Permissions' },
    [AuditLogEvent.ChannelOverwriteUpdate]: { score: 5, type: 'executor', reason: 'Refined Channel Permissions' },
    [AuditLogEvent.ChannelOverwriteDelete]: { score: 5, type: 'executor', reason: 'Cleaned Channel Permissions' },

    // --- Member Management (Target gets punished/rewarded) ---
    [AuditLogEvent.MemberKick]: { score: -500, type: 'target', reason: 'Kiked from the server. Shameful display.' },
    [AuditLogEvent.MemberPrune]: { score: -200, type: 'executor', reason: 'Purged Weak Elements' }, // Executor did a good job cleaning
    [AuditLogEvent.MemberBanAdd]: { score: -1000, type: 'target', reason: 'Banned. Enemy of the State.' },
    [AuditLogEvent.MemberBanRemove]: { score: 200, type: 'target', reason: 'Unbanned. A second chance at citizenship.' },
    [AuditLogEvent.MemberUpdate]: { score: -50, type: 'target', reason: 'Profile/Role Modified by State' }, // Generic update usually defaults to negative or neutral. See index.js for specific Timeout override.
    [AuditLogEvent.MemberRoleUpdate]: { score: 0, type: 'target', reason: 'Roles Changed' }, // Too ambiguous (Promoted vs Demoted?), kept neutral in map, potentially handled in logic.
    [AuditLogEvent.MemberMove]: { score: 0, type: 'target', reason: 'Moved in Voice' },
    [AuditLogEvent.MemberDisconnect]: { score: -10, type: 'target', reason: 'Forcefully Disconnected' },
    [AuditLogEvent.BotAdd]: { score: 50, type: 'executor', reason: 'Invited a helper robot' },

    // --- Role Management (Executor) ---
    [AuditLogEvent.RoleCreate]: { score: 15, type: 'executor', reason: 'Created new Social Class (Role)' },
    [AuditLogEvent.RoleUpdate]: { score: 5, type: 'executor', reason: 'Modified Social Class' },
    [AuditLogEvent.RoleDelete]: { score: -10, type: 'executor', reason: 'Dissolved Social Class' },

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
    [AuditLogEvent.MessageDelete]: { score: -50, type: 'target', reason: 'Message Censored (Deleted by State)' }, // If mod deletes your message
    [AuditLogEvent.MessageBulkDelete]: { score: -10, type: 'executor', reason: 'Mass Censorship Performed' }, // Executor gets points? Or neutral.
    [AuditLogEvent.MessagePin]: { score: 20, type: 'target', reason: 'Message Pinned. Exemplary functionality.' }, // Assuming we can find the author (might differ in audit log) 
    [AuditLogEvent.MessageUnpin]: { score: -10, type: 'target', reason: 'Pin Removed. Relevance lost.' },

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
    [AuditLogEvent.AutoModerationRuleUpdate]: { score: 10, type: 'executor', reason: 'Adjusted Law & Order' },
    [AuditLogEvent.AutoModerationRuleDelete]: { score: -50, type: 'executor', reason: 'Removed Law & Order' },
    [AuditLogEvent.AutoModerationBlockMessage]: { score: -100, type: 'target', reason: 'Message Blocked by AutoMod. Violation detected.' },
    [AuditLogEvent.AutoModerationFlagToChannel]: { score: -50, type: 'target', reason: 'Flagged for Review.' },
    [AuditLogEvent.AutoModerationUserCommunicationDisabled]: { score: -200, type: 'target', reason: 'Auto-Silenced.' }
};
