import { AuditLogEvent, GuildEmoji, Sticker, StickerFormatType } from "discord.js";
import { KLogging } from "../../../../classes/objects/KLogging";
import { LoggingConfigCategory } from "../../../../enums/logging/LoggingConfigCategory";
import { LoggingConfigType } from "../../../../enums/logging/LoggingConfigType";
import { EmbedColors } from "../../../../modules/Logging";
import { client } from "../../../..";

export default new KLogging({
    logEvent: AuditLogEvent.StickerDelete,
    loggingConfig: {
        type: LoggingConfigType.EmojiUpdate,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const target = entry.target as Sticker;
        
        let tagEmoji: GuildEmoji | string | null = null;
        if(target.tags !== null) {
            tagEmoji = client.emojis.resolve(target.tags) || target.tags;
        }

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.remove,
            description: "A sticker was removed from the sticker pool.\n"
                + "**Name:** " + target.name + "\n"
                + "**Related Emoji:** " + (tagEmoji === null ? "`None set`" : (!Number.isInteger(tagEmoji) ? tagEmoji : "`" + (tagEmoji as GuildEmoji).name + "`")) + "`\n"
                + "**Description:** " + (target.description ? target.description : "None set") + "\n"
                + "**File Type:** " + (target.type ? StickerFormatType[target.format] : "None set"),
            image: {
                url: target.url,
                width: 512,
                height: 512
            }
        });

        return embed;
    }
});