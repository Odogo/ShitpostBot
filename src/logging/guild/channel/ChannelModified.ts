import { AuditLogEvent, NonThreadGuildBasedChannel } from "discord.js";
import { ShitLogging } from "../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../structure/database/MLogging";
import { Logging } from "../../../structure/modules/Logging";
import { Utilities } from "../../../structure/Utilities";

export default new ShitLogging({
    logEvent: AuditLogEvent.ChannelUpdate,

    config: {
        type: MLoggingTypeKeys.ChannelModified,
        category: MLoggingCategoryKeys.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const channel = entry.target as NonThreadGuildBasedChannel;

        const embed = await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.change,
            description: `A [channel](${channel.url}) was updated\n<#${channel.id}> (ID: ${channel.id})`,
        });

        if (channel.parent !== null) {
            embed.addFields({ name: "Under category", value: channel.parent.name });
        }

        entry.changes.sort((a, b) => a.key.localeCompare(b.key)).forEach((change) => {
            const newKey = Utilities.auditLogKey(change.key);
            const newOld = change.old ?? "Not set";
            const newNew = change.new ?? "Not set";

            embed.addFields({ name: newKey, value: `Previously \`${newOld}\`, now \`${newNew}\`` });
        });

        return embed;
    }
})