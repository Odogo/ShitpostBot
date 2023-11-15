import { AuditLogEvent, NonThreadGuildBasedChannel } from "discord.js";
import { KLogging } from "../../../classes/objects/KLogging";
import { LoggingConfigType } from "../../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../../enums/LoggingConfigCategory";
import { EmbedColors } from "../../../modules/Logging";
import { Utilities } from "../../../classes/Utilities";

export default new KLogging({
    logEvent: AuditLogEvent.ChannelDelete,
    loggingConfig: {
        type: LoggingConfigType.ChannelRemove,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const channel = entry.target as NonThreadGuildBasedChannel;
        
        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.remove,
            description: "A channel was deleted"
        });

        embed.addFields([
            { name: "Channel Type", value: Utilities.channelTypeString(channel.type) },
            { name: "Channel Name", value: channel.name + "" }
        ]);

        return embed;
    }
});