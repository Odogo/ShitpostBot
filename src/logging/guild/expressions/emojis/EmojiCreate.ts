import { AuditLogEvent } from "discord.js";
import { ShitLogging } from "../../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../../structure/database/MLogging";
import { Logging } from "../../../../structure/modules/Logging";

export default new ShitLogging({
    logEvent: AuditLogEvent.EmojiCreate,

    config: {
        type: MLoggingTypeKeys.EmojiCreated,
        category: MLoggingCategoryKeys.ExpressionEvents,
    },

    embedCallback: async (entry, guild) => {
        const emoji = await guild.emojis.fetch(entry.targetId!);

        return await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.add,
            description: "An emoji was added into the emoji pool.\n"
                + "**Emoji:** `" + emoji.name + "`\n"
                + "**Emoji ID:** `" + emoji.id + "`\n",
            image: {
                url: emoji.url,
                width: 512,
                height: 512
            }
        });
    }
})