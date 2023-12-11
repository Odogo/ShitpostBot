import { AuditLogEvent, GuildEmoji } from "discord.js";
import { KLogging } from "../../../../classes/objects/KLogging";
import { LoggingConfigCategory } from "../../../../enums/logging/LoggingConfigCategory";
import { LoggingConfigType } from "../../../../enums/logging/LoggingConfigType";
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
                "**Emoji:** `" + target.name + "`\n"
                + "**Emoji ID:** `" + target.id + "`",
            image: {
                url: target.imageURL({ size: 512, extension: 'png' }),
                height: 512,
                width: 512
            }
        });

        return embed;
    }
});