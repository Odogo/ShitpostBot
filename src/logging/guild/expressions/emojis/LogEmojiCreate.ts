import { AuditLogEvent } from "discord.js";
import { KLogging } from "../../../../classes/objects/KLogging";
import { LoggingConfigCategory } from "../../../../enums/logging/LoggingConfigCategory";
import { LoggingConfigType } from "../../../../enums/logging/LoggingConfigType";
import { EmbedColors } from "../../../../modules/Logging";

export default new KLogging({
    logEvent: AuditLogEvent.EmojiCreate,
    loggingConfig: {
        type: LoggingConfigType.EmojiUpdate,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        if(entry.targetId === null) return null; // somehow?
        const emoji = await guild.emojis.fetch(entry.targetId);

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.add,
            description: "An emoji was added into the emoji pool.\n"
                + "**Emoji**: `" + emoji.name + "`\n"
                + "**Emoji ID:** `" + emoji.id + "`",
            image: {
                url: emoji.imageURL({ size: 512, extension: 'png' }),
                width: 512,
                height: 512
            }
        });

        return embed;
    }
});