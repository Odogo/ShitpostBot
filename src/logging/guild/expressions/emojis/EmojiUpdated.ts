import { AuditLogEvent, GuildEmoji } from "discord.js";
import { ShitLogging } from "../../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../../structure/database/MLogging";
import { Logging } from "../../../../structure/modules/Logging";

export default new ShitLogging({
    logEvent: AuditLogEvent.EmojiUpdate,

    config: {
        type: MLoggingTypeKeys.EmojiModified,
        category: MLoggingCategoryKeys.ExpressionEvents
    },

    embedCallback: async (entry, guild) => {
        const target = entry.target as GuildEmoji;
        const nameChange = entry.changes.find((v) => v.key === "name")!;

        return await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.change,
            description: "An emoji's name was modified.\n" +
                "**Name:** Changed from `" + nameChange.old + "` to `" + nameChange.new + "`\n" +
                "**Emoji ID:** `" + target.id + "`",
            image: {
                url: target.url,
                height: 512,
                width: 512
            }
        });
    }
})