import { AuditLogEvent, GuildAuditLogsEntryExtraField, NonThreadGuildBasedChannel } from "discord.js";
import { KLogging } from "../classes/objects/KLogging";
import { LoggingConfigType } from "../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../enums/LoggingConfigCategory";
import { EmbedColors } from "../modules/Logging";

export default new KLogging({
    logEvent: AuditLogEvent.MessageBulkDelete,
    loggingConfig: {
        type: LoggingConfigType.MessagePurged,
        category: LoggingConfigCategory.MessageEvents
    },

    embedCallback: async (entry, guild) => {
        const channel = entry.target as NonThreadGuildBasedChannel;
        const extra = entry.extra as GuildAuditLogsEntryExtraField[AuditLogEvent.MessageBulkDelete];
        const msgCount = extra.count;

        return await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.remove,
            description: "**" + msgCount + "** messages were deleted in <#" + channel.id + ">"
        });;
    }
})