import { AuditLogEvent, NonThreadGuildBasedChannel } from "discord.js";
import { ShitLogging } from "../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../structure/database/MLogging";
import { Logging } from "../../../structure/modules/Logging";
import { Utilities } from "../../../structure/Utilities";

export default new ShitLogging({
    logEvent: AuditLogEvent.ChannelDelete,
    
    config: {
        type: MLoggingTypeKeys.ChannelDeleted,
        category: MLoggingCategoryKeys.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const channel = entry.target as NonThreadGuildBasedChannel;

        const embed = await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.remove,
            description: "A channel was deleted",
            fields: [
                { name: "Channel Type", value: Utilities.channelTypeString(channel.type) },
                { name: "Channel Name", value: channel.name + "" },
                { name: "Channel ID", value: channel.id + "" }
            ]
        });

        return embed;
    }
})