import { AuditLogEvent, GuildEmoji, Sticker } from "discord.js";
import { KLogging } from "../../classes/objects/KLogging";
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";
import { EmbedColors } from "../../modules/Logging";
import { client } from "../..";

export default new KLogging({
    logEvent: AuditLogEvent.StickerUpdate,
    loggingConfig: {
        type: LoggingConfigType.EmojiUpdate,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const sticker = entry.target as Sticker;
        const changes = entry.changes;

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.change,
            description: "A sticker was modified, the changes are:\n",
            image: {
                url: sticker.url,
                width: 512,
                height: 512
            }
        });

        let stickName = changes.find((v) => v.key === "name");
        if(stickName !== undefined) embed.setDescription(embed.data.description + "- **Name:** Changed from `" + stickName.old + "` to `" + stickName.new + "`\n");

        let stickDesc = changes.find((v) => v.key === "description");
        if(stickDesc !== undefined) embed.setDescription(embed.data.description + "- **Description:** Changed from `" + stickDesc.old + "` to `" + stickDesc.new + "`\n");

        let stickTags = changes.find((v) => v.key === "tags");
        if(stickTags !== undefined) {
            let oldTag = (Number.isInteger(stickTags.old) ? client.emojis.resolve(stickTags.old as string) : stickTags.old as string);
            let newTag = (Number.isInteger(stickTags.old) ? client.emojis.resolve(stickTags.new as string) : stickTags.new as string);
            embed.setDescription(embed.data.description + "- **Tag:** Changed from " + oldTag + " to " + newTag + "\n");
        }
        
        return embed;
    }
})