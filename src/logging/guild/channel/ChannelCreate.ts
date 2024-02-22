import { AuditLogEvent, NonThreadGuildBasedChannel } from "discord.js";
import { ShitLogging } from "../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../structure/database/MLogging";
import { Logging } from "../../../structure/modules/Logging";
import { Utilities } from "../../../structure/Utilities";

export default new ShitLogging({
    logEvent: AuditLogEvent.ChannelCreate,

    config: {
        type: MLoggingTypeKeys.ChannelCreated,
        category: MLoggingCategoryKeys.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const channel = entry.target as NonThreadGuildBasedChannel;

        const embed = await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.add,
            description: "A [new channel](" + channel.url + ") was created",
            fields: [
                { name: "Channel Type", value: Utilities.channelTypeString(channel.type) },
                { name: "Channel Name", value: "<#" + channel.id + ">" },
                { name: "Channel ID", value: channel.id }
            ]
        });

        if(channel.parent !== null) {
            embed.addFields([
                { name: "Parented Under", value: channel.parent.name }
            ]);
        }

        return embed;
    }
})