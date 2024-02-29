import { AuditLogEvent, GuildEmoji } from 'discord.js';
import { ShitLogging } from '../../../../structure/ShitLogging';
import { MLoggingCategoryKeys, MLoggingTypeKeys } from '../../../../structure/database/MLogging';
import { Logging } from '../../../../structure/modules/Logging';

export default new ShitLogging({
    logEvent: AuditLogEvent.EmojiDelete,

    config: {
        type: MLoggingTypeKeys.EmojiDeleted,
        category: MLoggingCategoryKeys.ExpressionEvents
    },

    embedCallback: async (entry, guild) => {
        const target = entry.target as GuildEmoji;

        return await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.remove,
            description: "An emoji was removed from the emoji pool.\n" +
                "**Emoji:** `" + target.name + "`\n" +
                "**Emoji ID:** `" + target.id + "`",
            image: {
                url: target.url,
                height: 512,
                width: 512
            }
        });
    }
});