import { AuditLogEvent, GuildEmoji } from "discord.js";
import { ShitLogging } from "../../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../../structure/database/MLogging";
import { client } from "../../../..";
import { Logging } from "../../../../structure/modules/Logging";

export default new ShitLogging({
    logEvent: AuditLogEvent.StickerDelete,

    config: {
        type: MLoggingTypeKeys.StickerDeleted,
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
            description: "A sticker was removed from the sticker pool.\n" +
                "**Name:** " + target.name + "\n" +
                "**Related Emoji:** "+ (tagEmoji === null ? "`None set`" : (!Number.isInteger(tagEmoji) ? tagEmoji : "`" + (tagEmoji as GuildEmoji).name + "`")) + "\n" +
                "**Description:** " + (target.description ? target.description : "None set") + "\n" +
                "**Sticker ID:** `" + target.id + "`",
            image: {
                url: target.url,
                width: 512,
                height: 512
            }
        });
    }
})