import { AuditLogEvent, GuildEmoji } from "discord.js";
import { KLogging } from "../../../../classes/objects/KLogging";
import { LoggingConfigCategory } from "../../../../enums/LoggingConfigCategory";
import { LoggingConfigType } from "../../../../enums/LoggingConfigType";
import { EmbedColors } from "../../../../modules/Logging";

export default new KLogging({
    logEvent: AuditLogEvent.EmojiDelete,
    loggingConfig: {
        type: LoggingConfigType.EmojiUpdate,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const target = entry.target as GuildEmoji;
        
        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.remove,
            description: "An emoji was removed from the emoji pool.\n" + 
                "**Emoji:** `" + target.name + "`",
            image: {
                url: target.url,
                height: 512,
                width: 512
            }
        });

        return embed;
    }
});