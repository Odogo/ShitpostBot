import { AuditLogEvent, GuildChannel } from "discord.js";
import { Utilities } from "../../classes/Utilities";
import { KLogging } from "../../classes/objects/KLogging";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { EmbedColors } from "../../modules/Logging";

export default new KLogging({
    logEvent: AuditLogEvent.ChannelCreate,
    loggingConfig: {
        category: LoggingConfigCategory.GuildEvents,
        type: LoggingConfigType.ChannelAdd
    },

    embedCallback: async (entry, guild) => {
        const channel = entry.target as GuildChannel;

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.add,
            description: "A [new channel](" + channel.url + ") was created.",
        });

        embed.addFields([
            { name: "Channel Type", value: Utilities.channelTypeString(channel.type) },
            { name: "Channel Name", value: channel.name + "" }
        ]);

        if(channel.parent !== null) {
            embed.addFields([{ name: "Parented Under", value: channel.parent.name }]);
        }

        return embed;
    }
});