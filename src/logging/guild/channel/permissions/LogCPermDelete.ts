import { AuditLogEvent, GuildAuditLogsEntryExtraField, NonThreadGuildBasedChannel, Role } from "discord.js";
import { KLogging } from "../../../../classes/objects/KLogging";
import { LoggingConfigType } from "../../../../enums/logging/LoggingConfigType";
import { LoggingConfigCategory } from "../../../../enums/logging/LoggingConfigCategory";
import { EmbedColors } from "../../../../modules/Logging";

export default new KLogging({
    logEvent: AuditLogEvent.ChannelOverwriteDelete,
    loggingConfig: {
        type: LoggingConfigType.ChannelModify,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const extra = entry.extra as GuildAuditLogsEntryExtraField[AuditLogEvent.ChannelOverwriteCreate];
        const channel = entry.target as NonThreadGuildBasedChannel;

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.add,
            description: "A [channel's](" + channel.url + ") permissions override was modified to remove:\n" +
                "<#" + channel.id + "> (ID: " + channel.id + ")\n" +
                (extra instanceof Role ? "<@&" + extra.id + "> (Role ID: " + extra.id + ")" : "<@" + extra.id + "> (ID: " + extra.id + ")")
        });

        return embed;
    }
})