import { AuditLogEvent, AuditLogOptionsType, GuildAuditLogsActionType, GuildAuditLogsEntryExtraField, GuildAuditLogsEntryTargetField, GuildAuditLogsTargetType, GuildChannel, GuildMember, NonThreadGuildBasedChannel, PermissionsBitField, Role } from "discord.js";
import { KLogging } from "../../../classes/objects/KLogging";
import { LoggingConfigType } from "../../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../../enums/LoggingConfigCategory";
import { EmbedColors } from "../../../modules/Logging";
import { PermissionFields } from "../../../interfaces/PermissionFields";
import { Utilities } from "../../../classes/Utilities";

export default new KLogging({
    logEvent: AuditLogEvent.ChannelOverwriteCreate,
    loggingConfig: {
        type: LoggingConfigType.ChannelModify,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const extra = entry.extra as GuildAuditLogsEntryExtraField[AuditLogEvent.ChannelOverwriteCreate];
        const channel = entry.target as NonThreadGuildBasedChannel;

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.add,
            description: "A [channel's](" + channel.url + ") permissions override was modified to add:\n"
                + (extra instanceof Role ? "<@&" + extra.id + ">" : "<@" + extra.id + ">") + "\n"
                + "which allows the following permissions:\n"
        });

        let _allowed = entry.changes.find((v) => v.key === "allow")?.new, _denied = entry.changes.find((v) => v.key === "deny")?.new;
        const allowedPerms = Utilities.parsePermissions(new PermissionsBitField(BigInt(_allowed + "")));
        const deniedPerms = Utilities.parsePermissions(new PermissionsBitField(BigInt(_denied + "")));

        return embed;
    }
})