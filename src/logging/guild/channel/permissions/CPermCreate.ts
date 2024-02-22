import { AuditLogEvent, GuildMember, NonThreadGuildBasedChannel, Role } from "discord.js";
import { ShitLogging } from "../../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../../structure/database/MLogging";
import { Logging } from "../../../../structure/modules/Logging";

export default new ShitLogging({
    logEvent: AuditLogEvent.ChannelOverwriteCreate,

    config: {
        type: MLoggingTypeKeys.ChannelModified,
        category: MLoggingCategoryKeys.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const extra = entry.extra as Role | GuildMember;
        const channel = entry.target as NonThreadGuildBasedChannel;

        const embed = await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.add,
            description: "A [channel's](" + channel.url + ") permissions override was modified to add:\n" +
                "<#" + channel.id + "> (ID: " + channel.id + ")\n" +
                (extra instanceof Role ? "<@&" + extra.id + "> (Role ID: " + extra.id + ")" : "<@" + extra.id + "> (ID: " + extra.id + ")")
        });

        return embed;
    }
})