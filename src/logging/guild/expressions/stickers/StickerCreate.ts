import { AuditLogEvent, GuildEmoji } from "discord.js";
import { ShitLogging } from "../../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../../structure/database/MLogging";
import { client } from "../../../..";
import { Logging } from "../../../../structure/modules/Logging";

export default new ShitLogging({
    logEvent: AuditLogEvent.StickerCreate,

    config: {
        type: MLoggingTypeKeys.StickerCreated,
        category: MLoggingCategoryKeys.ExpressionEvents
    },

    embedCallback: async (entry, guild) => {
        const target = entry.target;

        let tagEmoji: GuildEmoji | string | null = null;
        if(target.tags !== null) {
            tagEmoji = client.emojis.resolve(target.tags) || target.tags;
        }

        return await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.add,
            description: "A sticker was added into the sticker pool.\n" +
                "**Name:** " + target.name + "\n" +
                "**Related Emoji:** "+ (tagEmoji === null ? "`None set`" : (!Number.isInteger(tagEmoji) ? tagEmoji : "`" + (tagEmoji as GuildEmoji).name + "`")) + "\n" +
                "**Description:** " + (target.description ? target.description : "None set") + "\n",
            image: {
                url: target.url,
                width: 512,
                height: 512
            }
        });
    }
})