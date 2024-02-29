import { APIAuditLogChange, AuditLogEvent } from "discord.js";
import { ShitLogging } from "../../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../../structure/database/MLogging";
import { Logging } from "../../../../structure/modules/Logging";
import { client } from "../../../..";

export default new ShitLogging({
    logEvent: AuditLogEvent.StickerUpdate,

    config: {
        type: MLoggingTypeKeys.StickerModified,
        category: MLoggingCategoryKeys.ExpressionEvents
    },

    embedCallback: async (entry, guild) => {
        const target = entry.target;
        const changes = entry.changes;

        const embed = await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.change,
            description: "A sticker was updated to reflect the following changes:\n",
            image: {
                url: target.url,
                width: 512,
                height: 512
            }
        });

        changes.forEach((change) => {
            switch (change.key) {
                case "name":
                    embed.setDescription(`${embed.data.description}- **Name:** Changed from \`${change.old}\` to \`${change.new}\`\n`);
                    break;
                case "description":
                    embed.setDescription(`${embed.data.description}- **Description:** Changed from \`${change.old}\` to \`${change.new}\`\n`);
                    break;
                case "tags":
                    embed.setDescription(`${embed.data.description}- **Tag:** Changed from ${getTag(change.old)} to ${getTag(change.new)}\n`);
                    break;
                default:
                    break;
            }
        });
        
        return embed;
    }
});

function getTag(change: APIAuditLogChange['old_value'] | APIAuditLogChange['new_value']) {
    return Number.isInteger(change) ? client.emojis.resolve(change as string) : change as string;
}