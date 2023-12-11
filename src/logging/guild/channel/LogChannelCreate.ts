import { AuditLogEvent, NonThreadGuildBasedChannel } from "discord.js";
import { Utilities } from "../../../classes/Utilities";
import { KLogging } from "../../../classes/objects/KLogging";
import { LoggingConfigCategory } from "../../../enums/logging/LoggingConfigCategory";
import { LoggingConfigType } from "../../../enums/logging/LoggingConfigType";
import { EmbedColors } from "../../../modules/Logging";

export default new KLogging({
    logEvent: AuditLogEvent.ChannelCreate,
    loggingConfig: {
        category: LoggingConfigCategory.GuildEvents,
        type: LoggingConfigType.ChannelAdd
    },

    embedCallback: async (entry, guild) => {
        const channel = entry.target as NonThreadGuildBasedChannel;

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.add,
            description: "A [new channel](" + channel.url + ") was created.",
        });

        embed.addFields([
            { name: "Channel Type", value: Utilities.channelTypeString(channel.type) },
            { name: "Channel Name", value: channel.name + "" },
            { name: "Channel ID", value: channel.id + "" }
        ]);

        if(channel.parent !== null) {
            embed.addFields([{ name: "Parented Under", value: channel.parent.name }]);
        }

        return embed;
    }
});