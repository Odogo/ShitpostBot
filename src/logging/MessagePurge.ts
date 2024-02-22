import { AuditLogEvent, GuildTextBasedChannel } from "discord.js";
import { ShitLogging } from "../structure/ShitLogging";
import { MLoggingConfigKeys, MLoggingSettingsKeys } from "../structure/database/MLogging";
import { Logging } from "../structure/modules/Logging";

export default new ShitLogging({
    logEvent: AuditLogEvent.MessageBulkDelete,

    config: {
        type: MLoggingConfigKeys.MessagePurged,
        category: MLoggingSettingsKeys.MessageEvents
    },

    embedCallback: async (entry, guild) => {
        const channel = await guild.channels.fetch(entry.extra.channel.id) as GuildTextBasedChannel;
        const msgCount = entry.extra.count;

        return await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.remove,
            description: "**" + msgCount + "** messages were purged in <#" + channel.id + ">",
        });
    }
});