import { AuditLogEvent, GuildEmoji } from "discord.js";
import { KLogging } from "../../../../classes/objects/KLogging";
import { LoggingConfigCategory } from "../../../../enums/logging/LoggingConfigCategory";
import { LoggingConfigType } from "../../../../enums/logging/LoggingConfigType";
import { EmbedColors } from "../../../../modules/Logging";

export default new KLogging({
    logEvent: AuditLogEvent.EmojiUpdate,
    loggingConfig: {
        type: LoggingConfigType.EmojiUpdate,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const target = entry.target as GuildEmoji;
        const nameChange = entry.changes.find((v) => v.key === "name");
        if(nameChange === undefined) return null; // somehow?

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.change,
            description: "An emoji's name was modified.\n" + 
            "**Name:** Changed from `" + nameChange.old + "` to `" + nameChange.new + "`\n"
            + "**Emoji ID:** `" + target.id + "`",
        image: {
            url: target.imageURL({ size: 512, extension: 'png' }),
            height: 512,
            width: 512
        }
        });

        return embed;
    }
})