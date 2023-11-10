import { AuditLogEvent, GuildEmoji } from "discord.js";
import { KLogging } from "../../classes/objects/KLogging";
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";
import { EmbedColors } from "../../modules/Logging";

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
            "**Name:** Changed from `" + nameChange.old + "` to `" + nameChange.new + "`",
        image: {
            url: target.url,
            height: 512,
            width: 512
        }
        });

        return embed;
    }
})